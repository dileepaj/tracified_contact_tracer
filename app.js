/**
 * Copyright 2019-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger For Original Coast Clothing
 * https://developers.facebook.com/docs/messenger-platform/getting-started/sample-apps/original-coast-clothing
 */

"use strict";

// Imports dependencies and set up http server
const express = require("express"),
	{ urlencoded, json } = require("body-parser"),
	crypto = require("crypto"),
	path = require("path"),
	Receive = require("./services/receive"),
	GraphAPi = require("./services/graph-api"),
	User = require("./services/user"),
	config = require("./services/config"),
	i18n = require("./i18n.config"),
	app = express();

const mongoose = require("mongoose");
const AdminUserService = require("./services/admin-user-service");
const TracifiedService = require("./services/tracified-service");

const jwt = require('jsonwebtoken');

var users = {};

// Parse application/x-www-form-urlencoded
app.use(
	urlencoded({
		extended: true
	})
);

// Parse application/json. Verify that callback came from Facebook
app.use(json({ verify: verifyRequestSignature }));

// Serving static files in Express
app.use(express.static(path.join(path.resolve(), "public")));

// Set template engine in Express
app.set("view engine", "ejs");

// Respond with index file when a GET request is made to the homepage
app.get("/", function (_req, res) {
	res.render("index");
});

// For facebook webview for admins
app.get("/share", function (_req, res) {
	res.render("share");
});

/**
 * MongoDB Connection
 */
mongoose.connection.on("connected", () => {
	console.log("DB Connection Established");
});

mongoose.connection.on("reconnected", () => {
	console.log("DB Connection Reestablished");
});

mongoose.connection.on("disconnected", () => {
	console.log("DB Connection Disconnected");
});

mongoose.connection.on("close", () => {
	console.log("DB Connection Closed");
});

mongoose.connection.on("error", (error) => {
	console.log("ERROR: " + error);
});

mongoose.set("useNewUrlParser", true);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

mongoose.connect(process.env.MONGOLAB_URI).then(() => {
	console.log("successfully conected to mongoDB");
}).catch((err) => {
	console.log(err.message);
});

mongoose.Promise = global.Promise; // Use global promises for mongoose

//add admin to db
app.post("/user/admin", (req, res) => {
	console.log("Inside register admin")
	// TODD repopulate workflows
	const decodedToken = jwt.decode(req.body.admin.token);
	TracifiedService.repopulateWorkflows(decodedToken);
	TracifiedService.addEmployeeAsItem(req.body.admin.token, req.body.admin.tenantId).then((registeredItems) => {
		// Updating permissions and expiry
		AdminUserService.createUser(decodedToken, req.body.admin.username, req.body.admin.password, req.body.admin.tenantId, registeredItems).then((admin) => {
			res.status(200).send("Admin added successfully");
		}).catch((err) => {
			res.status(403).send("Admin not added." + err);
		})
	}).catch((error) => {
		console.log("Tracified item creation failed");
		console.log(error);
	});
});

// For admin registration
app.get("/register", function (_req, res) {
	res.render("register");
});

// For admin email validation
app.get("/confirm", function (_req, res) {
	res.render("confirm");
});

// Adds support for GET requests to our webhook
app.get("/webhook", (req, res) => {
	// Parse the query params
	let mode = req.query["hub.mode"];
	let token = req.query["hub.verify_token"];
	let challenge = req.query["hub.challenge"];

	// Checks if a token and mode is in the query string of the request
	if (mode && token) {
		// Checks the mode and token sent is correct
		if (mode === "subscribe" && token === config.verifyToken) {
			// Responds with the challenge token from the request
			console.log("WEBHOOK_VERIFIED");
			res.status(200).send(challenge);
		} else {
			// Responds with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403);
		}
	}
});

