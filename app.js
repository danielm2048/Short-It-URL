require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const shorturlRoutes = require("./routes/shorturl");

app.use(cors());

app.use("", shorturlRoutes);

app.use("/public", express.static(`./public`));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

module.exports = app;
