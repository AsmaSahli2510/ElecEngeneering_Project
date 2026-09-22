require("dotenv").config();

const cors = require("cors");
const express = require("express");
const connectDatabase = require("./config/db");
const apiRoutes = require("./routes");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "elec-project-api" });
});

app.use("/api", apiRoutes);
app.use("/api", (req, res) => res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` }));

app.use((error, req, res, next) => {
  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || {}).filter((field) => field !== "cabinetId" && field !== "projectId");
    return res
      .status(409)
      .json({ message: `Cette valeur existe déjà (${fields.join(", ") || "doublon"}).` });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: `Valeur invalide pour « ${error.path} ».` });
  }
  console.error(error);
  const status = error.name === "ValidationError" ? 400 : error.status || 500;
  res
    .status(status)
    .json({ message: error.message || "Internal server error" });
});

async function startServer() {
  try {
    await connectDatabase();
    app.listen(port, () =>
      console.log(`API listening on http://localhost:${port}`),
    );
  } catch (error) {
    console.error(`Unable to start API: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
