import express from "express";

import {
  getCurrentUser,
  login,
  register,
  registerUniversity,
} from "../controllers/authController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/register-university", registerUniversity);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);

export default router;