import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";  

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());
app.use(cors());

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

// Validate that GOOGLE_SCRIPT_URL is set
if (!GOOGLE_SCRIPT_URL) {
  console.error("❌ GOOGLE_SCRIPT_URL is missing in .env file!");
  process.exit(1); // Stop execution if URL is missing
}

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Fetch user data from Google Sheets
    const response = await axios.get(GOOGLE_SCRIPT_URL, { timeout: 5000 }); // Set timeout to 5 seconds
    const rows = response.data;

    if (!Array.isArray(rows)) {
      throw new Error("Invalid data format received from Google Sheets");
    }

    // Validate user credentials
    const user = rows.find(row => 
      Array.isArray(row) && row.length >= 2 &&
      row[0]?.trim() === email.trim() && row[1]?.trim() === password.trim()
    );

    if (user) {
      console.log("✅ Login successful for:", email);
      return res.json({ success: true, message: "Login successful" });
    } else {
      console.log("❌ Invalid credentials for:", email);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);

    if (error.code === "ECONNABORTED") {
      return res.status(503).json({ success: false, message: "Request to Google Sheets timed out" });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
