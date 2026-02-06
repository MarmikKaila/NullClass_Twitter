import React, { useState, useEffect } from "react";
import { useUserAuth } from "../../context/UserAuthContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "./Subscription.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    tweetsPerMonth: 1,
    features: ["1 Tweet per month", "Basic profile", "View all tweets"],
    color: "#657786"
  },
  {
    id: "bronze",
    name: "Bronze",
    price: 100,
    tweetsPerMonth: 3,
    features: ["3 Tweets per month", "Basic profile", "View all tweets", "Priority support"],
    color: "#cd7f32"
  },
  {
    id: "silver",
    name: "Silver",
    price: 300,
    tweetsPerMonth: 5,
    features: ["5 Tweets per month", "Enhanced profile", "View all tweets", "Priority support", "Analytics"],
    color: "#c0c0c0"
  },
  {
    id: "gold",
    name: "Gold",
    price: 1000,
    tweetsPerMonth: -1, // unlimited
    features: ["Unlimited Tweets", "Premium profile", "View all tweets", "24/7 support", "Advanced analytics", "Custom badge"],
    color: "#ffd700"
  }
];

const Subscription = () => {
  const { user } = useUserAuth();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeError, setTimeError] = useState("");
  const [userSubscription, setUserSubscription] = useState(null);

  // Check if current time is within allowed range (10 AM - 11 AM IST)
  const isWithinAllowedTime = () => {
    const now = new Date();
    // Convert to IST (UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
    const hours = istTime.getHours();
    return hours >= 10 && hours < 11; // 10 AM to 11 AM
  };

  useEffect(() => {
    // Check time restriction
    if (!isWithinAllowedTime()) {
      setTimeError("Payments are only allowed between 10:00 AM - 11:00 AM IST");
    }

    // Fetch current subscription
    const fetchSubscription = async () => {
      try {
        const response = await fetch(`${API}/subscription?email=${user?.email}`);
        const data = await response.json();
        if (data && data.plan) {
          setUserSubscription(data);
          setCurrentPlan(data.plan);
        } else {
          setCurrentPlan("free");
        }
      } catch (err) {
        setCurrentPlan("free");
      }
    };

    if (user?.email) {
      fetchSubscription();
    }

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [user]);

  const handleSubscribe = async (plan) => {
    if (!isWithinAllowedTime()) {
      setTimeError("Payments are only allowed between 10:00 AM - 11:00 AM IST");
      return;
    }

    if (plan.id === "free") {
      // Free plan - just update the database
      try {
        await fetch(`${API}/subscription`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user?.email,
            plan: "free",
            tweetsPerMonth: 1,
            price: 0
          }),
        });
        setCurrentPlan("free");
        setSuccess("Free plan activated!");
      } catch (err) {
        setError("Failed to activate free plan");
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create order on backend
      const orderResponse = await fetch(`${API}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.price * 100, // Convert to paise
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          email: user?.email,
          planId: plan.id
        }),
      });

      const order = await orderResponse.json();

      if (!order.id) {
        throw new Error("Failed to create order");
      }

      // Open Razorpay checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY", // Replace with your key
        amount: order.amount,
        currency: order.currency,
        name: "Twiller",
        description: `${plan.name} Plan Subscription`,
        order_id: order.id,
        handler: async function (response) {
          // Verify payment and update subscription
          try {
            const verifyResponse = await fetch(`${API}/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email: user?.email,
                plan: plan.id,
                tweetsPerMonth: plan.tweetsPerMonth,
                price: plan.price
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setCurrentPlan(plan.id);
              setSuccess(`Successfully subscribed to ${plan.name} plan! Invoice sent to your email.`);
              setUserSubscription({
                plan: plan.id,
                tweetsPerMonth: plan.tweetsPerMonth,
                tweetsUsed: 0
              });
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            setError("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: user?.email,
        },
        theme: {
          color: "#1da1f2"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError("Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-container">
      <h1>Choose Your Plan</h1>
      <p className="subtitle">Select the plan that works best for you</p>

      {timeError && (
        <div className="time-error">
          <p>{timeError}</p>
          <p>Current payment window: 10:00 AM - 11:00 AM IST</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {userSubscription && (
        <div className="current-plan-info">
          <h3>Current Plan: {userSubscription.plan?.toUpperCase()}</h3>
          <p>
            Tweets Used: {userSubscription.tweetsUsed || 0} / 
            {userSubscription.tweetsPerMonth === -1 ? "Unlimited" : userSubscription.tweetsPerMonth}
          </p>
        </div>
      )}

      <div className="plans-container">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${currentPlan === plan.id ? "current" : ""}`}
            style={{ borderColor: plan.color }}
          >
            <div className="plan-header" style={{ backgroundColor: plan.color }}>
              <h2>{plan.name}</h2>
              {currentPlan === plan.id && <CheckCircleIcon className="current-badge" />}
            </div>
            <div className="plan-price">
              <span className="currency">₹</span>
              <span className="amount">{plan.price}</span>
              <span className="period">/month</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <CheckCircleIcon className="check-icon" /> {feature}
                </li>
              ))}
            </ul>
            <button
              className={`subscribe-btn ${currentPlan === plan.id ? "current-btn" : ""}`}
              onClick={() => handleSubscribe(plan)}
              disabled={loading || currentPlan === plan.id || (!isWithinAllowedTime() && plan.price > 0)}
              style={{ backgroundColor: plan.color }}
            >
              {currentPlan === plan.id ? "Current Plan" : loading ? "Processing..." : `Subscribe to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <div className="payment-info">
        <p><strong>Payment Window:</strong> 10:00 AM - 11:00 AM IST only</p>
        <p><strong>Secure Payment:</strong> Powered by Razorpay</p>
        <p><strong>Invoice:</strong> Sent to your registered email after payment</p>
      </div>
    </div>
  );
};

export default Subscription;
