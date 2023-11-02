const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    mySubscriptions: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "subscriptions",
    },
    subscriptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subscriptions",
      },
    ],
    banned: {
      type: Boolean,
      default: false,
    },
  },
  { collection: "user" }
);

const User = mongoose.model("user", userSchema);

module.exports = User;
