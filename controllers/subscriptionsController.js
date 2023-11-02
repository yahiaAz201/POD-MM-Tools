const Subscriptions = require("../models/Subscriptions");
const _ = require("underscore");

const get = async (req, res) => {
  try {
    const { id } = req.params;

    let subscription;

    if (id) {
      subscription = await Subscriptions.findOne({ _id: id });
      if (!subscription)
        return res.status(404).send({
          success: false,
          error: "No subscription been found [!]",
        });
    } else {
      subscription = await Subscriptions.find();
    }
    return res.send({
      success: true,
      subscription,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      error: "500 Internal Server Error #subscriptions",
    });
  }
};

const add = async (req, res) => {
  try {
    const payload = req.body;
    const { _id, name, website, cookies } = req.body;

    // Check if an _id is provided in the request
    if (_id) {
      // If _id is provided, update the existing object
      const query = { _id }; // Find the existing object by _id
      const update = {
        name,
        website,
        cookies,
        // Add other fields from payload as needed
      };
      const subscription = await Subscriptions.findOneAndUpdate(query, update, {
        new: true,
      });
      res.status(200).send({ success: true, subscription });
    } else {
      // If _id is not provided, create a new object with a valid MongoDB _id
      const newSubscription = new Subscriptions({
        name,
        website,
        cookies,
        // Add other fields from payload as needed
      });
      const subscription = await newSubscription.save();
      res.status(201).send({ success: true, subscription });
    }
  } catch (err) {
    return res.status(409).send({ success: false, error: err.message });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const payload = _.pick(req.body, "name", "website", "cookies");

  let subscription = await Subscriptions.findOne({ _id: id });
  if (!subscription)
    return res
      .status(404)
      .send({ success: false, error: "No subscription been found [!]" });

  const updates = await subscription.updateOne(payload, { new: true });

  res.send(updates);
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    let subscription = await Subscriptions.findOne({ _id: id });
    if (!subscription)
      return res
        .status(404)
        .send({ success: false, error: "No subscription been found [!]" });

    subscription = await subscription.deleteOne();

    res.send({ success: true, subscription: subscription });
  } catch (error) {
    res.send({ success: false, error: error.message });
  }
};

module.exports = {
  get,
  add,
  update,
  remove,
};
