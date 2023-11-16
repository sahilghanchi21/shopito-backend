const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Register User -------------------------------------------------

const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  //   Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all requierd fields");
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be up to 8 characters");
  }
  //Check if user exist
  const userExist = await User.findOne({ email });
  if (userExist) {
    res.status(400);
    throw new Error("Email is already been registered");
  }
  //   Create new user
  const user = await User.create({
    name,
    email,
    password,
  });
  //Generate token
  const token = generateToken(user._id);
  if (user) {
    const { _id, name, email, role } = user;
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      //   secure:true,
      //   sameSite:none,
    });
    //send user data
    res.status(201).json({
      _id,
      name,
      email,
      role,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }

  res.send("Register user...");
});

// Login User -------------------------------------------------

const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Validate Request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and  password");
  }

  //Check if user exist
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User does not exist");
  }

  //user exist, check if password is correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  //Generate token
  const token = generateToken(user._id);

  if (user && passwordIsCorrect) {
    const newUser = await User.findOne({ email }).select("-password");

    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      //   secure:true,
      //   sameSite:none,
    });
    //send user data
    res.status(201).json(newUser);
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});
// Logout User -------------------------------------------------

const logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(Date(0)),
    //   secure:true,
    //   sameSite:none,
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

// Get User -------------------------------------------------

const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password");
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Get Login Status -------------------------------------------------

const getLoginStatus = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }

  //Verify Token
  const vrified = jwt.verify(token, process.env.JWT_SECRET);
  if (vrified) {
    res.json(true);
  } else {
    res.json(false);
  }
});

// Update User -------------------------------------------------

const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, phone, address } = user;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.address = req.body.address || address;
    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Update Photo -------------------------------------------------

const updatePhoto = asyncHandler(async (req, res, next) => {
  const { photo } = req.body;
  const user = await User.findById(req.user._id);
  user.photo = photo;
  const updatedUser = await user.save();
  res.status(200).json(updatedUser);
});
module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  getLoginStatus,
  updateUser,
  updatePhoto,
};
