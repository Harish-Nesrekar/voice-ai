import React, { useState, useRef } from "react";

function App() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [dataContent, setDataContent] = useState("");
  const [weatherContent, setWeatherContent] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // 🔊 TEXT TO SPEECH
  const speak = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    window.speechSynthesis.speak(speech);
  };

  // 🎙 START RECORDING
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      const formData = new FormData();
      formData.append("audio", audioBlob);

      const res = await fetch("http://localhost:5000/voice", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setTranscript(data.transcript || "");

      executeAction(data.action);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  // 🛑 STOP RECORDING
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setRecording(false);
  };

  // 🔥 ACTION EXECUTOR
  const executeAction = (action) => {
    if (!action || action === "none") return;

    if (action === "read-page") {
      const text = document.getElementById("content-area")?.innerText;
      speak(text);
      return;
    }

    const button = document.querySelector(`[data-action="${action}"]`);
    if (button) {
      button.click();
    }
  };

  // 🌾 SIMULATED BUTTON ACTIONS

  const loadData = () => {
    const text = "Here is your farming crop data for today.";
    setDataContent(text);
    setWeatherContent("");
    speak("Data page opened.");
  };

  const loadWeather = () => {
    const text = "Today's weather is sunny with moderate wind.";
    setWeatherContent(text);
    setDataContent("");
    speak("Weather page opened.");
  };

  const submitForm = () => {
    speak("Form submitted successfully.");
    alert("Form Submitted Successfully 🚜");
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Farmer Voice Assistant 🌾</h1>

      {!recording ? (
        <button onClick={startRecording}>Start Talking</button>
      ) : (
        <button onClick={stopRecording}>Stop Talking</button>
      )}

      <br /><br />

      <button data-action="open-data" onClick={loadData}>
        Open Data
      </button>

      <button data-action="open-weather" onClick={loadWeather}>
        Open Weather
      </button>

      <button data-action="submit-form" onClick={submitForm}>
        Submit Form
      </button>

      <hr />

      <h3>You Said:</h3>
      <p>{transcript}</p>

      <div id="content-area">
        <p>{dataContent}</p>
        <p>{weatherContent}</p>
      </div>
    </div>
  );
}

export default App;
