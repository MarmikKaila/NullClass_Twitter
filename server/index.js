// server/index.js
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/twiller";
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
  useUnifiedTopology: true
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("database");
    const postcollection = db.collection("posts");
    const usercollection = db.collection("users");

    // REGISTER USER
    app.post("/register", async (req, res) => {
      try {
        const user = req.body;
        const result = await usercollection.insertOne(user);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Registration failed" });
      }
    });

    // GET LOGGED IN USER
    app.get("/loggedinuser", async (req, res) => {
      try {
        const email = req.query.email;
        const user = await usercollection.find({ email: email }).toArray();
        res.send(user);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch user" });
      }
    });

    // CREATE POST (adds likes/comments/reposts fields)
    app.post("/post", async (req, res) => {
      try {
        const post = req.body;
        const newPost = {
          ...post,
          likes: [],
          comments: [],
          reposts: 0,
          createdAt: new Date()
        };
        const result = await postcollection.insertOne(newPost);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to create post" });
      }
    });

    // GET ALL POSTS (latest first)
    app.get("/post", async (req, res) => {
      try {
        const posts = await postcollection.find().sort({ createdAt: -1 }).toArray();
        res.send(posts);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch posts" });
      }
    });

    // GET POSTS FOR A USER
    app.get("/userpost", async (req, res) => {
      try {
        const email = req.query.email;
        const posts = await postcollection.find({ email: email }).sort({ createdAt: -1 }).toArray();
        res.send(posts);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch user posts" });
      }
    });

    // GET USERS
    app.get("/user", async (req, res) => {
      try {
        const users = await usercollection.find().toArray();
        res.send(users);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch users" });
      }
    });

    // UPDATE USER PROFILE
    app.patch("/userupdate/:email", async (req, res) => {
      try {
        const filter = { email: req.params.email };
        const profile = req.body;
        const options = { upsert: true };
        const updateDoc = { $set: profile };
        const result = await usercollection.updateOne(filter, updateDoc, options);
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to update profile" });
      }
    });

    // LIKE / UNLIKE a post
    app.patch("/post/like/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { email } = req.body;
        if (!email) return res.status(400).send({ error: "Email required" });

        const post = await postcollection.findOne({ _id: new ObjectId(id) });
        if (!post) return res.status(404).send({ error: "Post not found" });

        const alreadyLiked = (post.likes || []).includes(email);
        const update = alreadyLiked
          ? { $pull: { likes: email } }
          : { $push: { likes: email } };

        const result = await postcollection.updateOne({ _id: new ObjectId(id) }, update);
        res.send({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Like failed" });
      }
    });

    // COMMENT on a post
    app.patch("/post/comment/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { email, comment } = req.body;
        if (!email || !comment) return res.status(400).send({ error: "Email and comment required" });

        const commentObj = { email, comment, time: new Date() };
        const result = await postcollection.updateOne(
          { _id: new ObjectId(id) },
          { $push: { comments: commentObj } }
        );
        res.send({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Comment failed" });
      }
    });

    // REPOST (increment repost counter)
    app.patch("/post/repost/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await postcollection.updateOne(
          { _id: new ObjectId(id) },
          { $inc: { reposts: 1 } }
        );
        res.send({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Repost failed" });
      }
    });

    // ============ OTP ENDPOINTS ============
    const otpCollection = db.collection("otps");

    // SEND OTP (for email - logs to console in dev, would integrate with email service in production)
    app.post("/send-otp", async (req, res) => {
      try {
        const { email, phone, otp, purpose } = req.body;
        
        // Store OTP in database
        await otpCollection.insertOne({
          email: email || null,
          phone: phone || null,
          otp,
          purpose,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
        });

        // In production, integrate with email/SMS service
        console.log(`OTP for ${email || phone}: ${otp} (Purpose: ${purpose})`);
        
        res.send({ success: true, message: "OTP sent successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to send OTP" });
      }
    });

    // ============ FORGOT PASSWORD ENDPOINTS ============
    const passwordResetCollection = db.collection("password_resets");

    // Check if user already requested password reset today
    app.post("/forgot-password/check", async (req, res) => {
      try {
        const { identifier, type } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingRequest = await passwordResetCollection.findOne({
          identifier,
          type,
          createdAt: { $gte: today }
        });

        res.send({ requestedToday: !!existingRequest });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to check reset status" });
      }
    });

    // Record password reset request
    app.post("/forgot-password/record", async (req, res) => {
      try {
        const { identifier, type } = req.body;
        
        await passwordResetCollection.insertOne({
          identifier,
          type,
          createdAt: new Date()
        });

        res.send({ success: true });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to record reset request" });
      }
    });

    // Reset password
    app.post("/reset-password", async (req, res) => {
      try {
        const { identifier, type, newPassword } = req.body;
        
        const filter = type === "email" ? { email: identifier } : { phone: identifier };
        const result = await usercollection.updateOne(
          filter,
          { $set: { password: newPassword, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ error: "User not found" });
        }

        res.send({ success: true, message: "Password reset successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to reset password" });
      }
    });

    // ============ AUDIO POST ENDPOINTS ============
    const audioPostCollection = db.collection("audio_posts");

    // Create audio post
    app.post("/post-audio", async (req, res) => {
      try {
        const { email, audio, duration, size } = req.body;
        
        // Check time (2 PM - 7 PM IST)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const hours = istTime.getUTCHours();
        
        if (hours < 14 || hours >= 19) {
          return res.status(403).send({ error: "Audio uploads only allowed between 2 PM - 7 PM IST" });
        }

        // Check duration (max 5 minutes = 300 seconds)
        if (duration > 300) {
          return res.status(400).send({ error: "Audio exceeds 5 minute limit" });
        }

        // Check size (max 100MB)
        if (size > 100 * 1024 * 1024) {
          return res.status(400).send({ error: "Audio exceeds 100MB limit" });
        }

        const audioPost = {
          email,
          audio,
          duration,
          size,
          type: "audio",
          likes: [],
          comments: [],
          createdAt: new Date()
        };

        const result = await audioPostCollection.insertOne(audioPost);
        res.status(201).send({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to post audio" });
      }
    });

    // ============ SUBSCRIPTION ENDPOINTS ============
    const subscriptionCollection = db.collection("subscriptions");

    // Get user subscription
    app.get("/subscription", async (req, res) => {
      try {
        const email = req.query.email;
        const subscription = await subscriptionCollection.findOne({ email });
        
        if (!subscription) {
          return res.send({ plan: "free", tweetsPerMonth: 1, tweetsUsed: 0 });
        }
        
        res.send(subscription);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch subscription" });
      }
    });

    // Create/Update subscription (for free plan or after payment)
    app.post("/subscription", async (req, res) => {
      try {
        const { email, plan, tweetsPerMonth, price } = req.body;
        
        const subscription = {
          email,
          plan,
          tweetsPerMonth,
          price,
          tweetsUsed: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        };

        await subscriptionCollection.updateOne(
          { email },
          { $set: subscription },
          { upsert: true }
        );

        res.send({ success: true, subscription });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to update subscription" });
      }
    });

    // Check tweet limit before posting
    app.get("/check-tweet-limit", async (req, res) => {
      try {
        const email = req.query.email;
        const subscription = await subscriptionCollection.findOne({ email });
        
        if (!subscription) {
          // Free plan
          const userPosts = await postcollection.countDocuments({
            email,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          });
          return res.send({ canPost: userPosts < 1, remaining: Math.max(0, 1 - userPosts) });
        }

        // Gold plan (unlimited)
        if (subscription.plan === "gold") {
          return res.send({ canPost: true, remaining: -1 });
        }

        const canPost = subscription.tweetsUsed < subscription.tweetsPerMonth;
        const remaining = subscription.tweetsPerMonth - subscription.tweetsUsed;
        res.send({ canPost, remaining });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to check tweet limit" });
      }
    });

    // Increment tweet count
    app.post("/increment-tweet-count", async (req, res) => {
      try {
        const { email } = req.body;
        await subscriptionCollection.updateOne(
          { email },
          { $inc: { tweetsUsed: 1 } }
        );
        res.send({ success: true });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to increment tweet count" });
      }
    });

    // ============ PAYMENT ENDPOINTS (Razorpay) ============
    // Create order
    app.post("/create-order", async (req, res) => {
      try {
        const { amount, currency, receipt, email, planId } = req.body;
        
        // Check time (10 AM - 11 AM IST)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const hours = istTime.getUTCHours();
        
        if (hours < 10 || hours >= 11) {
          return res.status(403).send({ error: "Payments only allowed between 10 AM - 11 AM IST" });
        }

        // In production, use Razorpay SDK to create order
        // const Razorpay = require('razorpay');
        // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        // const order = await razorpay.orders.create({ amount, currency, receipt });
        
        // For demo, create mock order
        const order = {
          id: `order_${Date.now()}`,
          amount,
          currency,
          receipt,
          status: "created"
        };

        res.send(order);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to create order" });
      }
    });

    // Verify payment
    app.post("/verify-payment", async (req, res) => {
      try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, plan, tweetsPerMonth, price } = req.body;
        
        // In production, verify signature using Razorpay SDK
        // const crypto = require('crypto');
        // const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        //   .update(razorpay_order_id + "|" + razorpay_payment_id)
        //   .digest('hex');
        // const isValid = generated_signature === razorpay_signature;

        // For demo, assume valid
        const isValid = true;

        if (!isValid) {
          return res.status(400).send({ success: false, error: "Invalid signature" });
        }

        // Update subscription
        const subscription = {
          email,
          plan,
          tweetsPerMonth,
          price,
          tweetsUsed: 0,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };

        await subscriptionCollection.updateOne(
          { email },
          { $set: subscription },
          { upsert: true }
        );

        // Send invoice email (in production, integrate with email service)
        console.log(`Invoice sent to ${email} for ${plan} plan - ₹${price}`);

        res.send({ success: true, message: "Payment verified and subscription activated" });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Payment verification failed" });
      }
    });

    // ============ LOGIN HISTORY ENDPOINTS ============
    const loginHistoryCollection = db.collection("login_history");

    // Record login
    app.post("/record-login", async (req, res) => {
      try {
        const { email, browser, os, deviceType, ip, screenResolution, language, timestamp } = req.body;
        
        // Check mobile time restriction (10 AM - 1 PM IST)
        if (deviceType === "mobile") {
          const now = new Date();
          const istOffset = 5.5 * 60 * 60 * 1000;
          const istTime = new Date(now.getTime() + istOffset);
          const hours = istTime.getUTCHours();
          
          if (hours < 10 || hours >= 13) {
            return res.status(403).send({ 
              error: "Mobile access only allowed between 10 AM - 1 PM IST",
              allowed: false 
            });
          }
        }

        const loginRecord = {
          email,
          browser,
          os,
          deviceType,
          ip,
          screenResolution,
          language,
          timestamp: new Date(timestamp)
        };

        await loginHistoryCollection.insertOne(loginRecord);
        res.send({ success: true, allowed: true });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to record login" });
      }
    });

    // Get login history
    app.get("/login-history", async (req, res) => {
      try {
        const email = req.query.email;
        const history = await loginHistoryCollection
          .find({ email })
          .sort({ timestamp: -1 })
          .limit(20)
          .toArray();
        
        res.send(history);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch login history" });
      }
    });

    // ============ NOTIFICATION SETTINGS ============
    // Update notification settings
    app.patch("/notification-settings/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const { notificationsEnabled } = req.body;
        
        await usercollection.updateOne(
          { email },
          { $set: { notificationsEnabled } },
          { upsert: true }
        );

        res.send({ success: true });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to update notification settings" });
      }
    });

    // Get notification settings
    app.get("/notification-settings/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const user = await usercollection.findOne({ email });
        
        res.send({ notificationsEnabled: user?.notificationsEnabled ?? true });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch notification settings" });
      }
    });

  } catch (error) {
    console.error("Error in run():", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Twiller is working");
});

app.listen(port, () => {
  console.log(`Twiller clone is working on ${port}`);
});
