const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user.js");
const auth = require("../../middleware/auth.js");

// Generate Access Token (valid for 1 hour)
function generateAccessToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ accessToken: token });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
});

// PUT /api/auth/change-password
router.put(
  "/change-password",
  [
    auth, // This middleware ensures the user is authenticated
    check("currentPassword", "Current password is required").exists(),
    check("newPassword", "New password must be at least 6 characters").isLength(
      { min: 6 }
    ),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      // Find the user by ID from the JWT token
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // Check if the current password is correct
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Incorrect current password" });
      }

      // Hash the new password before saving
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      // Save the updated user information
      await user.save();

      res.json({ msg: "Password updated successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// POST /api/auth/refresh-token
router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ msg: "No refresh token, please log in" });
  }

  // Verify the refresh token
  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ msg: "Invalid refresh token" });
    }

    // Generate a new access token
    const accessToken = generateAccessToken({ id: user.id });
    res.json({ accessToken });
  });
});

module.exports = router;
