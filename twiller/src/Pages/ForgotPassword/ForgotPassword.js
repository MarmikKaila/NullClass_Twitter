import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TwitterIcon from "@mui/icons-material/Twitter";
import "./ForgotPassword.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email/phone input, 2: OTP verification, 3: new password
  const [identifier, setIdentifier] = useState(""); // email or phone
  const [identifierType, setIdentifierType] = useState("email");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");

  // Generate random password with only uppercase and lowercase letters (no special chars or numbers)
  const generatePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const allChars = lowercase + uppercase;
    
    let password = "";
    // Ensure at least one lowercase and one uppercase
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    
    // Fill remaining 10 characters
    for (let i = 0; i < 10; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setGeneratedPassword(password);
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setWarning("");
    setLoading(true);

    try {
      // Check if user has already requested today
      const checkResponse = await fetch(`${API}/forgot-password/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, type: identifierType }),
      });

      const checkData = await checkResponse.json();

      if (checkData.requestedToday) {
        setWarning("You have already used your password reset for today. You can only request once per day.");
        setLoading(false);
        return;
      }

      // Generate and send OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);

      const response = await fetch(`${API}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [identifierType]: identifier,
          otp: newOtp,
          purpose: "forgot_password"
        }),
      });

      if (response.ok) {
        // Record this request
        await fetch(`${API}/forgot-password/record`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, type: identifierType }),
        });

        setStep(2);
        setSuccess(`OTP sent to your ${identifierType}`);
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError("");

    if (otp === generatedOtp) {
      setStep(3);
      setSuccess("OTP verified successfully!");
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          type: identifierType,
          newPassword,
        }),
      });

      if (response.ok) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <TwitterIcon className="twitter-icon" style={{ color: "#1da1f2", fontSize: 40 }} />
        <h2>Forgot Password</h2>

        {warning && <div className="warning-message">{warning}</div>}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="identifier-type">
              <label>
                <input
                  type="radio"
                  name="identifierType"
                  value="email"
                  checked={identifierType === "email"}
                  onChange={(e) => setIdentifierType(e.target.value)}
                />
                Email
              </label>
              <label>
                <input
                  type="radio"
                  name="identifierType"
                  value="phone"
                  checked={identifierType === "phone"}
                  onChange={(e) => setIdentifierType(e.target.value)}
                />
                Phone Number
              </label>
            </div>

            <input
              type={identifierType === "email" ? "email" : "tel"}
              placeholder={identifierType === "email" ? "Enter your email" : "Enter your phone number"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Sending..." : "Send OTP"}
            </button>

            <p className="note">
              Note: You can only reset your password once per day.
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p>Enter the OTP sent to your {identifierType}</p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
            <button type="submit" className="submit-btn">
              Verify OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="password-generator">
              <h4>Password Generator</h4>
              <p>Generate a secure password (letters only, no numbers or special characters)</p>
              <button type="button" onClick={generatePassword} className="generate-btn">
                Generate Password
              </button>
              {generatedPassword && (
                <div className="generated-password">
                  <span>{generatedPassword}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(generatedPassword)}
                    className="copy-btn"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="back-to-login">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
