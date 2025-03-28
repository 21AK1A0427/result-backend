import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = 5000;

const VALIDATE_EXAM_API = "https://script.google.com/macros/s/AKfycbxz4tQmisao4x8cl0S-mfFlk0KQK3U05rAW1zudzOzOpwLYm6Rtvxzcu8_oqpmyM_h-/exec";

app.use(cors());
app.use(express.json());

app.post("/validate", async (req, res) => {
  const { email, password, rollNumber } = req.body;

  if (!email || !password || !rollNumber) {
    return res.status(400).json({ success: false, error: "All fields are required!" });
  }

  try {
    const response = await axios.get(VALIDATE_EXAM_API);
    const { emails, passwords, rollNumbers } = response.data; // Updated field

    const index = emails.indexOf(email);
    if (index !== -1 && passwords[index] === password && rollNumbers[index] === rollNumber) {
      return res.json({ success: true, message: "Login successful!" });
    } else {
      return res.status(401).json({ success: false, error: "Invalid credentials! Please check your details." });
    }
  } catch (error) {
    console.error("Error validating credentials:", error);
    return res.status(500).json({ success: false, error: "Network error! Please try again later." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
