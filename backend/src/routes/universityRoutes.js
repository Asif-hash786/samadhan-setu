import express from "express";
import {
  getUniversities,
  getUniversityProjects,
  respondToAssignment,
  getUniversityExpertise,
updateUniversityExpertise,
getUniversityApplications,
reviewUniversityApplication,
} from "../controllers/universityController.js";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";
import { completeProjectMilestone } from "../controllers/universityController.js";
import { updateProjectTeam } from "../controllers/universityController.js";
const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  getUniversities
);

router.get(
  "/projects/mine",
  authenticate,
  authorizeRoles("UNIVERSITY"),
  getUniversityProjects
);

router.patch(
  "/assignments/:assignmentId/respond",
  authenticate,
  authorizeRoles("UNIVERSITY"),
  respondToAssignment
);

router.patch(
  "/assignments/:assignmentId/progress",
  authenticate,
  authorizeRoles("UNIVERSITY"),
  completeProjectMilestone
);
router.patch(
  "/assignments/:assignmentId/team",
  authenticate,
  authorizeRoles("UNIVERSITY"),
  updateProjectTeam
);
router.get(
  "/profile",
  authenticate,
  authorizeRoles("UNIVERSITY"),
  getUniversityExpertise
);

router.patch(
  "/profile",
  authenticate,
  authorizeRoles("UNIVERSITY"),
  updateUniversityExpertise
);
router.get(
  "/applications",
  authenticate,
  authorizeRoles("ADMIN"),
  getUniversityApplications
);

router.patch(
  "/applications/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  reviewUniversityApplication
);
export default router;