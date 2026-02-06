const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/twiller";

let client;
let db;

async function connectDB() {
  if (db) return db;
  
  client = new MongoClient(uri, {
    serverApi: ServerApiVersion.v1,
    useUnifiedTopology: true
  });
  
  await client.connect();
  db = client.db("database");
  return db;
}

// Helper for CORS
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  return await fn(req, res);
};

async function handler(req, res) {
  const db = await connectDB();
  const { url, method, body, query } = req;
  
  const postcollection = db.collection("posts");
  const usercollection = db.collection("users");
  const otpCollection = db.collection("otps");
  const passwordResetCollection = db.collection("password_resets");
  const audioPostCollection = db.collection("audio_posts");
  const subscriptionCollection = db.collection("subscriptions");
  const loginHistoryCollection = db.collection("login_history");
  
  try {
    // Parse the API path
    const path = url.split('?')[0].replace('/api', '');
    
    // Root check
    if (path === '/' || path === '') {
      return res.status(200).json({ message: "Twiller API is working" });
    }

    // REGISTER USER
    if (path === '/register' && method === 'POST') {
      const user = body;
      const result = await usercollection.insertOne(user);
      return res.status(201).json(result);
    }

    // GET LOGGED IN USER
    if (path === '/loggedinuser' && method === 'GET') {
      const email = query.email;
      const user = await usercollection.find({ email: email }).toArray();
      return res.status(200).json(user);
    }

    // CREATE POST
    if (path === '/post' && method === 'POST') {
      const post = body;
      const newPost = {
        ...post,
        likes: [],
        comments: [],
        reposts: 0,
        createdAt: new Date()
      };
      const result = await postcollection.insertOne(newPost);
      return res.status(201).json(result);
    }

    // GET ALL POSTS
    if (path === '/post' && method === 'GET') {
      const posts = await postcollection.find().sort({ createdAt: -1 }).toArray();
      return res.status(200).json(posts);
    }

    // GET USER POSTS
    if (path === '/userpost' && method === 'GET') {
      const email = query.email;
      const posts = await postcollection.find({ email: email }).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(posts);
    }

    // GET USERS
    if (path === '/user' && method === 'GET') {
      const users = await usercollection.find().toArray();
      return res.status(200).json(users);
    }

    // UPDATE USER PROFILE
    if (path.startsWith('/userupdate/') && method === 'PATCH') {
      const email = path.split('/userupdate/')[1];
      const profile = body;
      const options = { upsert: true };
      const updateDoc = { $set: profile };
      const result = await usercollection.updateOne({ email }, updateDoc, options);
      return res.status(200).json(result);
    }

    // LIKE/UNLIKE POST
    if (path.match(/^\/post\/like\/\w+$/) && method === 'PATCH') {
      const id = path.split('/post/like/')[1];
      const { email } = body;
      if (!email) return res.status(400).json({ error: "Email required" });

      const post = await postcollection.findOne({ _id: new ObjectId(id) });
      if (!post) return res.status(404).json({ error: "Post not found" });

      const alreadyLiked = (post.likes || []).includes(email);
      const update = alreadyLiked
        ? { $pull: { likes: email } }
        : { $push: { likes: email } };

      const result = await postcollection.updateOne({ _id: new ObjectId(id) }, update);
      return res.status(200).json({ success: true, result });
    }

    // COMMENT ON POST
    if (path.match(/^\/post\/comment\/\w+$/) && method === 'PATCH') {
      const id = path.split('/post/comment/')[1];
      const { email, comment } = body;
      if (!email || !comment) return res.status(400).json({ error: "Email and comment required" });

      const commentObj = { email, comment, time: new Date() };
      const result = await postcollection.updateOne(
        { _id: new ObjectId(id) },
        { $push: { comments: commentObj } }
      );
      return res.status(200).json({ success: true, result });
    }

    // REPOST
    if (path.match(/^\/post\/repost\/\w+$/) && method === 'PATCH') {
      const id = path.split('/post/repost/')[1];
      const result = await postcollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { reposts: 1 } }
      );
      return res.status(200).json({ success: true, result });
    }

    // SEND OTP
    if (path === '/send-otp' && method === 'POST') {
      const { email, phone, otp, purpose } = body;
      
      await otpCollection.insertOne({
        email: email || null,
        phone: phone || null,
        otp,
        purpose,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });

      console.log(`OTP for ${email || phone}: ${otp} (Purpose: ${purpose})`);
      return res.status(200).json({ success: true, message: "OTP sent successfully" });
    }

    // FORGOT PASSWORD CHECK
    if (path === '/forgot-password/check' && method === 'POST') {
      const { identifier, type } = body;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingRequest = await passwordResetCollection.findOne({
        identifier,
        type,
        createdAt: { $gte: today }
      });

      return res.status(200).json({ requestedToday: !!existingRequest });
    }

    // FORGOT PASSWORD RECORD
    if (path === '/forgot-password/record' && method === 'POST') {
      const { identifier, type } = body;
      
      await passwordResetCollection.insertOne({
        identifier,
        type,
        createdAt: new Date()
      });

      return res.status(200).json({ success: true });
    }

    // RESET PASSWORD
    if (path === '/reset-password' && method === 'POST') {
      const { identifier, type, newPassword } = body;
      
      const filter = type === "email" ? { email: identifier } : { phone: identifier };
      const result = await usercollection.updateOne(
        filter,
        { $set: { password: newPassword, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({ success: true, message: "Password reset successfully" });
    }

    // POST AUDIO
    if (path === '/post-audio' && method === 'POST') {
      const { email, audio, duration, size } = body;
      
      // Check time (2 PM - 7 PM IST)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);
      const hours = istTime.getUTCHours();
      
      if (hours < 14 || hours >= 19) {
        return res.status(403).json({ error: "Audio uploads only allowed between 2 PM - 7 PM IST" });
      }

      if (duration > 300) {
        return res.status(400).json({ error: "Audio exceeds 5 minute limit" });
      }

      if (size > 100 * 1024 * 1024) {
        return res.status(400).json({ error: "Audio exceeds 100MB limit" });
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
      return res.status(201).json({ success: true, result });
    }

    // GET SUBSCRIPTION
    if (path === '/subscription' && method === 'GET') {
      const email = query.email;
      const subscription = await subscriptionCollection.findOne({ email });
      
      if (!subscription) {
        return res.status(200).json({ plan: "free", tweetsPerMonth: 1, tweetsUsed: 0 });
      }
      
      return res.status(200).json(subscription);
    }

    // CREATE/UPDATE SUBSCRIPTION
    if (path === '/subscription' && method === 'POST') {
      const { email, plan, tweetsPerMonth, price } = body;
      
      const subscription = {
        email,
        plan,
        tweetsPerMonth,
        price,
        tweetsUsed: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      await subscriptionCollection.updateOne(
        { email },
        { $set: subscription },
        { upsert: true }
      );

      return res.status(200).json({ success: true, subscription });
    }

    // CHECK TWEET LIMIT
    if (path === '/check-tweet-limit' && method === 'GET') {
      const email = query.email;
      const subscription = await subscriptionCollection.findOne({ email });
      
      if (!subscription) {
        const userPosts = await postcollection.countDocuments({
          email,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
        return res.status(200).json({ canPost: userPosts < 1, remaining: Math.max(0, 1 - userPosts) });
      }

      if (subscription.plan === "gold") {
        return res.status(200).json({ canPost: true, remaining: -1 });
      }

      const canPost = subscription.tweetsUsed < subscription.tweetsPerMonth;
      const remaining = subscription.tweetsPerMonth - subscription.tweetsUsed;
      return res.status(200).json({ canPost, remaining });
    }

    // INCREMENT TWEET COUNT
    if (path === '/increment-tweet-count' && method === 'POST') {
      const { email } = body;
      await subscriptionCollection.updateOne(
        { email },
        { $inc: { tweetsUsed: 1 } }
      );
      return res.status(200).json({ success: true });
    }

    // CREATE ORDER
    if (path === '/create-order' && method === 'POST') {
      const { amount, currency, receipt, email, planId } = body;
      
      // Check time (10 AM - 11 AM IST)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset);
      const hours = istTime.getUTCHours();
      
      if (hours < 10 || hours >= 11) {
        return res.status(403).json({ error: "Payments only allowed between 10 AM - 11 AM IST" });
      }

      const order = {
        id: `order_${Date.now()}`,
        amount,
        currency,
        receipt,
        status: "created"
      };

      return res.status(200).json(order);
    }

    // VERIFY PAYMENT
    if (path === '/verify-payment' && method === 'POST') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, plan, tweetsPerMonth, price } = body;
      
      const isValid = true; // In production, verify signature

      if (!isValid) {
        return res.status(400).json({ success: false, error: "Invalid signature" });
      }

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

      console.log(`Invoice sent to ${email} for ${plan} plan - ₹${price}`);
      return res.status(200).json({ success: true, message: "Payment verified and subscription activated" });
    }

    // RECORD LOGIN
    if (path === '/record-login' && method === 'POST') {
      const { email, browser, os, deviceType, ip, screenResolution, language, timestamp } = body;
      
      // Check mobile time restriction (10 AM - 1 PM IST)
      if (deviceType === "mobile") {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const hours = istTime.getUTCHours();
        
        if (hours < 10 || hours >= 13) {
          return res.status(403).json({ 
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
      return res.status(200).json({ success: true, allowed: true });
    }

    // GET LOGIN HISTORY
    if (path === '/login-history' && method === 'GET') {
      const email = query.email;
      const history = await loginHistoryCollection
        .find({ email })
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray();
      
      return res.status(200).json(history);
    }

    // UPDATE NOTIFICATION SETTINGS
    if (path.match(/^\/notification-settings\/[\w@.]+$/) && method === 'PATCH') {
      const email = path.split('/notification-settings/')[1];
      const { notificationsEnabled } = body;
      
      await usercollection.updateOne(
        { email },
        { $set: { notificationsEnabled } },
        { upsert: true }
      );

      return res.status(200).json({ success: true });
    }

    // GET NOTIFICATION SETTINGS
    if (path.match(/^\/notification-settings\/[\w@.]+$/) && method === 'GET') {
      const email = path.split('/notification-settings/')[1];
      const user = await usercollection.findOne({ email });
      
      return res.status(200).json({ notificationsEnabled: user?.notificationsEnabled ?? true });
    }

    // Route not found
    return res.status(404).json({ error: "Route not found" });
    
  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = allowCors(handler);
