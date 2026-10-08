import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { httpError } from "../utils/httpError.js";
import signToken from "../utils/token.js";

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

const sendAuth = (res, user, status = 200) =>
  res.status(status).json({ token: signToken(user._id), user: publicUser(user) });

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    throw httpError(400, "Name, email and password are required");
  }
  if (!["client", "freelancer"].includes(role)) {
    throw httpError(400, "Choose whether you are a client or a freelancer");
  }
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw httpError(400, "This email is already registered");

  const user = await User.create({ name, email, password, role });
  sendAuth(res, user, 201);
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, "Email and password are required");

  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    throw httpError(401, "Wrong email or password");
  }
  sendAuth(res, user);
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
