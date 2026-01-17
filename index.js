require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://next-app-front-end.vercel.app/",
    ],
    credentials: true,
}));
app.use(express.json());

// Memory storage for serverless
const upload = multer({ storage: multer.memoryStorage() });


async function run() {
    try {
        console.log("UAV Shop API running...");

        /* ---------------- ADD ITEM ---------------- */
        app.post("/items", upload.single("image"), async (req, res) => {
            try {
                const { name, description, price } = req.body;

                if (!name || !price) {
                    return res.status(400).json({ error: "Name and price are required" });
                }

                let imageUrl = "";

                if (req.file) {
                    const formData = new FormData();
                    formData.append("image", req.file.buffer.toString("base64"));

                    const imgbbRes = await axios.post(
                        "https://api.imgbb.com/1/upload",
                        formData,
                        {
                            params: {
                                key: process.env.IMGBB_API_KEY,
                                album: process.env.IMGBB_ALBUM_ID
                            },
                            headers: formData.getHeaders()
                        }
                    );

                    imageUrl = imgbbRes.data.data.url;
                }

                const newItem = {
                    id: items.length + 1,
                    name,
                    description,
                    price,
                    image: imageUrl
                };

                items.push(newItem);

                res.status(201).json(newItem);
            } catch (err) {
                console.error("Upload error:", err.response?.data || err.message);
                res.status(500).json({ error: "Upload failed" });
            }
        });

        /*  GET ALL ITEMS */
        app.get("/items", (req, res) => {
            res.json(items);
        });

        /*  GET SINGLE ITEM  */
        app.get("/items/:id", (req, res) => {
            const item = items.find(i => i.id === Number(req.params.id));
            if (!item) return res.status(404).json({ error: "Item not found" });
            res.json(item);
        });

        /*  DELETE ITEM  */
        app.delete("/items/:id", (req, res) => {
            const id = Number(req.params.id);
            items = items.filter(i => i.id !== id);
            res.json({ success: true });
        });

    } catch (err) {
        console.error(err);
    }
}

run();

app.listen(port, () => {
    console.log(` UAV Shop Server running on port ${port}`);
});
