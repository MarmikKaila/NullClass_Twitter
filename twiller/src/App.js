import logo from "./logo.svg";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Login from "./Pages/Login/Login";
import Signup from "./Pages/Login/Signup";
import Feed from "./Pages/Feed/Feed";
import Explore from "./Pages/Explore/Explore";
import Notification from "./Pages/Notification/Notification";
import Message from "./Pages/Messages/Message";
import ProtectedRoute from "./Pages/ProtectedRoute";
import Lists from "./Pages/Lists/Lists";
import Profile from "./Pages/Profile/Profile";
import More from "./Pages/more/More";
import { UserAuthContextProvider } from "./context/UserAuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import Bookmark from "./Pages/Bookmark/Bookmark";
import ForgotPassword from "./Pages/ForgotPassword/ForgotPassword";
import AudioTweet from "./Pages/Audio/AudioTweet";
import Subscription from "./Pages/Subscription/Subscription";
import LoginHistory from "./Pages/LoginHistory/LoginHistory";

function App() {
  return (
    <div className="app">
      <LanguageProvider>
        <UserAuthContextProvider>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {" "}
                  <Home />
                </ProtectedRoute>
              }
            >
              <Route index element={<Feed />} />
            </Route>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {" "}
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/home" element={<Home />}>
              <Route path="feed" element={<Feed />} />
              <Route path="explore" element={<Explore />} />
              <Route path="notification" element={<Notification />} />
              <Route path="messages" element={<Message />} />
              <Route path="lists" element={<Lists />} />
              <Route path="bookmarks" element={<Bookmark />} />
              <Route path="profile" element={<Profile />} />
              <Route path="more" element={<More />} />
              <Route path="audio" element={<AudioTweet />} />
              <Route path="subscription" element={<Subscription />} />
              <Route path="login-history" element={<LoginHistory />} />
            </Route>
          </Routes>
        </UserAuthContextProvider>
      </LanguageProvider>
    </div>
  );
}

export default App;
