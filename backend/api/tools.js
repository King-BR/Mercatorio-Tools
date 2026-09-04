const ToolsDB = require("../models/tools.js");
const auth = require("../middleware/auth.js");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const tools = await ToolsDB.find();
    res.status(200).json(tools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const tool = await ToolsDB.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ message: "Tool not found" });
    }
    res.status(200).json(tool);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const newTool = new ToolsDB(req.body);
    const savedTool = await newTool.save();
    res.status(201).json(savedTool);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", auth, async (req, res) => {
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
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedTool = await ToolsDB.findByIdAndDelete(req.params.id);
    if (!deletedTool) {
      return res.status(404).json({ message: "Tool not found" });
    }
    res.status(200).json({ message: "Tool deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
