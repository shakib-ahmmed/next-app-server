import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import axios from "axios";
import FormData from "form-data";
import { ObjectId } from "mongodb";



dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ---------------- CORS ----------------
const allowedOrigins = [
    "http://localhost:3000",
    "https://next-app-front-end.vercel.app",
    "https://next-app-front-nfbgcl7b5-shakib-ahmmeds-projects.vercel.app"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// ---------------- BODY PARSER ----------------
app.use(express.json({ limit: "10mb" }));

// ---------------- MONGODB CONNECTION ----------------
let db, itemsCollection;

async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();
        db = client.db("uav-shop");
        itemsCollection = db.collection("items");
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}

connectDB();

// ---------------- ROUTES ----------------

// GET all items
app.get("/items", async (req, res) => {
    try {
        const items = await itemsCollection.find({}).toArray();
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch items" });
    }
});

// GET ITEM BY ID
app.get("/items/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid item ID" });
        }

        const item = await itemsCollection.findOne({ _id: new ObjectId(id) });

        if (!item) return res.status(404).json({ error: "Item not found" });

        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});


// POST new item
app.post("/items", async (req, res) => {
    try {
        const { name, description, price, image } = req.body;

        if (!name || !price || !image) {
            return res.status(400).json({ error: "Name, price, and image are required" });
        }

        // Upload image to Imgbb
        const formData = new FormData();
        formData.append("image", image);
        if (process.env.IMGBB_ALBUM_ID) formData.append("album", process.env.IMGBB_ALBUM_ID);

        const imgbbRes = await axios.post(
            `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
            formData,
            { headers: formData.getHeaders() }
        );

        const imageUrl = imgbbRes.data.data.url;

        // Insert into MongoDB
        const newItem = { name, description, price, image: imageUrl };
        const result = await itemsCollection.insertOne(newItem);

        res.status(201).json({ ...newItem, _id: result.insertedId });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: "Failed to add item" });
    }
});


app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
