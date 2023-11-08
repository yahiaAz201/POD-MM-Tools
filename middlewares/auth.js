const User = require("../models/User");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
  const { token } = req.headers;
  try {
    if (!token)
      return res
        .status(403)
        .json({ success: false, error: "No token provided" });

    let user = jwt.verify(token, JWT_SECRET);
    user = await User.findOne({ _id: user._id });

    if (!user)
      return res
        .status(404)
        .json({ success: false, error: "No user were found" });

    if (user.banned)
      return res.status(401).json({
        success: false,
        error:
          "Sorry, but your account has been banned from accessing this service.",
      });

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
module.exports = auth;
