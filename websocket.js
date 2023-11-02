const WebSocket = require("ws");
const _ = require("underscore");

const Storage = require("./shared/Storage");

const instances = new Storage();

const socketIo = (server) => {
  const wss = new WebSocket.Server({ server: server });

  wss.on("connection", (socket, req) => {
    const namespace = req.url;

    socket.on("message", handleMessage(socket, req));
    socket.on("close", handleClose(socket, req));
  });

  return wss;
};

const join = ({ socket, req, data }) => {
  console.log("join");
  const instance = _.pick(data, "role", "_id", "email", "name");
  const key = req.headers["sec-websocket-key"];
  instance["key"] = key;
  instance["socket"] = socket;

  instances.add(instance);

  const admins = instances.get({ role: "admin" }, { multi: true });
  const users = instances.get({ role: "user" }, { multi: true });

  broadcastTo(admins, {
    event: "load_onlineUsers",
    payload: users,
  });
};

const rejoin = ({ socket, req, data }) => {
  console.log("rejoin");
  const instance = _.pick(data, "role", "_id", "email", "name");
  const key = req.headers["sec-websocket-key"];
  instance["key"] = key;
  instance["socket"] = socket;

  instances.add(instance);

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

const eventsRouter = {
  join: join,
  rejoin: rejoin,
  ban: ban,
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

function sendTo(recevier, data) {
  recevier["socket"].send(JSON.stringify(data));
}

function broadcastTo(receviers, data) {
  receviers.forEach((recevier) => {
    recevier["socket"].send(JSON.stringify(data));
  });
}

module.exports = socketIo;
