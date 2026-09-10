import express from "express";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/reverse",
  authenticate,
  authorizeRoles("CITIZEN"),
  async (req, res) => {
    const { latitude, longitude } = req.body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required.",
      });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message:
          "Address lookup is not configured. Enter the address manually.",
      });
    }

    try {
      const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
        lang: "en",
        format: "json",
        apiKey,
      });

      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?${params}`,
        {
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        console.error("Geoapify HTTP status:", response.status);

        return res.status(502).json({
          success: false,
          message:
            "Address lookup is unavailable. Please enter the address manually.",
        });
      }

      const data = await response.json();
      const address = data.results?.[0]?.formatted;

      if (typeof address !== "string" || !address.trim()) {
        return res.status(404).json({
          success: false,
          message:
            "No address was found here. Please enter it manually.",
        });
      }

      return res.status(200).json({
        success: true,
        address: address.trim(),
      });
    } catch (error) {
      console.error("Address lookup failed:", error.name);

      return res.status(502).json({
        success: false,
        message:
          "Address lookup failed. Your GPS pin is available; enter the address manually.",
      });
    }
  }
);

export default router;