const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { request } = require("express");
const mongoose = require("mongoose");

//Create Product
const createProduct = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    price,
    sku,
    category,
    brand,
    quantity,
    image,
    regularPrice,
    color,
  } = req.body;

  if (!name || !description || !price || !category || !brand || !quantity) {
    res.send(400);
    throw new Error("Please fill in all fields");
  }

  const product = await Product.create({
    name,
    description,
    price,
    sku,
    category,
    brand,
    quantity,
    image,
    regularPrice,
    color,
  });
  res.status(201).json(product);
});

//Get Product

const getProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find().sort("-createdAt");
  res.status(200).json(products);
});

//Get Single Product

const getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.status(200).json(product);
});

//Delete Product

const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.status(200).json({
    message: "Product deleted successfully",
  });
});

//Update Product

const updateProduct = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    price,

    category,
    brand,
    quantity,
    image,
    regularPrice,
    color,
  } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  //Update Product
  const updateProduct = await Product.findByIdAndUpdate(
    { _id: req.params.id },
    {
      name,
      description,
      price,
      category,
      brand,
      quantity,
      image,
      regularPrice,
      color,
    },
    { new: true, runValidators: true }
  );
  res.status(200).json(updateProduct);
});

//Review Product
const reviewProduct = asyncHandler(async (req, res) => {
  const { star, review, reviewDate } = req.body;
  const { id } = req.params;

  // Validation
  if (star < 1 || !review) {
    res.status(400).json({ error: "Please add a star and review" });
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
  }

  // Update rating
  product.ratings.push({
    star,
    review,
    reviewDate,
    name: req.user.name,
    userID: req.user._id,
  });
  product.save();
  res.status(200).json({ message: "Product review added successfully" });
});

//Delete Review

const deleteReview = asyncHandler(async (req, res) => {
  const { userID } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  const newRatings = product.ratings.filter((rating) => {
    return rating.userID.toString() !== userID.toString();
  });
  product.ratings = newRatings;
  product.save();
  res.status(200).json({ message: "Review deleted successfully" });
});

//Update Review
const updateReview = asyncHandler(async (req, res) => {
  const { star, review, reviewDate, userID } = req.body;
  const { id } = req.params;
  // Validation
  if (star < 1 || !review) {
    res.status(400).json({ error: "Please add a star and review" });
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
  }
  //Match user to review
  if (req.user._id.toString() !== userID) {
    res.status(401);
    throw new Error("You are not authorized to update this review");
  }

  //Update product review
  //   const updateReview = await Product.findOneAndUpdate(
  //     {
  //       _id: product._id,
  //       "ratings.userID": userID,
  //       //   "ratings.userID": mongoose.Types.ObjectId(userID),
  //     },
  //     {
  //       $set: {
  //         "ratings.$.star": star,
  //         "ratings.$.review": review,
  //         "ratings.$.reviewDate": reviewDate,
  //       },
  //     },
  //     { new: true }
  //   );
  //   if (updateReview) {
  //     res.status(200).json({ message: "Product review updated successfully" });
  //   } else {
  //     res.status(400).json({ message: "Product review not updated" });
  //   }
  try {
    const updateReview = await Product.findOneAndUpdate(
      {
        _id: product._id,
        "ratings.userID": mongoose.Types.ObjectId(userID),
        // "ratings.userID": userID,
      },
      {
        $set: {
          "ratings.$.star": star,
          "ratings.$.review": review,
          "ratings.$.reviewDate": reviewDate,
        },
      },
      { new: true }
    );

    if (updateReview) {
      res.status(200).json({ message: "Product review updated successfully" });
    } else {
      console.log(updateReview);
      res.status(400).json({ message: "Product review not updated" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  reviewProduct,
  deleteReview,
  updateReview,
};
