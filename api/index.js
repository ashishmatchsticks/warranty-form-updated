import express from "express";
import cors from "cors";
import { createCanvas, loadImage } from "canvas";
import nodemailer from "nodemailer";
import "dotenv/config";
import path from "path";          // ← add this (needed for file paths)
import { fileURLToPath } from "url"; // ← add this (modern ESM __dirname equivalent)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ---------------- CORS ---------------- */
app.use(cors({
  origin: [
    "https://www.amtyglobal.com",
    "https://amtyglobal.com",
    // Optional — very useful during development
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* ---------------- ROUTE ---------------- */

app.post("/api/submit", async (req, res) => {
  console.log("Incoming Request Body:", req.body);

  const {
    name,
    phone,
    email,
    productModel,
    purchaseDate,
    warrantyPeriod
  } = req.body;

  try {
    // Validation (good as is)
    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        received: req.body
      });
    }

    /* ---------------- IMAGE GENERATION ---------------- */

    const width = 1200;
    const height = 700;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // ... (your canvas drawing code remains the same)

    /* VERY IMPORTANT PATH CHANGE FOR VERCEL */
    const logo = await loadImage(path.join(__dirname, "assets", "logo.png"));
    const badge = await loadImage(path.join(__dirname, "assets", "badge.png"));

    // ... rest of canvas drawing remains the same

    const imageBuffer = canvas.toBuffer("image/png");

    console.log("Image generated successfully");

    /* ---------------- EMAIL ---------------- */

    // ... your nodemailer code remains the same

    await transporter.sendMail({
      // ... same as before
      attachments: [
        {
          filename: "warranty-card.png",   // ← better name
          content: imageBuffer
        }
      ]
    });

    console.log("Email sent successfully");

    res.json({
      success: true,
      message: "Form submitted & email sent"
    });

  } catch (err) {
    console.error("FULL ERROR:", err);

    res.status(500).json({
      success: false,
      errorType: err.code || "UNKNOWN",
      message: err.message
    });
  }
});

// ────────────────────────────────────────────────
// VERY IMPORTANT — REMOVE or COMMENT this part
// ────────────────────────────────────────────────
// app.listen(5000, () => {
//   console.log("Server running on http://localhost:5000");
// });

// Instead — Export the app (this is what Vercel needs!)
export default app;