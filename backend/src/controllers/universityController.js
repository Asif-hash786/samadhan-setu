import prisma from "../config/prisma.js";

export async function getUniversities(req, res) {
  try {
    const universities = await prisma.user.findMany({
      where: {
        role: "UNIVERSITY",
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            challengeAssignments: true,
          },
        },
        departments: true,
        skills: true,
        researchAreas: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: universities.length,
      universities,
    });
  } catch (error) {
    console.error("Get universities error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load universities",
    });
  }
}

export async function getUniversityProjects(req, res) {
  try {
    const assignments =
      await prisma.challengeAssignment.findMany({
        where: {
          universityId: req.user.id,
        },
        include: {
          challenge: true,
        },
        orderBy: {
          assignedAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Get university projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load university projects",
    });
  }
}
export async function respondToAssignment(req, res) {
  try {
    const assignmentId = req.params.assignmentId;
    const { status, proposal } = req.body;

    const allowedStatuses = ["ACCEPTED", "REJECTED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACCEPTED or REJECTED",
      });
    }

    if (
      status === "ACCEPTED" &&
      (!proposal || proposal.trim().length < 20)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a proposal containing at least 20 characters",
      });
    }

    const existingAssignment =
      await prisma.challengeAssignment.findFirst({
        where: {
          id: assignmentId,
          universityId: req.user.id,
        },
      });

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (existingAssignment.status !== "INVITED") {
      return res.status(400).json({
        success: false,
        message: "This invitation has already been answered",
      });
    }

    const assignment =
      await prisma.challengeAssignment.update({
        where: {
          id: assignmentId,
        },
        data: {
          status,
          proposal:
            status === "ACCEPTED" ? proposal.trim() : null,
          respondedAt: new Date(),
        },
        include: {
          challenge: true,
          university: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      message:
        status === "ACCEPTED"
          ? "Challenge invitation accepted"
          : "Challenge invitation rejected",
      assignment,
    });
  } catch (error) {
    console.error("Assignment response error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to respond to the invitation",
    });
  }
}
export async function completeProjectMilestone(req, res) {
  const { assignmentId } = req.params;
  const { updateNote } = req.body;

  if (
    typeof updateNote !== "string" ||
    updateNote.trim().length < 10 ||
    updateNote.trim().length > 5000
  ) {
    return res.status(400).json({
      success: false,
      message: "Progress update must contain 10–5000 characters",
    });
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const assignment = await tx.challengeAssignment.findFirst({
          where: {
            id: assignmentId,
            universityId: req.user.id,
          },
          include: {
            challenge: true,
          },
        });

        if (!assignment) {
          return {
            code: 404,
            message: "Project assignment not found",
          };
        }

        if (
          ["Resolved", "Rejected"].includes(assignment.challenge.status)
        ) {
          return {
            code: 409,
            message: "This challenge is closed for progress updates",
          };
        }

        if (
          assignment.status !== "ACCEPTED" ||
          assignment.progress >= 100
        ) {
          return {
            code: 409,
            message: "This project is not awaiting a milestone update",
          };
        }

        const milestone = assignment.currentMilestone;

        if (
          !Number.isInteger(milestone) ||
          milestone < 1 ||
          milestone > 5
        ) {
          return {
            code: 409,
            message: "Invalid project milestone. Contact an administrator",
          };
        }

        const progress = milestone * 20;
        const readyForReview = progress === 100;

        await tx.challengeAssignment.update({
          where: { id: assignment.id },
          data: {
            progress,
            currentMilestone: Math.min(milestone + 1, 5),
            lastUpdate: updateNote.trim(),
            status: readyForReview ? "COMPLETED" : "ACCEPTED",
            ...(readyForReview
              ? {
                validationStatus: "PENDING",
                validationRequestedAt: new Date(),
                validatedAt: null,
                validationFeedback: null,
              }
              : {}),
          },
        });

        // Read every team's progress before updating the shared challenge.
        const projects = await tx.challengeAssignment.findMany({
          where: {
            challengeId: assignment.challengeId,
            status: { in: ["ACCEPTED", "COMPLETED"] },
          },
          select: {
            progress: true,
            validationStatus: true,
          },
        });

        const confirmed = projects.some(
          (project) => project.validationStatus === "CONFIRMED"
        );

        const awaitingValidation = projects.some(
          (project) => project.validationStatus === "PENDING"
        );

        const highestProgress = Math.max(
          0,
          ...projects.map((project) => project.progress)
        );

        const status = confirmed
          ? "Resolved"
          : awaitingValidation
            ? "Awaiting Community Validation"
            : highestProgress >= 60
              ? "Pilot in Progress"
              : "University Matched";

        const challengeProgress = confirmed
          ? 100
          : awaitingValidation
            ? 95
            : Math.min(94, 60 + Math.round(highestProgress * 0.35));

        await tx.challenge.update({
          where: { id: assignment.challengeId },
          data: {
            status,
            progress: challengeProgress,
          },
        });

        // Fetch after updating the challenge so the response is current.
        const updatedAssignment =
          await tx.challengeAssignment.findUnique({
            where: { id: assignment.id },
            include: { challenge: true },
          });

        return {
          code: 200,
          message: readyForReview
            ? "Project submitted for citizen validation"
            : "Milestone completed successfully",
          assignment: updatedAssignment,
        };
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return res.status(result.code).json({
      success: result.code === 200,
      message: result.message,
      ...(result.assignment
        ? { assignment: result.assignment }
        : {}),
    });
  } catch (error) {
    console.error("Milestone update error:", error);

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "Another update occurred. Refresh the project and try again",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update the project milestone",
    });
  }
}
export async function updateProjectTeam(req, res) {
  try {
    const assignmentId = req.params.assignmentId;

    const {
      teamName,
      facultyMentor,
      studentCount,
    } = req.body;

    if (!teamName?.trim() || !facultyMentor?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Team name and faculty mentor are required",
      });
    }

    const parsedStudentCount = Number(studentCount);

    if (
      !Number.isInteger(parsedStudentCount) ||
      parsedStudentCount < 1 ||
      parsedStudentCount > 50
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Student count must be between 1 and 50",
      });
    }

    const assignment =
      await prisma.challengeAssignment.findFirst({
        where: {
          id: assignmentId,
          universityId: req.user.id,
        },
      });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Project assignment not found",
      });
    }

    if (
      !["ACCEPTED", "COMPLETED"].includes(
        assignment.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Accept the invitation before creating a project team",
      });
    }

    const updatedAssignment =
      await prisma.challengeAssignment.update({
        where: {
          id: assignment.id,
        },
        data: {
          teamName: teamName.trim(),
          facultyMentor: facultyMentor.trim(),
          studentCount: parsedStudentCount,
        },
        include: {
          challenge: true,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Project team saved successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Project team update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save the project team",
    });
  }
}
export async function getUniversityExpertise(req, res) {
  try {
    const university = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        departments: true,
        skills: true,
        researchAreas: true,
      },
    });

    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University account not found.",
      });
    }

    return res.json({
      success: true,
      university,
    });
  } catch (error) {
    console.error("Get expertise error:", error.name);

    return res.status(500).json({
      success: false,
      message: "Unable to load university expertise.",
    });
  }
}

