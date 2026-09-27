const express = require("express");
const auth = require("../controllers/authController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);
router.get("/auth/me", requireAuth, auth.me);

module.exports = router;
