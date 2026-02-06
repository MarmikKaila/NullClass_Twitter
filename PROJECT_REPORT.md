# Twiller - Twitter Clone Project Report

## Project Overview
**Project Name:** Twiller - Advanced Twitter Clone  
**Repository:** [https://github.com/MarmikKaila/NullClass_Twitter](https://github.com/MarmikKaila/NullClass_Twitter)  
**Date:** February 6, 2026  
**Status:** ✅ Completed

## Technology Stack

### Frontend
- **React.js** (v18.2.0) - UI framework
- **React Router** (v7.10.0) - Navigation and routing
- **Material-UI** (v7.3.6) - UI components and icons
- **Axios** (v1.13.2) - HTTP client
- **Firebase** (v12.6.0) - Authentication

### Backend
- **Node.js** with **Express.js** (v4.19.2) - Server framework
- **MongoDB** (v6.8.0) - Database
- **dotenv** (v16.6.1) - Environment configuration
- **CORS** (v2.8.5) - Cross-origin resource sharing

## Features Implemented

### 1. Audio Tweet Upload System
- **Recording:** Users can record voice messages directly in the browser
- **Authentication:** Email OTP verification required before recording
- **Restrictions:**
  - Maximum duration: 5 minutes
  - Maximum file size: 100MB
  - Time window: 2:00 PM - 7:00 PM IST only
- **Route:** `/home/audio`

### 2. Forgot Password System
- **Reset Options:** Email or phone number
- **Daily Limit:** One password reset per day with warning message
- **Password Generator:**
  - Generates random 12-character passwords
  - Only uppercase and lowercase letters (no special characters or numbers)
  - One-click copy functionality
- **Route:** `/forgot-password`

### 3. Subscription Payment System
- **Payment Gateway:** Razorpay integration
- **Plans Available:**
  - Free Plan: ₹0/month - 1 tweet
  - Bronze Plan: ₹100/month - 3 tweets
  - Silver Plan: ₹300/month - 5 tweets
  - Gold Plan: ₹1000/month - Unlimited tweets
- **Payment Window:** 10:00 AM - 11:00 AM IST only
- **Features:**
  - Automatic invoice generation via email
  - Tweet count tracking and limits
  - Plan upgrade/downgrade options
- **Route:** `/home/subscription`

### 4. Multi-Language Support
- **Supported Languages:** English, Spanish, Hindi, Portuguese, Chinese, French
- **Security:**
  - French language: Email OTP verification required
  - Other languages: Mobile number OTP verification required
- **Implementation:**
  - Complete translation system with context provider
  - Persistent language preference in localStorage
  - Dynamic UI updates across all pages

### 5. User Login Tracking System
- **Information Captured:**
  - Browser type and version
  - Operating system
  - Device type (Desktop/Laptop/Mobile/Tablet)
  - IP address
  - Screen resolution
  - Login timestamp
- **Authentication Rules:**
  - Chrome & other browsers: Email OTP required
  - Microsoft browsers (Edge/IE): No additional authentication
  - Mobile devices: Access restricted to 10:00 AM - 1:00 PM IST
- **Route:** `/home/login-history`

### 6. Keyword Notification System
- **Monitored Keywords:** "cricket" and "science"
- **Notification Types:**
  - Browser push notifications
  - In-app popup messages
- **User Controls:**
  - Enable/disable toggle on profile page
  - Shows full tweet content in notification
  - Persistent preference storage

## Database Schema

### Collections
1. **users** - User profiles and settings
2. **posts** - Tweet posts with likes, comments, reposts
3. **audio_posts** - Audio tweet recordings
4. **subscriptions** - User subscription plans and limits
5. **password_resets** - Password reset request tracking
6. **login_history** - User login activity logs
7. **otps** - OTP verification records

## Security Features
- Firebase authentication integration
- OTP-based verification for sensitive operations
- Time-based access controls for specific features
- Daily request limits for password resets
- Device-based authentication requirements
- Secure payment processing with Razorpay

## API Endpoints

### User Management
- `POST /register` - User registration
- `GET /loggedinuser` - Get logged-in user details
- `PATCH /userupdate/:email` - Update user profile
- `PATCH /notification-settings/:email` - Update notification preferences

### Posts
- `POST /post` - Create new tweet
- `GET /post` - Get all posts
- `GET /userpost` - Get user-specific posts
- `PATCH /post/like/:id` - Like/unlike post
- `PATCH /post/comment/:id` - Add comment
- `PATCH /post/repost/:id` - Repost

### Audio
- `POST /post-audio` - Upload audio tweet

### Authentication & Security
- `POST /send-otp` - Send OTP for verification
- `POST /forgot-password/check` - Check reset eligibility
- `POST /reset-password` - Reset user password
- `POST /record-login` - Record login activity
- `GET /login-history` - Fetch login history

### Subscriptions
- `GET /subscription` - Get user subscription
- `POST /subscription` - Create/update subscription
- `GET /check-tweet-limit` - Check remaining tweets
- `POST /increment-tweet-count` - Increment tweet usage
- `POST /create-order` - Create Razorpay order
- `POST /verify-payment` - Verify payment signature

## Time-Based Restrictions Summary

| Feature | Time Window (IST) |
|---------|-------------------|
| Audio Upload | 2:00 PM - 7:00 PM |
| Payment Processing | 10:00 AM - 11:00 AM |
| Mobile Device Access | 10:00 AM - 1:00 PM |
| Password Reset | Once per day |

## Project Structure
```
twiller-twitterclone/
├── server/
│   ├── index.js              # Express server & API routes
│   └── package.json          # Server dependencies
├── twiller/
│   ├── src/
│   │   ├── Pages/
│   │   │   ├── Audio/        # Audio tweet recording
│   │   │   ├── Feed/         # Main feed & tweet box
│   │   │   ├── ForgotPassword/ # Password reset
│   │   │   ├── Login/        # Authentication
│   │   │   ├── LoginHistory/ # Device tracking
│   │   │   ├── Profile/      # User profile & settings
│   │   │   └── Subscription/ # Payment plans
│   │   ├── components/
│   │   │   └── LanguageSelector/ # Language switcher
│   │   ├── context/
│   │   │   ├── UserAuthContext.js
│   │   │   ├── LanguageContext.js
│   │   │   └── translations.js
│   │   ├── hooks/
│   │   │   └── useKeywordNotifier.js
│   │   └── utils/
│   │       ├── deviceDetection.js
│   │       └── notifications.js
│   └── package.json          # Frontend dependencies
└── README.md
```

## Key Accomplishments
✅ Implemented 6 major features with complex business logic  
✅ Integrated time-based access controls for enhanced security  
✅ Multi-language support with dynamic OTP verification  
✅ Comprehensive user tracking and analytics system  
✅ Payment gateway integration with subscription management  
✅ Real-time browser notifications with keyword monitoring  
✅ Mobile-responsive design across all pages  
✅ Clean, maintainable code with proper separation of concerns  

## Future Enhancements
- Real-time chat messaging system
- Advanced analytics dashboard
- Video tweet support
- Social media sharing integration
- Two-factor authentication (2FA)
- Email notification service integration
- Advanced search and filtering
- Trending topics algorithm

## Deployment Considerations
- Set up MongoDB Atlas for production database
- Configure environment variables for:
  - MongoDB connection string
  - Razorpay API keys
  - Firebase credentials
  - Email/SMS service API keys
- Enable HTTPS for secure communication
- Set up proper CORS policies
- Configure timezone handling for IST restrictions
- Implement proper error logging and monitoring

## Conclusion
Twiller successfully demonstrates a full-stack Twitter clone with advanced features including audio posts, multi-language support, subscription management, and comprehensive security measures. The project showcases modern web development practices with React, Node.js, and MongoDB, implementing time-based restrictions and OTP verification for enhanced security.

---

**Developer:** MarmikKaila  
**Project Duration:** February 2026  
**GitHub:** [NullClass_Twitter](https://github.com/MarmikKaila/NullClass_Twitter)