export async function updateUniversityExpertise(req, res) {
  const fields = ["departments", "skills", "researchAreas"];
  const data = {};

  for (const field of fields) {
    const values = req.body?.[field];

    if (
      !Array.isArray(values) ||
      values.length > 20 ||
      values.some(
        (value) =>
          typeof value !== "string" ||
          !value.trim() ||
          value.trim().length > 100
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${field} must be a list of up to 20 non-empty entries, ` +
          "each no longer than 100 characters.",
      });
    }

    const seen = new Set();

    data[field] = values
      .map((value) => value.trim())
      .filter((value) => {
        const normalized = value.toLowerCase();

        if (seen.has(normalized)) return false;

        seen.add(normalized);
        return true;
      });
  }

  try {
    const university = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        name: true,
        departments: true,
        skills: true,
        researchAreas: true,
      },
    });

    return res.json({
      success: true,
      message: "University expertise saved.",
      university,
    });
  } catch (error) {
    console.error("Update expertise error:", error.name);

    return res.status(error.code === "P2025" ? 404 : 500).json({
      success: false,
      message:
        error.code === "P2025"
          ? "University account not found."
          : "Unable to save university expertise.",
    });
  }
}
export async function getUniversityApplications(req, res) {
  try {
    const applications = await prisma.user.findMany({
      where: { role: "UNIVERSITY_PENDING" },
      select: {
        id: true,
        name: true,
        email: true,
        departments: true,
        skills: true,
        researchAreas: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Load university applications:", error.name);

    return res.status(500).json({
      success: false,
      message: "Unable to load applications.",
    });
  }
}

export async function reviewUniversityApplication(req, res) {
  const { decision } = req.body || {};

  if (!["APPROVE", "REJECT"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "Decision must be APPROVE or REJECT.",
    });
  }

  try {
    const result = await prisma.user.updateMany({
      where: {
        id: req.params.id,
        role: "UNIVERSITY_PENDING",
      },
      data: {
        role:
          decision === "APPROVE"
            ? "UNIVERSITY"
            : "UNIVERSITY_REJECTED",
      },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Application not found or already reviewed. Refresh the list.",
      });
    }

    return res.json({
      success: true,
      message:
        decision === "APPROVE"
          ? "University approved. It can now log in."
          : "University application rejected.",
    });
  } catch (error) {
    console.error("Review university application:", error.name);

    return res.status(500).json({
      success: false,
      message: "Unable to review application.",
    });
  }
}