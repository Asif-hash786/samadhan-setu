import prisma from "../config/prisma.js";

export async function assignUniversities(req, res) {
  try {
    const identifier = req.params.id;
    const { universityIds } = req.body;

    if (
      !Array.isArray(universityIds) ||
      universityIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Select at least one university",
      });
    }

    const uniqueUniversityIds = [...new Set(universityIds)];

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

    const universities = await prisma.user.findMany({
      where: {
        id: {
          in: uniqueUniversityIds,
        },
        role: "UNIVERSITY",
      },
      select: {
        id: true,
      },
    });

    if (universities.length !== uniqueUniversityIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected universities are invalid",
      });
    }

    await prisma.$transaction([
      prisma.challengeAssignment.createMany({
        data: uniqueUniversityIds.map((universityId) => ({
          challengeId: challenge.id,
          universityId,
          status: "INVITED",
        })),
        skipDuplicates: true,
      }),

      prisma.challenge.update({
        where: {
          id: challenge.id,
        },
        data: {
          status: "University Matched",
          progress: 60,
        },
      }),
    ]);

    const assignments =
      await prisma.challengeAssignment.findMany({
        where: {
          challengeId: challenge.id,
        },
        include: {
          university: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      message: "Universities assigned successfully",
      assignments,
    });
  } catch (error) {
    console.error("University assignment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to assign universities",
    });
  }
}