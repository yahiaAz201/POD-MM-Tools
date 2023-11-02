const Admin = require("../models/Admin");
const User = require("../models/User");

const _ = require("underscore");
const jwt = require("jsonwebtoken");

const jwt_secret = process.env.JWT_SECRET;

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await Admin.findOne({ email: email });

    if (!user || user.password != password)
      return res
        .status(401)
        .json({ success: false, error: "Email or Password Incorrect " });
    user = _.pick(user, "_id", "email");
    const token = jwt.sign(user, jwt_secret);
    res.send({
      success: true,
      token,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      success: false,
      error: "500 Server Error ",
    });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    let query = {};
    if (id) {
      query = { _id: id };
    }

    let user = await User.find(query, "-password -__v").populate({
      path: "mySubscriptions",
      select: "_id name website",
    });
    if (!user)
      return res
        .status(404)
        .send({ success: false, error: "no user exist with this id [!]" });

    return res.send({ success: true, users: user });
  } catch (err) {
    res.status(500).send({
      success: false,
      error: err.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = _.pick(
      req.body,
      "name",
      "email",
      "mySubscriptions",
      "banned"
    );
    if (!id)
      return res
        .status(400)
        .send({ success: false, error: "user id not included [!]" });

    let user = await User.findOne({ _id: id });
    if (!user)
      return res
        .status(404)
        .send({ success: false, error: "no user exist with this id [!]" });

    user = await user.updateOne({
      ...payload,
    });
    return res.send({ success: true, user: user });
  } catch (err) {
    res.status(500).send({
      success: false,
      error: err.message,
    });
  }
};

const removeUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(400)
        .send({ success: false, error: "user id not included [!]" });

    let user = await User.findOne({ _id: id });
    if (!user)
      return res
        .status(404)
        .send({ success: false, error: "no user exist with this id [!]" });
    user = await user.deleteOne();
    return res.send({ success: true, user });
  } catch (err) {
    res.status(500).send({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  signin,
  getUser,
  updateUser,
  removeUser,
};
