// Utility functions for detecting user device info

export const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Edg") > -1) {
    return { name: "Microsoft Edge", isMicrosoft: true };
  } else if (userAgent.indexOf("Chrome") > -1) {
    return { name: "Google Chrome", isMicrosoft: false };
  } else if (userAgent.indexOf("Firefox") > -1) {
    return { name: "Mozilla Firefox", isMicrosoft: false };
  } else if (userAgent.indexOf("Safari") > -1) {
    return { name: "Safari", isMicrosoft: false };
  } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    return { name: "Opera", isMicrosoft: false };
  } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
    return { name: "Internet Explorer", isMicrosoft: true };
  }
  return { name: "Unknown", isMicrosoft: false };
};

export const detectOS = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  if (/Android/i.test(userAgent)) {
    return "Android";
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return "iOS";
  } else if (/Windows/i.test(userAgent) || /Win/i.test(platform)) {
    return "Windows";
  } else if (/Mac/i.test(platform)) {
    return "macOS";
  } else if (/Linux/i.test(platform)) {
    return "Linux";
  }
  return "Unknown";
};

export const detectDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for mobile devices
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return "mobile";
  }
  
  // Check for tablets
  if (/tablet|ipad/i.test(userAgent)) {
    return "tablet";
  }
  
  // Desktop/Laptop detection based on screen size and touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const screenWidth = window.screen.width;
  
  if (screenWidth > 1024 && !hasTouch) {
    return "desktop";
  }
  
  return "laptop";
};

export const getIPAddress = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    // Fallback to alternative API
    try {
      const response = await fetch('https://api.ip.sb/ip');
      const ip = await response.text();
      return ip.trim();
    } catch (err) {
      return "Unknown";
    }
  }
};

export const getDeviceInfo = async () => {
  const browser = detectBrowser();
  const os = detectOS();
  const deviceType = detectDeviceType();
  const ip = await getIPAddress();
  
  return {
    browser: browser.name,
    isMicrosoftBrowser: browser.isMicrosoft,
    os,
    deviceType,
    ip,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    timestamp: new Date().toISOString()
  };
};

// Check if mobile device access is within allowed time (10 AM - 1 PM IST)
export const isMobileAccessAllowed = () => {
  const now = new Date();
  // Convert to IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
  const hours = istTime.getHours();
  
  return hours >= 10 && hours < 13; // 10 AM to 1 PM
};

// Determine authentication requirement based on device info
export const getAuthRequirement = (deviceInfo) => {
  // Mobile devices have time restriction
  if (deviceInfo.deviceType === "mobile") {
    if (!isMobileAccessAllowed()) {
      return {
        allowed: false,
        reason: "Mobile access is only allowed between 10 AM - 1 PM IST"
      };
    }
  }
  
  // Microsoft browsers (Edge, IE) - no authentication required
  if (deviceInfo.isMicrosoftBrowser) {
    return {
      allowed: true,
      requiresOtp: false,
      reason: "Microsoft browser detected - no additional authentication required"
    };
  }
  
  // Chrome and other browsers - require email OTP
  return {
    allowed: true,
    requiresOtp: true,
    otpType: "email",
    reason: "Email OTP verification required for this browser"
  };
};
