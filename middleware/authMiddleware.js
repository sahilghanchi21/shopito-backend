const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }

    //Verify Token
    const vrified = jwt.verify(token, process.env.JWT_SECRET);

    //get user id from token
    const user = await User.findById(vrified.id).select("-password");

    if (!user) {
      res.status(400);
      throw new Error("User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }
});

//Admin only

const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized, please login as admin");
  }
});

module.exports = {
  protect,
  adminOnly,
};
