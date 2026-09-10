import prisma from "../config/prisma.js";
import cloudinary from "../config/cloudinary.js";
import { analyzeChallenge } from "../services/aiService.js";
import { findPossibleDuplicates } from "../services/duplicateService.js";
const allowedStatuses = [
  "Submitted",
  "Under Review",
  "Verified",
  "Rejected",
  "University Matched",
  "Pilot in Progress",
];

function calculatePriority(category) {
  const highPriorityCategories = [
    "Health",
    "Safety",
    "Water",
    "Sanitation",
    "Emergency",
  ];

  return highPriorityCategories.includes(category) ? "High" : "Medium";
}

function createTrackingId() {
  const timestamp = Date.now().toString().slice(-6);
  const randomNumber = Math.floor(100 + Math.random() * 900);

  return `SS-${timestamp}${randomNumber}`;
}

export async function getChallenges(req, res) {
  try {
    const challenges = await prisma.challenge.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: challenges.length,
      challenges,
    });
  } catch (error) {
    console.error("Get challenges error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load challenges",
    });
  }
}

export async function getChallengeById(req, res) {
  try {
    const identifier = req.params.id;

    const challenge = await prisma.challenge.findFirst({
      where: {
        OR: [
          { id: identifier },
          { trackingId: identifier },
        ],
      },
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    return res.status(200).json({
      success: true,
      challenge,
    });
  } catch (error) {
    console.error("Get challenge error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load the challenge",
    });
  }
}

export async function createChallenge(req, res) {
  try {
    const {
      title,
      description,
      category,
      location,
      latitude,
      longitude,
      evidencePublicId,
      evidenceResourceType,
    } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message:
          "Title, description, category and location are required",
      });
    }
    let evidenceData = {
      evidenceUrl: null,
      evidencePublicId: null,
      evidenceResourceType: null,
    };

    const hasEvidence =
      evidencePublicId != null || evidenceResourceType != null;

    if (hasEvidence) {
      const expectedPrefix =
        `samadhan-setu/evidence/${req.user.id}/`;

      if (
        typeof evidencePublicId !== "string" ||
        !evidencePublicId.startsWith(expectedPrefix) ||
        !["image", "video"].includes(evidenceResourceType)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid evidence reference.",
        });
      }

      let uploadedFile;

      try {
        uploadedFile = await cloudinary.api.resource(
          evidencePublicId,
          {
            resource_type: evidenceResourceType,
            type: "upload",
          }
        );
      } catch (lookupError) {
        const notFound = lookupError.http_code === 404;

        return res.status(notFound ? 400 : 502).json({
          success: false,
          message: notFound
            ? "Evidence was not found. Please upload it again."
            : "Unable to verify evidence. Please try again.",
        });
      }

      const allowedFormat =
        uploadedFile.resource_type === "image"
          ? ["jpg", "jpeg", "png"].includes(uploadedFile.format)
          : uploadedFile.resource_type === "video" &&
          uploadedFile.format === "mp4";

      if (
        !allowedFormat ||
        uploadedFile.bytes > 10 * 1024 * 1024
      ) {
        return res.status(400).json({
          success: false,
          message: "Evidence must be JPG, PNG or MP4 under 10 MB.",
        });
      }

      evidenceData = {
        evidenceUrl: uploadedFile.secure_url,
        evidencePublicId: uploadedFile.public_id,
        evidenceResourceType: uploadedFile.resource_type,
      };
    }

    const challenge = await prisma.challenge.create({
      data: {
        trackingId: createTrackingId(),
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        priority: calculatePriority(category),
        status: "Under Review",
        supporters: 1,
        progress: 20,
        citizenId: req.user.id,
        latitude:
          latitude === null || latitude === undefined
            ? null
            : Number(latitude),

        longitude:
          longitude === null || longitude === undefined
            ? null
            : Number(longitude),
        ...evidenceData,
      },
    });

    res.status(201).json({
      success: true,
      message: "Challenge submitted successfully",
      challenge,
    });
  } catch (error) {
    console.error("Create challenge error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to submit the challenge",
    });
  }
}

