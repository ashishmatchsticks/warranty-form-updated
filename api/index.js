import express from "express";
import cors from "cors";
import { createCanvas, loadImage } from "canvas";
import nodemailer from "nodemailer";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

/* __dirname fix for ES Modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ---------------- CORS ---------------- */
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*",
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "10mb" }));

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
    /* Validation */
    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        received: req.body
      });
    }

    /* ---------------- IMAGE ---------------- */

    const width = 1200;
    const height = 700;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    /* Background */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    /* Gold Border */
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 15;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    /* Title */
    ctx.fillStyle = "#000";
    ctx.font = "bold 48px serif";
    ctx.fillText("Warranty Card", 50, 80);

    /* Details */
    ctx.font = "28px monospace";
    let y = 160;

    ctx.fillText(`Customer Name : ${name}`, 50, y); y += 50;
    ctx.fillText(`Mobile Number : ${phone}`, 50, y); y += 50;
    ctx.fillText(`Email Address : ${email}`, 50, y); y += 50;
    ctx.fillText(`Product Model : ${productModel}`, 50, y); y += 50;
    ctx.fillText(`Purchase Date : ${purchaseDate}`, 50, y); y += 50;
    ctx.fillText(`Warranty Period : ${warrantyPeriod}`, 50, y);

    /* ---------------- LOGO ---------------- */

    const logo = await loadImage(
      path.join(__dirname, "assets", "logo.png")
    );

    const maxLogoWidth = 330;
    const scale = maxLogoWidth / logo.width;
    const logoWidth = logo.width * scale;
    const logoHeight = logo.height * scale;

    ctx.drawImage(logo, 780, 80, logoWidth, logoHeight);

    /* ---------------- BADGE ---------------- */

    const badge = await loadImage(
      path.join(__dirname, "assets", "badge.png")
    );

    ctx.drawImage(badge, 800, 280, 260, 260);

    /* ---------------- FOOTER ---------------- */

    ctx.font = "22px Arial";
    ctx.fillStyle = "#000";

    const footerY = 550;
    const iconX = 50;
    const textX = 90;
    const gap = 40;

    ctx.fillText("📞", iconX, footerY);
    ctx.fillText("+91 92206 34489", textX, footerY);

    ctx.fillText("✉️", iconX, footerY + gap);
    ctx.fillText("support@amtyglobal.com", textX, footerY + gap);

    ctx.fillText("🌐", iconX, footerY + gap * 2);
    ctx.fillText("amtyglobal.com", textX, footerY + gap * 2);

    const imageBuffer = canvas.toBuffer("image/png");
    console.log("Image generated successfully");

    /* ---------------- EMAIL ---------------- */

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "Warranty Registration",
      html: `<h3>New Warranty Registration</h3>`,
      attachments: [
        {
          filename: "warranty-card.png",
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

/* ---------------- SERVER START ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
