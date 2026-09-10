import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";

async function createUniversity() {
  const name = process.env.UNIVERSITY_NAME?.trim();
  const email = process.env.UNIVERSITY_EMAIL
    ?.trim()
    .toLowerCase();
  const password = process.env.UNIVERSITY_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "UNIVERSITY_NAME, UNIVERSITY_EMAIL and UNIVERSITY_PASSWORD are required"
    );
  }

  if (password.length < 8) {
    throw new Error(
      "University password must contain at least 8 characters"
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const university = await prisma.user.upsert({
    where: {
      email,
    },

    update: {
      name,
      password: hashedPassword,
      role: "UNIVERSITY",
    },

    create: {
      name,
      email,
      password: hashedPassword,
      role: "UNIVERSITY",
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log("University account created or updated:");
  console.log(university);
}

createUniversity()
  .catch((error) => {
    console.error("University creation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });