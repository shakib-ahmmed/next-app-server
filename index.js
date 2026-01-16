const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Mock in-memory item storage
let items = [];

// POST route to add item
app.post("/items", upload.single("image"), (req, res) => {
    const { name, description, price } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";
    const newItem = {
        id: items.length + 1,
        name,
        description,
        price,
        image,
    };
    items.push(newItem);
    res.status(201).json(newItem);
});

// GET all items
app.get("/items", (req, res) => {
    res.json(items);
});

app.listen(4000, () => {
    console.log(" Express API running at http://localhost:4000");
});
