import React, { useState, useRef } from "react";

function App() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    window.speechSynthesis.speak(speech);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // DO NOT force codecs (let browser decide)
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setLoading(true);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        console.log("Audio blob size:", audioBlob.size);

        if (audioBlob.size < 1000) {
          setTranscript("No clear speech detected");
          setReply("");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          const res = await fetch("http://localhost:5000/voice", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          setTranscript(data.transcript || "No speech detected");
          setReply(data.reply || "");
          speak(data.reply);
        } catch (err) {
          console.error("Frontend fetch error:", err);
        }

        setLoading(false);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setRecording(false);
  };

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1>Professional Voice Assistant</h1>

      {!recording ? (
        <button onClick={startRecording} disabled={loading}>
          {loading ? "Processing..." : "Start Talking"}
        </button>
      ) : (
        <button onClick={stopRecording}>Stop Talking</button>
      )}

      <h3>You Said:</h3>
      <p>{transcript}</p>

      <h3>AI Reply:</h3>
      <p>{reply}</p>
    </div>
  );
}

export default App;
