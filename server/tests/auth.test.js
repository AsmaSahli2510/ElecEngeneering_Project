// Authentification (inscription/connexion) et isolation des données entre comptes : le projet d'un compte ne
// doit être ni visible ni modifiable par un autre compte.
// Lancer avec : npm test   (nécessite un MongoDB local ; MONGO_TEST_URI pour en cibler un autre)

const assert = require("node:assert/strict");
const { after, before, describe, it } = require("node:test");
const mongoose = require("mongoose");
const { app } = require("../server");

const DB_URI = `${process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/elec-project-test"}-auth-${process.pid}`;
let server;
let base;

async function call(method, url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(base + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

before(async () => {
  await mongoose.connect(DB_URI);
  await mongoose.connection.db.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((Model) => Model.init()));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

describe("authentification et espaces par compte", () => {
  it("inscription : e-mail invalide, mot de passe trop court, confirmation différente -> 400", async () => {
    assert.equal((await call("POST", "/auth/register", { email: "pas-un-email", password: "abcdef", confirmPassword: "abcdef" })).status, 400);
    assert.equal((await call("POST", "/auth/register", { email: "a@b.com", password: "123", confirmPassword: "123" })).status, 400);
    assert.equal((await call("POST", "/auth/register", { email: "a@b.com", password: "abcdef", confirmPassword: "autre" })).status, 400);
  });

  it("inscription puis connexion : jeton renvoyé, e-mail en doublon refusé, mauvais mot de passe refusé", async () => {
    const registered = await call("POST", "/auth/register", { email: "Alice@ElecProject.tn", password: "motdepasse1", confirmPassword: "motdepasse1" });
    assert.equal(registered.status, 201, JSON.stringify(registered.body));
    assert.ok(registered.body.token);
    assert.equal(registered.body.user.email, "alice@elecproject.tn", "e-mail normalisé en minuscules");

    assert.equal((await call("POST", "/auth/register", { email: "alice@elecproject.tn", password: "autreautre", confirmPassword: "autreautre" })).status, 409);

    const login = await call("POST", "/auth/login", { email: "alice@elecproject.tn", password: "motdepasse1" });
    assert.equal(login.status, 200);
    assert.ok(login.body.token);

    assert.equal((await call("POST", "/auth/login", { email: "alice@elecproject.tn", password: "mauvais" })).status, 401);
    assert.equal((await call("POST", "/auth/login", { email: "inconnu@elecproject.tn", password: "motdepasse1" })).status, 401);
  });

  it("routes protégées : 401 sans jeton, 401 avec jeton invalide, 200 avec un jeton valide", async () => {
    assert.equal((await call("GET", "/projects")).status, 401);
    assert.equal((await call("GET", "/projects", undefined, "un-jeton-invalide")).status, 401);

    const { body } = await call("POST", "/auth/register", { email: "bob@elecproject.tn", password: "motdepasse1", confirmPassword: "motdepasse1" });
    assert.equal((await call("GET", "/projects", undefined, body.token)).status, 200);
    assert.equal((await call("GET", "/auth/me", undefined, body.token)).body.email, "bob@elecproject.tn");
  });

  it("chaque compte a son propre espace : un projet créé par un compte est invisible et inaccessible pour un autre", async () => {
    const alice = (await call("POST", "/auth/register", { email: "alice2@elecproject.tn", password: "motdepasse1", confirmPassword: "motdepasse1" })).body.token;
    const bob = (await call("POST", "/auth/register", { email: "bob2@elecproject.tn", password: "motdepasse1", confirmPassword: "motdepasse1" })).body.token;

    const project = await call("POST", "/projects", { name: "Projet d'Alice", reference: "PROJ-ALICE-001", client: "Client A", installationSite: "Site A" }, alice);
    assert.equal(project.status, 201);
    const projectId = project.body._id;

    // Alice voit son projet, dans sa liste comme dans le résumé du tableau de bord.
    assert.equal((await call("GET", "/projects", undefined, alice)).body.length, 1);
    assert.equal((await call("GET", "/projects/summary", undefined, alice)).body.length, 1);
    assert.equal((await call("GET", `/projects/${projectId}`, undefined, alice)).status, 200);

    // Bob, lui, ne voit rien : ni dans sa liste, ni en accès direct par l'identifiant du projet d'Alice.
    assert.equal((await call("GET", "/projects", undefined, bob)).body.length, 0);
    assert.equal((await call("GET", "/projects/summary", undefined, bob)).body.length, 0);
    assert.equal((await call("GET", `/projects/${projectId}`, undefined, bob)).status, 404);
    assert.equal((await call("GET", `/projects/${projectId}/overview`, undefined, bob)).status, 404);
    assert.equal((await call("PATCH", `/projects/${projectId}`, { name: "Piraté" }, bob)).status, 404);
    assert.equal((await call("DELETE", `/projects/${projectId}`, undefined, bob)).status, 404);

    // Bob ne peut pas non plus créer une armoire sous le projet d'Alice en devinant son identifiant.
    assert.equal((await call("POST", "/cabinets", { projectId, reference: "AR-PIRATE" }, bob)).status, 404);

    // Deux comptes peuvent réutiliser la même référence de projet : chacun a son propre espace.
    const bobProject = await call("POST", "/projects", { name: "Projet de Bob", reference: "PROJ-ALICE-001", client: "Client B", installationSite: "Site B" }, bob);
    assert.equal(bobProject.status, 201, JSON.stringify(bobProject.body));
  });

  it("guide de bienvenue : non vu à l'inscription, puis mémorisé sur le compte", async () => {
    const registered = await call("POST", "/auth/register", { email: "dave@elecproject.tn", password: "motdepasse1", confirmPassword: "motdepasse1" });
    const token = registered.body.token;
    assert.equal(registered.body.user.onboardingDone, false);

    assert.equal((await call("PATCH", "/auth/onboarding", { done: true }, token)).body.onboardingDone, true);
    assert.equal((await call("GET", "/auth/me", undefined, token)).body.onboardingDone, true);
    const login = await call("POST", "/auth/login", { email: "dave@elecproject.tn", password: "motdepasse1" });
    assert.equal(login.body.user.onboardingDone, true);

    assert.equal((await call("PATCH", "/auth/onboarding", { done: false }, token)).body.onboardingDone, false);
    assert.equal((await call("PATCH", "/auth/onboarding", { done: true })).status, 401);
  });

  it("la référence de projet est attribuée automatiquement : PROJ-<année>-001, puis 002, ... par compte", async () => {
    const carol = (await call("POST", "/auth/register", { email: "carol@elecproject.tn", password: "motdepasse1", confirmPassword: "motdepasse1" })).body.token;
    const year = new Date().getUTCFullYear();
    const payload = { name: "Projet", client: "Client", installationSite: "Site" };

    assert.equal((await call("GET", "/projects/next-reference", undefined, carol)).body.reference, `PROJ-${year}-001`);
    // La référence envoyée par le client est ignorée.
    const first = await call("POST", "/projects", { ...payload, reference: "SAISIE-LIBRE" }, carol);
    assert.equal(first.body.reference, `PROJ-${year}-001`);
    const second = await call("POST", "/projects", payload, carol);
    assert.equal(second.body.reference, `PROJ-${year}-002`);
    assert.equal((await call("GET", "/projects/next-reference", undefined, carol)).body.reference, `PROJ-${year}-003`);
  });
});
