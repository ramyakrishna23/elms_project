const express = require("express");
const router = express.Router();

let leaves = [];
let leaveId = 1;

// Apply leave
router.post("/apply", (req, res) => {
  const { employee, from, to, type } = req.body;

  if (!employee || !from || !to || !type) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const newLeave = {
    id: leaveId++,
    employee,
    from,
    to,
    type,
    status: "PENDING"
  };

  leaves.push(newLeave);
  res.json({ message: "Leave applied", leave: newLeave });
});

// Get all leaves
router.get("/all", (req, res) => {
  res.json(leaves);
});

// Update leave (Approve / Reject)
router.put("/update/:id", (req, res) => {
  const { status } = req.body;
  const id = Number(req.params.id);

  const leave = leaves.find(l => l.id === id);

  if (!leave) {
    return res.status(404).json({ error: "Leave not found" });
  }

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  leave.status = status;
  res.json({ message: "Leave updated", leave });
});

// ✅ THIS WAS MISSING
module.exports = router;
