// Load environment variables
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from public
app.use(express.static(path.join(__dirname, "public")));

// Connect to PostgreSQL (always use SSL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// TEST route to verify DB connectivity
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(500).json({ success: false, message: "DB connection failed" });
  }
});

// POST endpoint to save compatibility data
app.post("/submit", async (req, res) => {
  const { surveyorName, groupId, maleId, femaleId, score, comment } = req.body;

  if (!surveyorName || !groupId || !maleId || !femaleId || !score) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const query = `
      INSERT INTO compatibility_results
      (surveyor_name, group_id, male_id, female_id, score, comment)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const values = [surveyorName, groupId, maleId, femaleId, score, comment];
    const result = await pool.query(query, values);

    res.json({ success: true, message: "Data saved successfully.", id: result.rows[0].id });
  } catch (error) {
    console.error("Error saving data to PostgreSQL:", error);
    res.status(500).json({ success: false, message: "Failed to save data." });
  }
});

// Download all records as CSV
app.get("/download", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM compatibility_results ORDER BY created_at DESC");
    const rows = result.rows;

    const csvHeader = "Surveyor Name,Group ID,Male ID,Female ID,Score,Comment,Created At\n";
    const csvRows = rows
      .map(r =>
        [
          r.surveyor_name,
          r.group_id,
          r.male_id,
          r.female_id,
          r.score,
          r.comment || "",
          r.created_at ? r.created_at.toISOString() : ""
        ]
          .map(val => `"${String(val).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const csvContent = csvHeader + csvRows;

    res.setHeader("Content-disposition", "attachment; filename=compatibility_results.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error downloading CSV:", error);
    res.status(500).send("Failed to download file.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
