import express from "express";
import cors from "cors";
import { createCanvas, loadImage } from "canvas";
import { Resend } from "resend";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

/* __dirname fix */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

/* ---------------- CORS ---------------- */
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*",
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "20mb" }));

/* ---------------- ROUTE ---------------- */

app.post("/api/submit", async (req, res) => {
  console.log("Incoming Request Body:", req.body);

  const { name, phone, email, productModel, purchaseDate, warrantyPeriod } =
    req.body;

  try {
    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    /* ---------------- IMAGE ---------------- */

    const width = 1200;
    const height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 15;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.fillStyle = "#000";
    ctx.font = "bold 48px serif";
    ctx.fillText("Warranty Card", 50, 80);

    ctx.font = "28px monospace";
    let y = 160;

    ctx.fillText(`Customer Name : ${name}`, 50, y); y += 50;
    ctx.fillText(`Mobile Number : ${phone}`, 50, y); y += 50;
    ctx.fillText(`Email Address : ${email}`, 50, y); y += 50;
    ctx.fillText(`Product Model : ${productModel}`, 50, y); y += 50;
    ctx.fillText(`Purchase Date : ${purchaseDate}`, 50, y); y += 50;
    ctx.fillText(`Warranty Period : ${warrantyPeriod}`, 50, y);

    /* LOGO */
    const logo = await loadImage(path.join(__dirname, "../assets", "logo.png"));
    const maxLogoWidth = 330;
    const scale = maxLogoWidth / logo.width;

    ctx.drawImage(logo, 780, 80, logo.width * scale, logo.height * scale);

    /* BADGE */
    const badge = await loadImage(
      path.join(__dirname, "../assets", "badge.png")
    );
    ctx.drawImage(badge, 800, 280, 260, 260);

    /* ---------------- FOOTER ICONS ---------------- */

    const callIcon = await loadImage(
      path.join(__dirname, "../assets", "call.png")
    );
    const emailIcon = await loadImage(
      path.join(__dirname, "../assets", "email.png")
    );
    const webIcon = await loadImage(
      path.join(__dirname, "../assets", "web.png")
    );

    ctx.font = "22px Arial";
    ctx.fillStyle = "#000";

    const footerY = 550;
    const iconX = 50;
    const textX = 100;
    const gap = 40;
    const iconSize = 26;

    /* Phone */
    ctx.drawImage(callIcon, iconX, footerY - 20, iconSize, iconSize);
    ctx.fillText("+91 92206 34489", textX, footerY);

    /* Email */
    ctx.drawImage(emailIcon, iconX, footerY + gap - 20, iconSize, iconSize);
    ctx.fillText("support@amtyglobal.com", textX, footerY + gap);

    /* Website */
    ctx.drawImage(webIcon, iconX, footerY + gap * 2 - 20, iconSize, iconSize);
    ctx.fillText("amtyglobal.com", textX, footerY + gap * 2);

    const imageBuffer = canvas.toBuffer("image/png");
    console.log("Image generated successfully");

    /* ---------------- SEND RESPONSE FAST ---------------- */

    res.json({
      success: true,
      message: "Form submitted successfully",
    });

    /* ---------------- EMAIL (RESEND) ---------------- */

    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: "Warranty Registration",
      html: `
      <div style="font-family:Arial, sans-serif; color:#222; line-height:1.6;">
        <h2 style="color:#d4af37;">New Warranty Application Received</h2>

        <p>
          A new warranty application has been submitted through the website.
          Please review the attached warranty card and proceed with the next steps.
        </p>

        <ul>
          <li>Verify customer details</li>
          <li>Approve warranty registration</li>
          <li>Update internal records</li>
          <li>Contact customer if required</li>
        </ul>

        <p>The generated warranty card is attached.</p>

        <p style="font-size:13px;color:#666;">
          This is an automated message from AMTY Global.
        </p>
      </div>
      `,
      attachments: [
        {
          filename: "warranty-card.png",
          content: imageBuffer.toString("base64"),
        },
      ],
    });

    console.log("Email sent via Resend");

  } catch (err) {
    console.error("FULL ERROR:", err);
  }
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
