import React, { useState, useEffect } from "react";
import { useUserAuth } from "../../context/UserAuthContext";
import ComputerIcon from "@mui/icons-material/Computer";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import TabletIcon from "@mui/icons-material/Tablet";
import LaptopIcon from "@mui/icons-material/Laptop";
import "./LoginHistory.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const LoginHistory = () => {
  const { user } = useUserAuth();
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        const response = await fetch(`${API}/login-history?email=${user?.email}`);
        const data = await response.json();
        setLoginHistory(data);
      } catch (err) {
        console.error("Failed to fetch login history:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchLoginHistory();
    }
  }, [user]);

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <PhoneAndroidIcon />;
      case "tablet":
        return <TabletIcon />;
      case "laptop":
        return <LaptopIcon />;
      default:
        return <ComputerIcon />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="login-history-loading">Loading login history...</div>;
  }

  return (
    <div className="login-history-container">
      <h2>Login History</h2>
      <p className="subtitle">Recent devices that accessed your account</p>

      {loginHistory.length === 0 ? (
        <div className="no-history">
          <p>No login history available</p>
        </div>
      ) : (
        <div className="history-list">
          {loginHistory.map((login, index) => (
            <div key={index} className="history-item">
              <div className="device-icon">
                {getDeviceIcon(login.deviceType)}
              </div>
              <div className="device-info">
                <div className="device-main">
                  <span className="browser">{login.browser}</span>
                  <span className="os">on {login.os}</span>
                </div>
                <div className="device-details">
                  <span className="device-type">{login.deviceType}</span>
                  <span className="ip">IP: {login.ip}</span>
                </div>
                <div className="login-time">
                  {formatDate(login.timestamp)}
                </div>
              </div>
              {index === 0 && (
                <div className="current-session">
                  Current
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="security-info">
        <h4>Security Notes</h4>
        <ul>
          <li>Microsoft browsers (Edge, IE): No additional authentication required</li>
          <li>Google Chrome & others: Email OTP verification required</li>
          <li>Mobile devices: Access limited to 10 AM - 1 PM IST</li>
        </ul>
      </div>
    </div>
  );
};

export default LoginHistory;
