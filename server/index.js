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
