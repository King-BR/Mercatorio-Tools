const { ToolsDB, ToolsCategoriesDB } = require("../models/tools.js");
const auth = require("../middleware/auth.js");
const admin = require("../middleware/admin.js");
const express = require("express");
const router = express.Router();

const { client } = require("../discord/index.js");
const config = require("../discord/config.json");
const utils = require("../discord/utils.js");

// GET /api/tools
router.get("/", async (req, res) => {
  try {
    const tools = await ToolsDB.find().populate("category");
    res.status(200).json(tools);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error retrieving tools: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

// POST /api/tools
router.post("/", auth, admin, async (req, res) => {
  try {
    const newTool = new ToolsDB(req.body);
    const savedTool = await newTool.save();
    res.status(201).json(savedTool);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error creating new tool: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

// PUT /api/tools/:id
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const updatedTool = await ToolsDB.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedTool) {
      return res.status(404).json({ message: "Tool not found" });
    }
    res.status(200).json(updatedTool);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error updating tool ${req.params.id}: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

// DELETE /api/tools/:id
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const deletedTool = await ToolsDB.findByIdAndDelete(req.params.id);
    if (!deletedTool) {
      return res.status(404).json({ message: "Tool not found" });
    }
    res.status(200).json({ message: "Tool deleted successfully" });
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error deleting tool ${req.params.id}: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/tools/categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await ToolsCategoriesDB.find();
    res.status(200).json(categories);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error retrieving tool categories: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

// POST /api/tools/categories
router.post("/categories", auth, admin, async (req, res) => {
  try {
    const newCategory = new ToolsCategoriesDB(req.body);
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error creating new tool category: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

// PUT /api/tools/categories/:id
router.put("/categories/:id", auth, admin, async (req, res) => {
  try {
    const updatedCategory = await ToolsCategoriesDB.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error updating tool category ${req.params.id}: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

// DELETE /api/tools/categories/:id
router.delete("/categories/:id", auth, admin, async (req, res) => {
  try {
    const deletedCategory = await ToolsCategoriesDB.findByIdAndDelete(
      req.params.id,
    );

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error deleting tool category ${req.params.id}: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
