
// ✅ Deepgram v3 CORRECT FORMAT
// const deepgram = createClient("57248294dec4355efbf1dc8f221c126edc4cab56");

// Gemini
// const genAI = new GoogleGenerativeAI("AIzaSyDd_fuzJOQhiMbCeFJMdLyZWapzZpe2H48");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { createClient } = require("@deepgram/sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

// 🔹 Replace with your real keys
const deepgram = createClient("");
const genAI = new GoogleGenerativeAI("");

app.post("/voice", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio uploaded" });
    }

    console.log("Audio received:", req.file.path);

    const audioBuffer = fs.readFileSync(req.file.path);

    // 🔥 Save copy for debugging (optional)
    fs.copyFileSync(req.file.path, "debug_audio.webm");

    const dgResponse = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: "nova-2",
        smart_format: true,
        mimetype: "audio/webm",
      }
    );

    console.log("Full Deepgram response:", JSON.stringify(dgResponse, null, 2));

    const transcript =
      dgResponse.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    if (!transcript.trim()) {
      fs.unlinkSync(req.file.path);
      return res.json({
        transcript: "",
        reply: "No speech detected. Please speak clearly and try again.",
      });
    }

    console.log("Transcript:", transcript);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const aiResult = await model.generateContent(transcript);
    const reply = aiResult.response.text();

    console.log("AI Reply:", reply);

    fs.unlinkSync(req.file.path);

    res.json({ transcript, reply });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
