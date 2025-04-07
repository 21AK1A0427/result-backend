import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/submit", async (req, res) => {
    try {
        const response = await axios.post(
            "https://script.google.com/macros/s/AKfycbwUx3ITUJASCTcT5h31jVLc1Ue-4bAVb9ceF0IXS698eUnpeXOQ35WBXbJLJPD2dJLv/exec",
            req.body
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to submit data" });
    }
});

app.listen(5000, () => console.log("Proxy server running on port 5000"));
