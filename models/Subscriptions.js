const mongoose = require("mongoose");

const User = require("./User");

const SubscriptionsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    website: {
      type: String,
      required: true,
      unique: true,
    },
    cookies: {
      type: Object,
      required: true,
    },
  },
  { collection: "subscriptions" }
);

SubscriptionsSchema.pre("deleteOne", { document: true }, async function (next) {
  const subscriptionId = this._id;

  try {
    await User.updateMany(
      { subscriptions: subscriptionId },
      { $pull: { subscriptions: subscriptionId } },
      {}
    );
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

SubscriptionsSchema.pre("save", { document: true }, async function (next) {
  const newSubscriptionId = this._id;

  try {
    await User.updateMany(
      {},
      { $addToSet: { subscriptions: newSubscriptionId } }
    );
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

const Subscriptions = mongoose.model("subscriptions", SubscriptionsSchema);

module.exports = Subscriptions;