// Creates the endpoint for your webhook
app.post("/webhook", (req, res) => {
	let body = req.body;

	// Checks if this is an event from a page subscription
	if (body.object === "page") {
		// Returns a '200 OK' response to all requests
		res.status(200).send("EVENT_RECEIVED");

		// Iterates over each entry - there may be multiple if batched
		body.entry.forEach(function (entry) {
			if ("changes" in entry) {
				// Handle Page Changes event
				let receiveMessage = new Receive();
				if (entry.changes[0].field === "feed") {
					let change = entry.changes[0].value;
					switch (change.item) {
						case "post":
							return receiveMessage.handlePrivateReply("post_id", change.post_id);
							break;
						case "comment":
							return receiveMessage.handlePrivateReply("commentgity _id", change.comment_id);
							break;
						default:
							console.log("Unsupported feed change type.");
							return;
					}
				}
			}

			// Gets the body of the webhook event
			let webhookEvent = entry.messaging[0];
			// console.log(webhookEvent);

			// Discard uninteresting events
			if ("read" in webhookEvent) {
				// console.log("Got a read event");
				return;
			}

			if ("delivery" in webhookEvent) {
				// console.log("Got a delivery event");
				return;
			}

			if ("referral" in webhookEvent) {
				console.log("Got a referral event");
				let senderPsid = webhookEvent.sender.id;
				let user = new User(senderPsid);
				users[senderPsid] = user;
				let receiveMessage = new Receive(users[senderPsid], webhookEvent);
				return receiveMessage.handleMessage();
			}

			// Get the sender PSID
			let senderPsid = webhookEvent.sender.id;

			if (!(senderPsid in users)) {
				let user = new User(senderPsid);

				GraphAPi.getUserProfile(senderPsid)
					.then((userProfile) => {
						user.setProfile(userProfile);
					})
					.catch((error) => {
						// The profile is unavailable
						console.log("Profile is unavailable:", error);
					})
					.finally(() => {
						users[senderPsid] = user;
						i18n.setLocale(user.locale);
						console.log("New Profile PSID:", senderPsid, "with locale:", i18n.getLocale());
						let receiveMessage = new Receive(users[senderPsid], webhookEvent);
						return receiveMessage.handleMessage();
					});
			} else {
				i18n.setLocale(users[senderPsid].locale);
				console.log("Profile already exists PSID:", senderPsid, "with locale:", i18n.getLocale());
				let receiveMessage = new Receive(users[senderPsid], webhookEvent);
				return receiveMessage.handleMessage();
			}
		});
	} else {
		// Returns a '404 Not Found' if event is not from a page subscription
		res.sendStatus(404);
	}
});

// Set up your App's Messenger Profile
app.get("/profile", (req, res) => {
	let token = req.query["verify_token"];
	let mode = req.query["mode"];

	if (!config.webhookUrl.startsWith("https://")) {
		res.status(200).send("ERROR - Need a proper API_URL in the .env file");
	}
	var Profile = require("./services/profile.js");
	Profile = new Profile();

	// Checks if a token and mode is in the query string of the request
	if (mode && token) {
		if (token === config.verifyToken) {
			if (mode == "webhook" || mode == "all") {
				Profile.setWebhook();
				res.write(`<p>Set app ${config.appId} call to ${config.webhookUrl}</p>`);
			}
			if (mode == "profile" || mode == "all") {
				Profile.setThread();
				res.write(`<p>Set Messenger Profile of Page ${config.pageId}</p>`);
			}
			if (mode == "personas" || mode == "all") {
				Profile.setPersonas();
				res.write(`<p>Set Personas for ${config.appId}</p>`);
				res.write(
					"<p>To persist the personas, add the following variables \
          to your environment variables:</p>"
				);
				res.write("<ul>");
				res.write(`<li>PERSONA_BILLING = ${config.personaBilling.id}</li>`);
				res.write(`<li>PERSONA_CARE = ${config.personaCare.id}</li>`);
				res.write(`<li>PERSONA_ORDER = ${config.personaOrder.id}</li>`);
				res.write(`<li>PERSONA_SALES = ${config.personaSales.id}</li>`);
				res.write("</ul>");
			}
			if (mode == "nlp" || mode == "all") {
				GraphAPi.callNLPConfigsAPI();
				res.write(`<p>Enable Built-in NLP for Page ${config.pageId}</p>`);
			}
			if (mode == "domains" || mode == "all") {
				Profile.setWhitelistedDomains();
				res.write(`<p>Whitelisting domains: ${config.whitelistedDomains}</p>`);
			}
			if (mode == "private-reply") {
				Profile.setPageFeedWebhook();
				res.write(`<p>Set Page Feed Webhook for Private Replies.</p>`);
			}
			res.status(200).end();
		} else {
			// Responds with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403);
		}
	} else {
		// Returns a '404 Not Found' if mode or token are missing
		res.sendStatus(404);
	}
});

// Verify that the callback came from Facebook.
function verifyRequestSignature(req, res, buf) {
	var signature = req.headers["x-hub-signature"];

	if (!signature) {
		console.log("Couldn't validate the signature.");
	} else {
		var elements = signature.split("=");
		var signatureHash = elements[1];
		var expectedHash = crypto.createHmac("sha1", config.appSecret).update(buf).digest("hex");
		if (signatureHash != expectedHash) {
			throw new Error("Couldn't validate the request signature.");
		}
	}
}

// Check if all environment variables are set
config.checkEnvVariables();

// listen for requests :)
var listener = app.listen(config.port, function () {
	console.log("Your app is listening on port " + listener.address().port);

	if (Object.keys(config.personas).length == 0 && config.appUrl && config.verifyToken) {
		console.log(
			"Is this the first time running?\n" +
			"Make sure to set the both the Messenger profile, persona " +
			"and webhook by visiting:\n" +
			config.appUrl +
			"/profile?mode=all&verify_token=" +
			config.verifyToken
		);
	}

	if (config.pageId) {
		console.log("Test your app by messaging:");
		console.log("https://m.me/" + config.pageId);
	}
});
