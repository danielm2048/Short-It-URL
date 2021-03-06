require("dotenv").config();
const request = require("supertest");

const server = require("./index");
const app = require("./app");

const Database = require("./Database");
const dbTest = new Database(process.env.DB_TEST_URI);

// Fix for open handles issue
afterAll(async () => {
	await server.close();
	await new Promise((resolve) => setTimeout(resolve, 500));
});

// Empty test bin after each test
afterEach(async () => {
	await dbTest.update([]);
});

const url = [
	{
		originalUrl: "https://test.com",
		shortUrl: "http://localhost:5000",
		urlCode: "test",
	},
];

describe("Database class", () => {
	it("Should return an empty bin", async () => {
		const bin = await dbTest.read();

		expect(bin.length).toBe(0);
	});

	it("Should update the bin", async () => {
		expect.assertions(2);

		await dbTest.update(url);

		const bin = await dbTest.read();

		// Expect updated bin length to be sent bin length
		expect(bin.length).toBe(1);

		// Expect updated bin to be equal to sent bin
		expect(bin).toEqual(url);
	});

	it("Should find an item in the bin by param and value", async () => {
		const param = "originalUrl";
		const value = "https://test.com";

		await dbTest.update(url);

		const res = await dbTest.find(param, value);

		// Expect found url object to equal url object sent
		expect(res).toEqual(url[0]);
	});
});

describe("shorturl route", () => {
	it("Should add a new url successfully", async () => {
		const goodUrl = {
			originalUrl: "https://test.com",
		};
		const response = await request(app).post("/api/shorturl/new").send(goodUrl);

		expect(response.body.originalUrl).toBe(goodUrl.originalUrl);
	});

	it("Should return an error message with 401 status code if url is not valid", async () => {
		expect.assertions(2);
		const badUrl = {
			originalUrl: "test.com",
		};
		const response = await request(app).post("/api/shorturl/new").send(badUrl);

		expect(response.status).toBe(401);

		expect(response.body).toBe("Invalid long url");
	});

	it("Should return an error message with 401 status code if hostname is not valid", async () => {
		expect.assertions(2);
		const badUrl = {
			originalUrl: "https://baba.bobo",
		};
		const response = await request(app).post("/api/shorturl/new").send(badUrl);

		expect(response.status).toBe(401);

		expect(response.body).toBe("Invalid hostname");
	});
});

describe("stats route", () => {
	it("Should return stats for a url object by urlCode", async () => {
		await dbTest.update(url);

		const bin = await dbTest.read();

		const response = await request(app).get(`/api/stats/${bin[0].urlCode}`);

		expect(response.body.urlCode).toBe(bin[0].urlCode);
	});

	it("Should return an error message with 404 status code if urlCode is not found", async () => {
		expect.assertions(2);

		const response = await request(app).get(`/123456`);

		expect(response.status).toBe(404);

		expect(response.body).toBe("URL code not found...");
	});
});

describe("redirect", () => {
	it("Should redirect to correct url", async () => {
		await dbTest.update(url);

		const bin = await dbTest.read();

		const response = await request(app).get(`/${bin[0].urlCode}`);

		expect(response.headers.location).toBe(bin[0].originalUrl);
	});

	it("Should return an error message with 404 status code if urlCode is not found", async () => {
		expect.assertions(2);

		const response = await request(app).get(`/123456`);

		expect(response.status).toBe(404);

		expect(response.body).toBe("URL code not found...");
	});
});
