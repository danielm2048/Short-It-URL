require("dotenv").config();
const router = require("express").Router();

const Database = require("../../Database");

const dbUrlStats = new Database(process.env.DB_STATS_URI);

router.get("/:urlCode", (req, res) => {
	const { urlCode } = req.params;

	dbUrlStats
		.find("urlCode", urlCode)
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
