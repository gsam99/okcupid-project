const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from public
app.use(express.static(path.join(__dirname, "public")));

// POST endpoint to save compatibility data
app.post("/submit", (req, res) => {
  const { surveyorName, groupId, maleId, femaleId, score, comment } = req.body;

  if (!surveyorName || !groupId || !maleId || !femaleId || !score) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  // Escape double quotes for CSV
  const escapeCSV = (value) =>
    `"${String(value || "").replace(/"/g, '""')}"`;

  const row = [
    escapeCSV(surveyorName),
    escapeCSV(groupId),
    escapeCSV(maleId),
    escapeCSV(femaleId),
    escapeCSV(score),
    escapeCSV(comment)
  ].join(",") + "\n";

  // Use /tmp so it works on Render
  const filePath = path.join("/tmp", "compatibility_results.csv");

  fs.appendFile(filePath, row, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
      return res.status(500).json({ success: false, message: "Failed to save file" });
    }
    res.json({ success: true, message: "Data saved successfully." });
  });
});

// Download CSV
app.get("/download", (req, res) => {
  const filePath = path.join("/tmp", "compatibility_results.csv");
  res.download(filePath, (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      res.status(500).send("Failed to download file.");
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
