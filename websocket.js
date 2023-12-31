const WebSocket = require("ws");
const _ = require("underscore");

const User = require("./models/User");

const Storage = require("./shared/Storage");

const instances = new Storage();
const notifications = new Storage();

const socketIo = (server) => {
  const wss = new WebSocket.Server({ server: server });

  wss.on("connection", (socket, req) => {
    const namespace = req.url;

    socket.on("message", handleMessage(socket, req));
    socket.on("close", handleClose(socket, req));
  });

  return wss;
};

const join = async ({ socket, req, data }) => {
  const instance = _.pick(data, "role", "_id", "email", "name", "banned");
  const key = req.headers["sec-websocket-key"];
  instance["key"] = key;
  instance["socket"] = socket;

  let user = instances.get({ _id: instance._id });

  if (user) {
    await User.updateOne({ _id: user._id }, { banned: true });
    instances.update({ _id: user._id }, { banned: true });
    const admins = instances.get({ role: "admin" }, { multi: true });
    const users = instances.get({ role: "user" }, { multi: true });
    broadcastTo(admins, {
      event: "load_onlineUsers",
      payload: users,
    });

    return;
  }

  user = instances.add(instance);
  loadOfflineNotifications(user);

  const admins = instances.get({ role: "admin" }, { multi: true });
  const users = instances.get({ role: "user" }, { multi: true });

  broadcastTo(admins, {
    event: "load_onlineUsers",
    payload: users,
  });
};

const rejoin = ({ socket, req, data }) => {
  console.log("rejoin");
  const instance = _.pick(data, "role", "_id", "email", "name", "banned");
  const key = req.headers["sec-websocket-key"];
  instance["key"] = key;
  instance["socket"] = socket;

  const user = instances.add(instance);
  loadOfflineNotifications(user);

  const admins = instances.get({ role: "admin" }, { multi: true });
  const users = instances.get({ role: "user" }, { multi: true });

  broadcastTo(admins, {
    event: "load_onlineUsers",
    payload: users,
  });
};

const ban = ({ socket, req, data }) => {
  const instance = _.pick(data, "role", "_id");
  const user = instances.get({ _id: instance._id });
  if (user) {
    sendTo(user, {
      event: "ban",
      role: "admin",
      payload: null,
    });
  }
};

const unload_cookies = ({ socket, req, data }) => {
  const { userId, cookiesToUnload } = _.pick(data, "userId", "cookiesToUnload");

  const users = instances.get({ _id: userId }, { multi: true });
  if (users.length < 1) return;
  broadcastTo(users, {
    event: "unload_cookies",
    payload: cookiesToUnload,
  });
};

const notify = ({ socket, req, data }) => {
  const { userId, message } = _.pick(data, "userId", "message");
  const user = instances.get({ _id: userId });
  if (!user) return notifications.add({ _id: userId, message });
  sendTo(user, {
    event: "notify",
    payload: message,
  });
};

const eventsRouter = {
  join: join,
  rejoin: rejoin,
  ban: ban,
  unload_cookies: unload_cookies,
  notify: notify,
};

function handleMessage(socket, req) {
  return function (data) {
    const package = JSON.parse(data);

    const { event, role, payload } = package;

    eventsRouter[event] &&
      eventsRouter[event]({ socket, req, data: { role, ...payload } });
  };
}

function handleClose(socket, req) {
  return function () {
    const key = req.headers["sec-websocket-key"];
    instances.remove({ key });
    const admins = instances.get({ role: "admin" }, { multi: true });
    let users = instances.get({ role: "user" }, { multi: true });
    users = users.map((d) => _.pick(d, "_id", "key", "name", "email"));

    broadcastTo(admins, {
      event: "load_onlineUsers",
      payload: users,
    });

    console.log("admins: ", admins);
  };
}

function loadUsers() {
  const admins = instances.get({ role: "admin" }, { multi: true });
  const users = instances.get({ role: "user" }, { multi: true });
  try {
    broadcastTo(admins, {
      event: "load_onlineUsers",
      payload: users,
    });
  } catch (error) {
    console.log("error: ", error.message);
  }
}

function loadOfflineNotifications(user) {
  if (user.role != "user") return;
  const noti = notifications.get({ _id: user._id }, { multi: true });
  if (!noti && noti.length == 0) return;
  console.log("notifications: ", noti);
  noti.forEach((notification) => {
    sendTo(user, {
      event: "notify",
      payload: notification.message,
    });
  });
  notifications.remove({ _id: user._id });
}

function sendTo(recevier, data) {
  recevier["socket"].send(JSON.stringify(data));
}

function broadcastTo(receviers, data) {
  const { socket, ...rest } = data;
  receviers.forEach((recevier) => {
    if (!recevier) return;
    try {
      recevier["socket"].send(JSON.stringify(rest));
    } catch (error) {
      console.log("error: #broadcastTo", error.message);
    }
  });
}

module.exports = {
  socketIo,
  instances,
  loadUsers,
};