export async function updateChallengeStatus(req, res) {
  try {
    const { status } = req.body;
    const identifier = req.params.id;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid challenge status",
        allowedStatuses,
      });
    }

    const existingChallenge = await prisma.challenge.findFirst({
      where: {
        OR: [
          { id: identifier },
          { trackingId: identifier },
        ],
      },
    });

    if (!existingChallenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    const progressByStatus = {
      Submitted: 10,
      "Under Review": 20,
      Verified: 40,
      Rejected: 0,
      "University Matched": 60,
      "Pilot in Progress": 80,
      Resolved: 100,
    };

    const challenge = await prisma.challenge.update({
      where: {
        id: existingChallenge.id,
      },
      data: {
        status,
        progress: progressByStatus[status],
      },
    });

    return res.status(200).json({
      success: true,
      message: "Challenge status updated",
      challenge,
    });
  } catch (error) {
    console.error("Update status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update challenge status",
    });
  }
}

export async function getChallengeStats(req, res) {
  try {
    const [
      total,
      underReview,
      verified,
      matched,
      inProgress,
      resolved,
      categoryGroups,
    ] = await Promise.all([
      prisma.challenge.count(),

      prisma.challenge.count({
        where: { status: "Under Review" },
      }),

      prisma.challenge.count({
        where: { status: "Verified" },
      }),

      prisma.challenge.count({
        where: { status: "University Matched" },
      }),

      prisma.challenge.count({
        where: { status: "Pilot in Progress" },
      }),

      prisma.challenge.count({
        where: { status: "Resolved" },
      }),

      prisma.challenge.groupBy({
        by: ["category"],
        _count: {
          category: true,
        },
        orderBy: {
          _count: {
            category: "desc",
          },
        },
      }),
    ]);

    const categories = categoryGroups.map((item) => ({
      name: item.category,
      value: item._count.category,
    }));

    res.status(200).json({
      success: true,
      stats: {
        total,
        underReview,
        verified,
        matched,
        inProgress,
        resolved,
        resolutionRate:
          total === 0 ? 0 : Math.round((resolved / total) * 100),
        categories,
      },
    });
  } catch (error) {
    console.error("Challenge statistics error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load challenge statistics",
    });
  }
}
export async function getMyChallenges(req, res) {
  try {
    const challenges = await prisma.challenge.findMany({
      where: {
        citizenId: req.user.id,
      },
      include: {
        universityAssignments: {
          select: {
            id: true,
            status: true,
            progress: true,
            lastUpdate: true,
            validationStatus: true,
            validationFeedback: true,
            validationRequestedAt: true,
            validatedAt: true,
            university: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            assignedAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: challenges.length,
      challenges,
    });
  } catch (error) {
    console.error("Get my challenges error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your reports",
    });
  }
}
export async function validateProjectSolution(req, res) {
  const { id, assignmentId } = req.params;
  const { decision, feedback } = req.body;

  if (!["CONFIRMED", "NEEDS_WORK"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "Decision must be CONFIRMED or NEEDS_WORK",
    });
  }

  if (
    typeof feedback !== "string" ||
    feedback.trim().length < 10 ||
    feedback.trim().length > 2000
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide feedback containing 10–2000 characters",
    });
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const assignment = await tx.challengeAssignment.findFirst({
          where: {
            id: assignmentId,
            challengeId: id,
            challenge: {
              citizenId: req.user.id,
            },
          },
          include: {
            challenge: true,
          },
        });

        if (!assignment) {
          return {
            code: 404,
            message: "Project not found for your report",
          };
        }

        if (
          ["Resolved", "Rejected"].includes(assignment.challenge.status)
        ) {
          return {
            code: 409,
            message: "This challenge is already closed",
          };
        }

        if (
          assignment.validationStatus !== "PENDING" ||
          assignment.status !== "COMPLETED" ||
          assignment.progress !== 100
        ) {
          return {
            code: 409,
            message: "This solution is not awaiting validation",
          };
        }

        const confirmed = decision === "CONFIRMED";

        await tx.challengeAssignment.update({
          where: { id: assignment.id },
          data: {
            validationStatus: decision,
            validationFeedback: feedback.trim(),
            validatedAt: new Date(),

            // Reopen the final milestone when improvements are needed.
            ...(confirmed
              ? {}
              : {
                  status: "ACCEPTED",
                  progress: 80,
                  currentMilestone: 5,
                }),
          },
        });

        // Another university may still have a solution awaiting review.
        const pendingCount = await tx.challengeAssignment.count({
          where: {
            challengeId: id,
            validationStatus: "PENDING",
          },
        });

        await tx.challenge.update({
          where: { id },
          data: {
            status: confirmed
              ? "Resolved"
              : pendingCount > 0
                ? "Awaiting Community Validation"
                : "Pilot in Progress",
            progress: confirmed ? 100 : pendingCount > 0 ? 95 : 88,
          },
        });

        const updatedAssignment =
          await tx.challengeAssignment.findUnique({
            where: { id: assignment.id },
            include: { challenge: true },
          });

        return {
          code: 200,
          message: confirmed
            ? "Resolution confirmed. Thank you for your feedback."
            : "Feedback sent. The university can improve and resubmit.",
          assignment: updatedAssignment,
        };
      },
      { isolationLevel: "Serializable" }
    );

    return res.status(result.code).json({
      success: result.code === 200,
      message: result.message,
      ...(result.assignment
        ? { assignment: result.assignment }
        : {}),
    });
  } catch (error) {
    console.error("Community validation error:", error);

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "Another update occurred. Refresh and try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to save your feedback",
    });
  }
}
export async function analyzeReport(req, res) {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    const analysis = await analyzeChallenge({
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
    });

    const completed = analysis.source === "gemini";

    // Keep a previous successful analysis if a retry fails.
    if (!completed && challenge.aiStatus === "COMPLETED") {
      return res.status(503).json({
        success: false,
        message:
          "AI is currently unavailable. The previous analysis was preserved.",
      });
    }

    // Avoid overwriting a successful analysis from another request.
    const saved = await prisma.challenge.updateMany({
      where: {
        id: challenge.id,
        updatedAt: challenge.updatedAt,
      },
      data: {
        aiStatus: completed ? "COMPLETED" : "UNAVAILABLE",
        aiCategory: completed ? analysis.category : null,
        aiPriority: completed ? analysis.priority : null,
        aiExplanation: completed ? analysis.explanation : null,
        aiAnalyzedAt: completed ? new Date() : null,
      },
    });

    if (saved.count === 0) {
      return res.status(409).json({
        success: false,
        message: "This report changed during analysis. Refresh and try again.",
      });
    }

    const updatedChallenge = await prisma.challenge.findUnique({
      where: {
        id: challenge.id,
      },
    });

    return res.status(completed ? 200 : 503).json({
      success: completed,
      message: completed
        ? "AI suggestions are ready for admin review."
        : "AI is currently unavailable. You can still review the report manually.",
      challenge: updatedChallenge,
    });
  } catch (error) {
    console.error("Report analysis error:", error.name);

    return res.status(500).json({
      success: false,
      message: "Unable to analyze the report",
    });
  }
}
export async function updateChallengeClassification(req, res) {
  const { category, priority } = req.body;

  const categories = [
    "Water & Sanitation",
    "Waste Management",
    "Road Safety",
    "Public Health",
    "Infrastructure",
    "Other",
  ];

  if (
    !categories.includes(category) ||
    !["Low", "Medium", "High"].includes(priority)
  ) {
    return res.status(400).json({
      success: false,
      message: "Select a valid category and priority.",
    });
  }

  try {
    const result = await prisma.challenge.updateMany({
      where: {
        id: req.params.id,
        status: {
          notIn: ["Resolved", "Rejected"],
        },
      },
      data: { category, priority },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message: "Report not found or already closed.",
      });
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id },
    });

    return res.json({
      success: true,
      message: "Category and priority saved.",
      challenge,
    });
  } catch (error) {
    console.error("Classification update failed:", error.name);

    return res.status(500).json({
      success: false,
      message: "Unable to save classification.",
    });
  }
}
export async function getPossibleDuplicates(req, res) {
  try {
    const target = await prisma.challenge.findUnique({
      where: { id: req.params.id },
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    const candidates = await prisma.challenge.findMany({
      where: {
        id: { not: target.id },
        status: { not: "Rejected" },
      },
      select: {
        id: true,
        trackingId: true,
        title: true,
        description: true,
        location: true,
        latitude: true,
        longitude: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const duplicates = findPossibleDuplicates(target, candidates);

    return res.json({
      success: true,
      duplicates,
      checkedCount: candidates.length,
      message: "Compared against up to 500 recent non-rejected reports.",
    });
  } catch (error) {
    console.error("Duplicate lookup failed:", error.name);

    return res.status(500).json({
      success: false,
      message: "Unable to check duplicates",
    });
  }
}