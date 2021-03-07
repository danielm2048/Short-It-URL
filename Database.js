require("dotenv").config();
const axios = require("axios").default;

const secretKey = process.env.SECRET_KEY;

const headers = {
	"Content-Type": "application/json",
	"X-Master-Key": secretKey,
};

class Database {
	constructor(uri) {
		this.uri = uri;
	}

	read() {
		return axios
			.get(`${this.uri}/latest`, {
				headers,
			})
			.then((res) => {
				return res.data.record["bin"];
			})
			.catch((err) => console.error(err));
	}

	update(bin) {
		return axios
			.put(this.uri, JSON.stringify({ bin: bin }), {
				headers,
			})
			.then((res) => res.data)
			.catch((err) => console.error(err));
	}

	find(param, value) {
		return axios
			.get(`${this.uri}/latest`, {
				headers,
			})
			.then((res) => {
				const data = res.data.record["bin"];
				return data.find((item) => item[param] === value);
			})
			.catch((err) => console.error(err));
	}
}

module.exports = Database;
