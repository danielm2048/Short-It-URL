require("dotenv").config();
const router = require("express").Router();

const Database = require("../../Database");

let uri =
	process.env.NODE_ENV === "test"
		? process.env.DB_TEST_URI
		: process.env.DB_STATS_URI;

const db = new Database(uri);

router.get("/:urlCode", (req, res) => {
	const { urlCode } = req.params;

	db.find("urlCode", urlCode)
		.then((stats) => {
			if (stats) {
				res.json(stats);
			} else {
				res.status(404).json("URL code not found...");
			}
		})
		.catch((err) => {
			console.error(err);
			res.status(500).json("Server error");
		});
});

module.exports = router;
