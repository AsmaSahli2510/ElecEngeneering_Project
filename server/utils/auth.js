const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function requireSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return secret;
}

const hashPassword = (password) => bcrypt.hash(password, 10);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

const signToken = (userId) => jwt.sign({ sub: String(userId) }, requireSecret(), { expiresIn: JWT_EXPIRES_IN });
const verifyToken = (token) => jwt.verify(token, requireSecret());

module.exports = { hashPassword, comparePassword, signToken, verifyToken };
