import React, { useState } from "react";
import { useLanguage, languages } from "../../context/LanguageContext";
import { useUserAuth } from "../../context/UserAuthContext";
import LanguageIcon from "@mui/icons-material/Language";
import "./LanguageSelector.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const { user } = useUserAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState(null);
  const [otpType, setOtpType] = useState("email"); // email or phone
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: enter phone (if needed), 2: enter otp

  const handleLanguageSelect = async (langCode) => {
    if (langCode === currentLanguage) {
      setShowDropdown(false);
      return;
    }

    const langInfo = languages.find(l => l.code === langCode);
    setSelectedLang(langCode);

    // French requires email OTP, others require mobile OTP
    if (langCode === "fr") {
      setOtpType("email");
      setStep(2);
      await sendEmailOtp();
    } else {
      setOtpType("phone");
      setStep(1); // Need to enter phone number first
    }
    
    setShowOtpModal(true);
    setShowDropdown(false);
  };

  const sendEmailOtp = async () => {
    setLoading(true);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);

    try {
      await fetch(`${API}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          otp: newOtp,
          purpose: "language_change"
        }),
      });
      setError("");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);

    try {
      await fetch(`${API}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNumber,
          otp: newOtp,
          purpose: "language_change"
        }),
      });
      setStep(2);
      setError("");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = () => {
    if (otp === generatedOtp) {
      changeLanguage(selectedLang);
      resetModal();
      alert(t("languageChanged"));
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  const resetModal = () => {
    setShowOtpModal(false);
    setOtp("");
    setPhoneNumber("");
    setGeneratedOtp("");
    setError("");
    setStep(1);
    setSelectedLang(null);
  };

  const getCurrentLanguageInfo = () => {
    return languages.find(l => l.code === currentLanguage);
  };

  return (
    <div className="language-selector">
      <button 
        className="language-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <LanguageIcon />
        <span>{getCurrentLanguageInfo()?.flag} {getCurrentLanguageInfo()?.name}</span>
      </button>

      {showDropdown && (
        <div className="language-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${currentLanguage === lang.code ? "active" : ""}`}
              onClick={() => handleLanguageSelect(lang.code)}
            >
              <span className="flag">{lang.flag}</span>
              <span className="name">{lang.name}</span>
              {currentLanguage === lang.code && <span className="checkmark">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("verifyOtp")}</h3>
            
            {otpType === "phone" && step === 1 && (
              <div className="phone-input-section">
                <p>Please enter your mobile number for verification</p>
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={15}
                />
                <button 
                  onClick={sendPhoneOtp} 
                  className="send-otp-btn"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="otp-input-section">
                <p>
                  {otpType === "email" 
                    ? `OTP sent to ${user?.email}` 
                    : `OTP sent to ${phoneNumber}`}
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
                <div className="modal-buttons">
                  <button onClick={verifyOtp} className="verify-btn">
                    {t("verifyOtp")}
                  </button>
                  <button onClick={resetModal} className="cancel-btn">
                    {t("cancel")}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="error">{error}</p>}

            <div className="verification-info">
              {otpType === "email" ? (
                <p>French requires email verification</p>
              ) : (
                <p>Mobile verification required for this language</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
