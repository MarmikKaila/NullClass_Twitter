import React, { useState, useEffect } from "react";
import twitterimg from "../../image/twitter.jpeg";
import TwitterIcon from "@mui/icons-material/Twitter";
import GoogleButton from "react-google-button";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";
import { useUserAuth } from "../../context/UserAuthContext";
import { getDeviceInfo, getAuthRequirement, isMobileAccessAllowed, detectDeviceType } from "../../utils/deviceDetection";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Login = () => {
  const [email, seteamil] = useState("");
  const [password, setpassword] = useState("");
  const [error, seterror] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [pendingLogin, setPendingLogin] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [authRequirement, setAuthRequirement] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { googleSignIn, logIn } = useUserAuth();

  useEffect(() => {
    const checkDevice = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
      const requirement = getAuthRequirement(info);
      setAuthRequirement(requirement);

      // Check mobile time restriction
      if (info.deviceType === "mobile" && !isMobileAccessAllowed()) {
        seterror("Mobile access is only allowed between 10 AM - 1 PM IST");
      }
    };
    checkDevice();
  }, []);

  const recordLogin = async (userEmail) => {
    if (deviceInfo) {
      try {
        await fetch(`${API}/record-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            ...deviceInfo
          }),
        });
      } catch (err) {
        console.error("Failed to record login:", err);
      }
    }
  };

  const sendOtpEmail = async (userEmail) => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    
    try {
      await fetch(`${API}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: userEmail, 
          otp: newOtp,
          purpose: "login_verification"
        }),
      });
      return true;
    } catch (err) {
      seterror("Failed to send OTP. Please try again.");
      return false;
    }
  };

  const completeLogin = async () => {
    if (pendingLogin) {
      await recordLogin(pendingLogin.email || email);
      navigate("/");
    }
  };

  const verifyOtpAndLogin = async () => {
    if (otp === generatedOtp) {
      await completeLogin();
      setShowOtpModal(false);
    } else {
      seterror("Invalid OTP. Please try again.");
    }
  };

  const handlesubmit = async (e) => {
    e.preventDefault();
    seterror("");

    // Check if device is allowed
    if (authRequirement && !authRequirement.allowed) {
      seterror(authRequirement.reason);
      return;
    }

    // Check mobile time restriction
    if (deviceInfo?.deviceType === "mobile" && !isMobileAccessAllowed()) {
      seterror("Mobile access is only allowed between 10 AM - 1 PM IST");
      return;
    }

    setLoading(true);
    try {
      await logIn(email, password);
      setPendingLogin({ email, type: "email" });

      // Microsoft browser - no OTP needed
      if (deviceInfo?.isMicrosoftBrowser) {
        await recordLogin(email);
        navigate("/");
      } else {
        // Other browsers need OTP
        const otpSent = await sendOtpEmail(email);
        if (otpSent) {
          setShowOtpModal(true);
        }
      }
    } catch (error) {
      seterror(error.message);
      window.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const hanglegooglesignin = async (e) => {
    e.preventDefault();
    seterror("");

    // Check if device is allowed
    if (authRequirement && !authRequirement.allowed) {
      seterror(authRequirement.reason);
      return;
    }

    // Check mobile time restriction
    if (deviceInfo?.deviceType === "mobile" && !isMobileAccessAllowed()) {
      seterror("Mobile access is only allowed between 10 AM - 1 PM IST");
      return;
    }

    try {
      const result = await googleSignIn();
      const userEmail = result.user?.email;
      setPendingLogin({ email: userEmail, type: "google" });

      // Microsoft browser - no OTP needed
      if (deviceInfo?.isMicrosoftBrowser) {
        await recordLogin(userEmail);
        navigate("/");
      } else {
        // Other browsers need OTP
        const otpSent = await sendOtpEmail(userEmail);
        if (otpSent) {
          setShowOtpModal(true);
        }
      }
    } catch (error) {
      console.log(error.message);
      seterror(error.message);
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="image-container">
          <img src={twitterimg} className=" image" alt="twitterimg" />
        </div>
        <div className="form-container">
          <div className="form-box">
            <TwitterIcon style={{ color: "skyblue" }} />
            <h2 className="heading">Happening now</h2>
            
            {deviceInfo && (
              <div className="device-info-banner">
                <small>
                  {deviceInfo.browser} on {deviceInfo.os} ({deviceInfo.deviceType})
                  {deviceInfo.isMicrosoftBrowser && " - No OTP required"}
                </small>
              </div>
            )}

            {error && <p className="error-message">{error}</p>}
            
            <form onSubmit={handlesubmit}>
              <input
                type="email"
                className="email"
                placeholder="Email address"
                onChange={(e) => seteamil(e.target.value)}
              />
              <input
                type="password"
                className="password"
                placeholder="Password"
                onChange={(e) => setpassword(e.target.value)}
              />
              <div className="btn-login">
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? "Logging in..." : "Log In"}
                </button>
              </div>
            </form>
            <div className="forgot-password-link">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>
            <hr />
            <div>
              <GoogleButton className="g-btn" type="light" onClick={hanglegooglesignin}/>
            </div>
          </div>
          <div>
            Don't have an account
            <Link
              to="/signup"
              style={{
                textDecoration: "none",
                color: "var(--twitter-color)",
                fontWeight: "600",
                marginLeft: "5px",
              }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal">
            <h3>Verify Your Login</h3>
            <p>Enter the OTP sent to {pendingLogin?.email || email}</p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
            />
            {error && <p className="error">{error}</p>}
            <div className="otp-modal-buttons">
              <button onClick={verifyOtpAndLogin} className="verify-btn">Verify & Login</button>
              <button onClick={() => setShowOtpModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
