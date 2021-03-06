require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const shorturlRoutes = require("./routes/v1/shorturl");

app.use(cors());
app.use(express.json({ extended: false }));

app.use("/api", shorturlRoutes);

app.use("/public", express.static(`./public`));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

module.exports = app;
