require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const shorturlRoutes = require("./routes/v1/shorturl");
const statsRoutes = require("./routes/v1/stats");

const Database = require("./Database");

let uri =
	process.env.NODE_ENV === "test"
		? process.env.DB_TEST_URI
		: process.env.DB_STATS_URI;

const db = new Database(uri);

app.use(cors());
app.use(express.json({ extended: false }));

app.use("/public", express.static(`./public`));

app.use("/api/shorturl", shorturlRoutes);
app.use("/api/stats", statsRoutes);

app.get("/:urlCode", (req, res) => {
	const { urlCode } = req.params;

	db.find("urlCode", urlCode).then((url) => {
		if (url) {
			db.read().then((bin) => {
				bin.forEach((value) => {
					if (value.urlCode === urlCode) {
						value.redirectCount++;
					}
				});
				db.update(bin).then(() => res.redirect(url.originalUrl));
			});
		} else {
			res.status(404).json("URL code not found...");
		}
	});
});

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

module.exports = app;
