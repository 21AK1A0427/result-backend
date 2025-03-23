import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" })); // Allow all origins

const GOOGLE_SCRIPT_FETCH_URL =
  "https://script.google.com/macros/s/AKfycbxDI7nz5fIrnXMwMhiOgW9_sZNTinWOJ8Jr2blxD6MLEqC6ekSbXvHA9KQFFyQfE9J1/exec";
const GOOGLE_SCRIPT_STORE_URL =
  "https://script.google.com/macros/s/AKfycby2yVDiHVOW0Q17kgR45jBeZ9cdNIqoY8bTckjZnAxDNylJgiprN6fEccfywWxhzeuZ/exec";

let studentIds = [];
let teamIds = [];
const recentSubmissions = new Map(); // Store recent submissions { id: timestamp }

// 🔹 Fetch Student & Team IDs from Google Sheets
const fetchStudentData = async () => {
  try {
    const { data } = await axios.get(GOOGLE_SCRIPT_FETCH_URL);

    if (!data || !Array.isArray(data.studentIds) || !Array.isArray(data.teamIds)) {
      throw new Error("❌ Invalid data format from Google Sheets");
    }

    studentIds = data.studentIds.map((id) => id.trim().toUpperCase());
    teamIds = data.teamIds.map((id) => id.trim().toUpperCase());

  } catch (error) {
    console.error("❌ Error fetching student data:", error.message);
  }
};

// 🔹 Fetch data initially and refresh every 5 minutes
fetchStudentData();
setInterval(fetchStudentData, 5 * 60 * 1000);

// ✅ API to return student & team IDs
app.get("/exam", (req, res) => {
  res.json({ success: true, studentIds, teamIds });
});

// ✅ Validate & Store login details
app.post("/exam/submit", async (req, res) => {
  try {
    await fetchStudentData(); // 🔹 Ensure latest data before validation

    let { id, round } = req.body;
    if (!id || !round) {
      return res.status(400).json({ success: false, message: "⚠️ ID and Round are required" });
    }

    id = id.trim().toUpperCase();

    // Check if the ID was recently submitted
    const cooldownTime = 30 * 1000; // 30 seconds cooldown
    const lastSubmission = recentSubmissions.get(id);
    const currentTime = Date.now();

    if (lastSubmission && currentTime - lastSubmission < cooldownTime) {
      return res.status(400).json({ success: false, message: "⚠️ Please wait before submitting again." });
    }

    const isValid = round === "round1" ? studentIds.includes(id) : teamIds.includes(id);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "❌ Invalid ID" });
    }

    // Store the timestamp to prevent duplicate submissions
    recentSubmissions.set(id, currentTime);

    const timestamp = new Date().toLocaleString("en-GB", { timeZone: "Asia/Kolkata" });
    const postData = { id, round, timestamp };

    await axios.post(GOOGLE_SCRIPT_STORE_URL, postData);

    res.json({ success: true, message: "🎯 Login recorded successfully" });
  } catch (error) {
    console.error("❌ Error submitting login:", error.message);
    res.status(500).json({ success: false, message: "⚠️ Error submitting data", error: error.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
