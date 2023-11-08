require("dotenv").config();
const path = require("path");
const http = require("http");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const app = express();
const server = http.createServer(app, { setTimeout: null });

const { socketIo } = require("./websocket");

socketIo(server);

const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const port = process.env.PORT || 3001;

app.use("/user", userRouter);
app.use("/admin", adminRouter);

const dbUri = process.env.DB_URI;

mongoose
  .connect(dbUri)
  .then(() => {
    console.log("Connected successfully to the database [✅]");
    server.listen(port, () => {
      console.log(`Example app listening on port `, port);
    });
  })
  .catch((e) => {
    console.log("Unable to connect [!]");
    console.log(e.message);
  });
