require("dotenv").config();
const dns = require("dns");
const url = require("url");
const router = require("express").Router();
const validUrl = require("valid-url");
const { nanoid } = require("nanoid");

const Database = require("../../Database");

let dbs;

if (process.env.NODE_ENV === "test") {
	const dbTest = new Database(process.env.DB_TEST_URI);
	dbs = [dbTest, dbTest];
} else {
	const dbUrl = new Database(process.env.DB_URI);
	const dbUrlStats = new Database(process.env.DB_STATS_URI);
	dbs = [dbUrl, dbUrlStats];
}

const lookupPromise = (originalUrl) =>
	new Promise((resolve, reject) => {
    const parsedOriginalUrl = url.parse(originalUrl);

		const hostname = parsedOriginalUrl.hostname;

		dns.lookup(hostname, (err, address) => {
			if (err) reject(err);
			resolve(address);
		});
	});

router.post("/new", (req, res) => {
	const { originalUrl } = req.body;
	const baseUrl = process.env.BASE_URL;

	if (!validUrl.isUri(baseUrl)) {
		return res.status(401).json("Invalid base url");
	}

	lookupPromise(originalUrl)
		.then(() => {
			if (validUrl.isUri(originalUrl)) {
				const urlCode = nanoid(8);

				dbs[0]
					.find("originalUrl", originalUrl)
					.then((url) => {
						if (url) {
							res.json(url);
						} else {
							const shortUrl = `${baseUrl}/${urlCode}`;
							Promise.all([dbs[0].read(), dbs[1].read()])
								.then((bins) => {
									const newUrl = {
										originalUrl,
										shortUrl,
										urlCode,
									};

									bins[0].push(newUrl);

									const newUrlStats = {
										creationDate: new Date()
											.toISOString()
											.slice(0, 19)
											.replace("T", " "),
										redirectCount: 0,
										originalUrl,
										urlCode,
									};

									bins[1].push(newUrlStats);

									Promise.all([dbs[0].update(bins[0]), dbs[1].update(bins[1])])
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
		})
		.catch((err) => {
			console.error(err);
			res.status(401).json("Invalid hostname");
		});
});

module.exports = router;
