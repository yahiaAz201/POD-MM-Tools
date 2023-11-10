const jwt = require("jsonwebtoken");
const _ = require("underscore");

const User = require("../models/User");
const Subscriptions = require("../models/Subscriptions");
const { Error } = require("mongoose");

const { instances, loadUsers } = require("../websocket.js");

const jwt_secret = process.env.JWT_SECRET;

const signin = async (req, res) => {
  try {
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

    const isOnline = instances.get({ _id: user._id.toString() });

    if (isOnline && isOnline != []) {
      user.banned = true;
      await user.save();
      instances.update({ _id: user._id.toString() }, { banned: true });
      isOnline["socket"].send(
        JSON.stringify({ event: "reset_cookies", payload: null })
      );
      const admins = instances.get({ role: "admin" }, { multi: true });
      admins.forEach((admin) => {
        if (!admin) return;
        admin["socket"].send(
          JSON.stringify({
            event: "banned_users",
            payload: user._id.toString(),
          })
        );
      });
      loadUsers();
      return res.status(401).json({
        success: false,
        error:
          "Sorry, but your account has been banned from accessing this service. for sharing your account info",
      });
    }

    user = _.pick(user, "_id", "email", "banned");
    const token = jwt.sign(user, jwt_secret, { expiresIn: "30d" });
    res.send({
      success: true,
      token,
    });
  } catch (error) {
    res.send({ success: false, error: error.message });
  }
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
    let user = req.user;

    user = await user.populate({
      path: "subscriptions",
      select: "_id name website cookies",
      transform: (subscription) => {
        if (user.mySubscriptions.includes(subscription._id.toString())) {
          const subscriptionObject = subscription.toObject();
          subscriptionObject["subscribed"] = true;
          return subscriptionObject;
        } else {
          const { cookies, ...subscriptionWithoutCookies } =
            subscription.toObject();
          subscriptionWithoutCookies["subscribed"] = false;
          return subscriptionWithoutCookies;
        }
      },
    });

    console.log(user.subscriptions);

    const mySubscriptions = user.subscriptions.map((subscription) => {
      return _.pick(subscription, "_id", "name", "website", "subscribed");
    });

    res.send({
      success: true,
      mySubscriptions: mySubscriptions,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};

const loadSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!id)
      return res.status(400).send({
        success: false,
        error: "bad request format subscription id are required",
      });

    const { subscriptions } = await user.populate({
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

    const [subscription] = subscriptions.filter(
      (subscription) => subscription._id == id
    );

    if (!subscription["cookies"])
      return res.status(405).send({
        success: false,
        error: "you are not subscribed to this subscription",
      });

    res.send({
      success: true,
      subscription,
    });
  } catch (error) {
    res.send({ success: false, error: error.message });
  }
};

const listSubscriptions = async (req, res) => {
  try {
    let subscriptions = await Subscriptions.find();
    subscriptions = subscriptions.map((subscription) => {
      const { _id, name, website } = subscription;
      return { _id, name, website };
    });
    res.send(subscriptions);
  } catch (error) {
    res.send({ success: false, error: error.message });
  }
};

module.exports = {
  signin,
  signup,
  getMySubscriptions,
  loadSubscription,
  listSubscriptions,
};
