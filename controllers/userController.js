const jwt = require("jsonwebtoken");
const _ = require("underscore");

const User = require("../models/User");
const Subscriptions = require("../models/Subscriptions");
const { Error } = require("mongoose");

const jwt_secret = process.env.JWT_SECRET;

const signin = async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email: email });

  if (!user || user.password != password)
    return res
      .status(401)
      .json({ success: false, error: "Email or Password Incorrect " });

  if (user.banned)
    return res.status(401).json({
      success: false,
      error:
        "Sorry, but your account has been banned from accessing this service.",
    });

  user = _.pick(user, "_id", "email");
  const token = jwt.sign(user, jwt_secret, { expiresIn: "30d" });
  res.send({
    success: true,
    token,
  });
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email: email });

    if (user) {
      return res.json({ success: false, error: "Email already in use [!] " });
    }

    const subscriptions = await Subscriptions.find();
    const subscriptionIds = subscriptions.map(
      (subscription) => subscription._id
    );

    user = new User({
      name,
      email,
      password,
      subscriptions: subscriptionIds, // If you want to initialize the subscriptions array with subscription _id values
    });

    user = await user.save();

    // The following code is similar to the signin route to populate and transform the subscriptions
    user = await user.populate({
      path: "subscriptions",
      select: "_id name website cookies",
      transform: (subscription) => {
        if (user.mySubscriptions.includes(subscription._id.toString())) {
          return subscription;
        } else {
          const { cookies, ...subscriptionWithoutCookies } =
            subscription.toObject();
          subscriptionWithoutCookies["cookies"] = null;
          return subscriptionWithoutCookies;
        }
      },
    });

    user = _.pick(user, "_id", "email", "subscriptions");
    const token = jwt.sign(user, jwt_secret);
    res.send({
      success: true,
      token,
    });
  } catch (err) {
    res.send({
      success: false,
      error: err.message,
    });
  }
};

const getMySubscriptions = async (req, res) => {
  try {
    const token = req.headers["token"];
    if (!token) throw new Error("token must be provided");
    let user = jwt.verify(token, jwt_secret);
    user = await User.findOne({ _id: user._id });

    if (!user) throw new Error("no user was found");

    if (user.banned)
      return res.status(401).json({
        success: false,
        error:
          "Sorry, but your account has been banned from accessing this service.",
      });

    user = await user.populate({
      path: "subscriptions",
      select: "_id name website cookies",
      transform: (subscription) => {
        if (user.mySubscriptions.includes(subscription._id.toString())) {
          return subscription;
        } else {
          const { cookies, ...subscriptionWithoutCookies } =
            subscription.toObject();
          subscriptionWithoutCookies["cookies"] = null;
          return subscriptionWithoutCookies;
        }
      },
    });

    res.send({
      success: true,
      mySubscriptions: user.subscriptions,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

module.exports = { signin, signup, getMySubscriptions };
