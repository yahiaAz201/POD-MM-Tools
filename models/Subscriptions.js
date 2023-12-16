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
     console.log("error pre delete: ", err.message);
  }
});

SubscriptionsSchema.post("save", { document: true }, async function () {
  const newSubscriptionId = this._id;

  try {
    await User.updateMany(
      {},
      { $addToSet: { subscriptions: newSubscriptionId } }
    );
  } catch (err) {
        console.log("error pre post: ", err.message);
  }
});

const Subscriptions = mongoose.model("subscriptions", SubscriptionsSchema);

module.exports = Subscriptions;
