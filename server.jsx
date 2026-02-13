const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { createClient } = require("@deepgram/sdk");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

// 🔹 Replace with your Deepgram API key
const deepgram = createClient("");

app.post("/voice", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio uploaded" });
    }

    const audioBuffer = fs.readFileSync(req.file.path);

    const dgResponse = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: "nova-2",
        smart_format: true,
        mimetype: "audio/webm",
      }
    );

    const transcript =
      dgResponse.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    fs.unlinkSync(req.file.path);

    if (!transcript.trim()) {
      return res.json({
        transcript: "",
        action: "none"
      });
    }

    console.log("Transcript:", transcript);

    const command = transcript.toLowerCase();

    // 🔥 COMMAND ROUTER

    if (command.includes("open data") || command === "data") {
      return res.json({
        transcript,
        action: "open-data"
      });
    }

    if (command.includes("open weather") || command === "weather") {
      return res.json({
        transcript,
        action: "open-weather"
      });
    }

    if (command.includes("submit")) {
      return res.json({
        transcript,
        action: "submit-form"
      });
    }

    if (command.includes("read")) {
      return res.json({
        transcript,
        action: "read-page"
      });
    }

    // If no match
    return res.json({
      transcript,
      action: "none"
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
