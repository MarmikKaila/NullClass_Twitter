import React, { useState, useRef, useEffect } from "react";
import { useUserAuth } from "../../context/UserAuthContext";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import "./AudioTweet.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AudioTweet = () => {
  const { user } = useUserAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeError, setTimeError] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const MAX_DURATION = 5 * 60; // 5 minutes in seconds
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB in bytes

  // Check if current time is within allowed range (2 PM - 7 PM IST)
  const isWithinAllowedTime = () => {
    const now = new Date();
    // Convert to IST (UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
    const hours = istTime.getHours();
    return hours >= 14 && hours < 19; // 2 PM (14:00) to 7 PM (19:00)
  };

  useEffect(() => {
    if (!isWithinAllowedTime()) {
      setTimeError("Audio uploads are only allowed between 2 PM - 7 PM IST");
    } else {
      setTimeError("");
    }
  }, []);

  const sendOtpEmail = async () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    
    try {
      await fetch(`${API}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: user?.email, 
          otp: newOtp,
          purpose: "audio_upload"
        }),
      });
      setShowOtpModal(true);
      setError("");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    }
  };

  const verifyOtp = () => {
    if (otp === generatedOtp) {
      setOtpVerified(true);
      setShowOtpModal(false);
      setError("");
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  const startRecording = async () => {
    if (!isWithinAllowedTime()) {
      setTimeError("Audio uploads are only allowed between 2 PM - 7 PM IST");
      return;
    }

    if (!otpVerified) {
      await sendOtpEmail();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        
        // Check file size
        if (audioBlob.size > MAX_SIZE) {
          setError("Audio file exceeds 100MB limit. Please record a shorter audio.");
          return;
        }
        
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError("Unable to access microphone. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const uploadAudio = async () => {
    if (!audioBlob || !otpVerified) return;

    if (!isWithinAllowedTime()) {
      setTimeError("Audio uploads are only allowed between 2 PM - 7 PM IST");
      return;
    }

    // Check duration
    if (recordingTime > MAX_DURATION) {
      setError("Audio exceeds 5 minute limit.");
      return;
    }

    // Check size
    if (audioBlob.size > MAX_SIZE) {
      setError("Audio file exceeds 100MB limit.");
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        
        const response = await fetch(`${API}/post-audio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user?.email,
            audio: base64Audio,
            duration: recordingTime,
            size: audioBlob.size
          }),
        });

        if (response.ok) {
          alert("Audio tweet posted successfully!");
          deleteRecording();
          setOtpVerified(false);
        } else {
          const data = await response.json();
          setError(data.error || "Failed to post audio tweet.");
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (err) {
      setError("Failed to upload audio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="audio-tweet-container">
      <h2>Record Audio Tweet</h2>
      
      {timeError && (
        <div className="time-error">
          <p>{timeError}</p>
          <p>Current IST time allows audio uploads only between 2:00 PM - 7:00 PM</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!otpVerified && !timeError && (
        <div className="otp-notice">
          <p>Email OTP verification required before recording audio.</p>
          <button onClick={sendOtpEmail} className="verify-btn">
            Send OTP to {user?.email}
          </button>
        </div>
      )}

      {otpVerified && !timeError && (
        <div className="recording-section">
          <div className="timer">
            <span className={recordingTime > MAX_DURATION - 30 ? "warning" : ""}>
              {formatTime(recordingTime)} / {formatTime(MAX_DURATION)}
            </span>
          </div>

          <div className="controls">
            {!isRecording && !audioUrl && (
              <button onClick={startRecording} className="record-btn">
                <MicIcon /> Start Recording
              </button>
            )}

            {isRecording && (
              <button onClick={stopRecording} className="stop-btn">
                <StopIcon /> Stop Recording
              </button>
            )}

            {audioUrl && (
              <div className="playback-controls">
                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                <button onClick={togglePlayback} className="play-btn">
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </button>
                <button onClick={deleteRecording} className="delete-btn">
                  <DeleteIcon />
                </button>
                <button onClick={uploadAudio} className="upload-btn" disabled={loading}>
                  <SendIcon /> {loading ? "Posting..." : "Post Audio Tweet"}
                </button>
              </div>
            )}
          </div>

          <div className="info">
            <p>Max duration: 5 minutes | Max size: 100MB</p>
            <p>Available: 2 PM - 7 PM IST only</p>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Enter OTP</h3>
            <p>OTP sent to {user?.email}</p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
            />
            {error && <p className="error">{error}</p>}
            <div className="modal-buttons">
              <button onClick={verifyOtp} className="verify-btn">Verify</button>
              <button onClick={() => setShowOtpModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioTweet;
