import express from "express";

import {
  createChallenge,
  getChallengeById,
  getChallenges,
  getChallengeStats,
  getMyChallenges,
  updateChallengeStatus,
  validateProjectSolution,
  analyzeReport,
  updateChallengeClassification,
  getPossibleDuplicates
} from "../controllers/challengeController.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";
import { assignUniversities } from "../controllers/assignmentController.js";

const router = express.Router();

router.get("/", getChallenges);
router.get("/stats/summary", getChallengeStats);
router.get("/mine", authenticate, getMyChallenges);
router.post(
  "/:id/assign-universities",
  authenticate,
  authorizeRoles("ADMIN"),
  assignUniversities
);
router.get("/:id", getChallengeById);

router.post("/", authenticate, createChallenge);
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("ADMIN"),
  updateChallengeStatus
);
router.patch(
  "/:id/assignments/:assignmentId/validate",
  authenticate,
  authorizeRoles("CITIZEN"),
  validateProjectSolution
);
router.post(
  "/:id/analyze",
  authenticate,
  authorizeRoles("ADMIN"),
  analyzeReport
);
router.patch(
  "/:id/classification",
  authenticate,
  authorizeRoles("ADMIN"),
  updateChallengeClassification
);
router.get(
  "/:id/duplicates",
  authenticate,
  authorizeRoles("ADMIN"),
  getPossibleDuplicates
);
export default router;