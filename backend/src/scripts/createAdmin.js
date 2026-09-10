import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";

async function createAdmin() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required"
    );
  }

  if (password.length < 8) {
    throw new Error(
      "ADMIN_PASSWORD must contain at least 8 characters"
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      name,
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log("Admin account is ready:");
  console.log(admin);
}

createAdmin()
  .catch((error) => {
    console.error("Admin creation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });