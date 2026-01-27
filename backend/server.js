const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/leaves", require("./routes/leaveRoutes"));

// Health check
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
app.get("/", (req, res) => {
  res.send("Backend is running");
});
