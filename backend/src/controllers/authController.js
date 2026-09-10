import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

function getPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "CITIZEN",
      },
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    if (user.role === "UNIVERSITY_PENDING") {
  return res.status(403).json({
    success: false,
    message: "Your university application is awaiting admin approval.",
  });
}

if (user.role === "UNIVERSITY_REJECTED") {
  return res.status(403).json({
    success: false,
    message:
      "Your university application was not approved. Contact the administrator.",
  });
}

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
}
export async function getCurrentUser(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}
export async function registerUniversity(req, res) {
  const {
    name,
    email,
    password,
    departments = [],
    skills = [],
    researchAreas = [],
  } = req.body || {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 150 ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    email.trim().length > 254 ||
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Enter a university name, valid email, and password of at least " +
        "8 characters and at most 72 UTF-8 bytes.",
    });
  }

  const expertise = {};

  for (const [field, entries] of Object.entries({
    departments,
    skills,
    researchAreas,
  })) {
    if (
      !Array.isArray(entries) ||
      entries.length > 20 ||
      entries.some(
        (entry) =>
          typeof entry !== "string" ||
          !entry.trim() ||
          entry.trim().length > 100
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${field} must contain up to 20 entries, ` +
          "each between 1 and 100 characters.",
      });
    }

    const seen = new Set();

    expertise[field] = entries
      .map((entry) => entry.trim())
      .filter((entry) => {
        const key = entry.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  try {
    await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: await bcrypt.hash(password, 12),
        role: "UNIVERSITY_PENDING",
        ...expertise,
      },
    });

    // Applications do not receive a login token.
    return res.status(201).json({
      success: true,
      message:
        "University application submitted. You can log in after admin approval.",
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("University registration failed:", error.name);

    return res.status(500).json({
      success: false,
      message: "Unable to submit university application.",
    });
  }
}