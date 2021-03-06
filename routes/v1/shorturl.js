require("dotenv").config();
const router = require("express").Router();
const validUrl = require("valid-url");
const { nanoid } = require("nanoid");

const Database = require("../../Database");

const dbUrl = new Database(process.env.DB_URI);
const dbUrlStats = new Database(process.env.DB_STATS_URI);

router.post("/new", (req, res) => {
	const { originalUrl } = req.body;
	const baseUrl = process.env.BASE_URL;

	if (!validUrl.isUri(baseUrl)) {
		return res.status(401).json("Invalid base url");
	}

	if (validUrl.isUri(originalUrl)) {
		const urlCode = nanoid();

		dbUrl
			.find("originalUrl", originalUrl)
			.then((url) => {
				if (url) {
					res.json(url);
				} else {
					const shortUrl = `${baseUrl}/${urlCode}`;
					Promise.all([dbUrl.read(), dbUrlStats.read()])
						.then((bins) => {
							const newUrl = {
								originalUrl,
								shortUrl,
								urlCode,
							};

							bins[0].push(newUrl);

							const newUrlStats = {
								creationDate: new Date(),
								redirectCount: 0,
								originalUrl,
								urlCode,
							};

							bins[1].push(newUrlStats);

							Promise.all([dbUrl.update(bins[0]), dbUrlStats.update(bins[1])])
								.then(() => res.json(newUrl))
								.catch((err) => {
									console.error(err);
									res.status(500).json("Server error");
								});
						})
						.catch((err) => {
							console.error(err);
							res.status(500).json("Server error");
						});
				}
			})
			.catch((err) => {
				console.error(err);
				res.status(500).json("Server error");
			});
	} else {
		return res.status(401).json("Invalid long url");
	}
});

module.exports = router;
