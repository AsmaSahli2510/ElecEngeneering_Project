const { User } = require("../models");
const { comparePassword, hashPassword, signToken } = require("../utils/auth");
const { HttpError, handle } = require("../utils/http");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const publicUser = (user) => ({ id: user._id, email: user.email });

// Inscription : e-mail + mot de passe + confirmation, rien de plus (compte simple). Chaque compte obtient
// ensuite son propre espace projets — voir `owner` sur le modèle Project et le middleware requireAuth.
const register = handle(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const { password, confirmPassword } = req.body || {};

  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Adresse e-mail invalide.");
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
  }
  if (password !== confirmPassword) throw new HttpError(400, "Les mots de passe ne correspondent pas.");

  const existing = await User.findOne({ email });
  if (existing) throw new HttpError(409, "Cette adresse e-mail est déjà utilisée.");

  const user = await User.create({ email, passwordHash: await hashPassword(password) });
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
});

const login = handle(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const { password } = req.body || {};

  const user = email && (await User.findOne({ email }));
  const valid = user && typeof password === "string" && (await comparePassword(password, user.passwordHash));
  if (!valid) throw new HttpError(401, "Adresse e-mail ou mot de passe incorrect.");

  res.json({ token: signToken(user._id), user: publicUser(user) });
});

const me = handle(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(401, "Session invalide ou expirée");
  res.json(publicUser(user));
});

module.exports = { register, login, me };
