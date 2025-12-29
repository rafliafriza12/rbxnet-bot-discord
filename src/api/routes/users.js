import { Router } from "express";
import User from "../../models/User.js";

const router = Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    const { limit = 50, page = 1, sort = "-createdAt" } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user by Discord ID
router.get("/:discordId", async (req, res) => {
  try {
    const user = await User.findOne({ discordId: req.params.discordId });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user
router.put("/:discordId", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { discordId: req.params.discordId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
router.delete("/:discordId", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      discordId: req.params.discordId,
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leaderboard
router.get("/stats/leaderboard", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await User.find()
      .sort({ level: -1, experience: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
