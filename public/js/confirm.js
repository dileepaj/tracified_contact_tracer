//confirmation code variables
var confirmCode;
var confirmJSON;
var confirmJSONString;
var loginStatus;
var redirecLink;

//values retrieved from the session storage
var retEmail = sessionStorage.getItem("email");
var retPassword = sessionStorage.getItem("password");
var retName = sessionStorage.getItem("name");

//workflow json
var workflowJson = {
	revision: 1,
	workflows: {
		stages: [
			{
				name: "Low",
				stageId: "104",
				traceabilityData: {
					"haveyouattendedanyeventswhereyouhavebeenincontactwithanyonesufferingfromCovid-19": {
						name:
							"Have you attended any events where you have been in contact with anyone suffering from Covid-19?",
						mergerFunction: "isOneTrue",
						type: 0
					},
					"doyouhaveanyclosefriendsorfamilymemberswhoarecurrentlysufferingfromCovid-19": {
						name:
							"Do you have any close friends or family members who are currently suffering from Covid-19?",
						mergerFunction: "isOneTrue",
						type: 0
					}
				},
				mergerAttribute: ""
			},
			{
				name: "Medium",
				stageId: "105",
				traceabilityData: {
					"haveyouattendedanyeventswhereyouhavebeenincontactwithanyonesufferingfromCovid-19": {
						name:
							"Have you attended any events where you have been in contact with anyone suffering from Covid-19?",
						mergerFunction: "isOneTrue",
						type: 0
					},
					"doyouhaveanyclosefriendsorfamilymemberswhoarecurrentlysufferingfromCovid-19": {
						name:
							"Do you have any close friends or family members who are currently suffering from Covid-19?",
						mergerFunction: "isOneTrue",
						type: 0
					}
				},
				mergerAttribute: ""
			},
			{
				name: "Critical",
				stageId: "106",
				traceabilityData: {
					"haveyouattendedanyeventswhereyouhavebeenincontactwithanyonesufferingfromCovid-19": {
						name:
							"Have you attended any events where you have been in contact with anyone suffering from Covid-19?",
						mergerFunction: "isOneTrue",
						type: 0
					},
					"doyouhaveanyclosefriendsorfamilymemberswhoarecurrentlysufferingfromCovid-19": {
						name:
							"Do you have any close friends or family members who are currently suffering from Covid-19?",
						mergerFunction: "isOneTrue",
						type: 0
					}
				},
				mergerAttribute: ""
			}
		],
		name: "",
		tenantId: "",
		revision: 1,
		version: "1"
	}
};

//Confirm form functions
function submitConfForm() {
	getConfValues();
	if (checkEmptyConf()) {
		setConfJson();
		confirm();
	}
}

function getConfValues() {
	confirmCode = document.getElementById("inputCode");
}

function checkEmptyConf() {
	if (confirmCode.value == null || confirmCode.value == "") {
		setConfError("You must provide the verification code.");
		return false;
	}

	revertConfError();
	return true;
}

function setConfJson() {
	confirmJSON = {
		confirmUser: {
			email: retEmail,
			code: confirmCode.value
		}
	};

	confirmJSONString = JSON.stringify(confirmJSON);
	console.log(confirmJSONString);
}

function confirm() {
	const url = "https://staging.admin.api.tracified.com/sign/confirm";

	postConfirmData(url, confirmJSON).then((response) => {
		console.log(response);
		if (response == 200) {
			revertConfError();
			login();
			console.log("confirm successful.");
		} else {
			console.log("confirm failed.");
			setConfError("The provided verification code is invalid.");
		}
	});
}

function sendWorkflowJson(token) {
	let url = "https://staging.admin.api.tracified.com/api/addworkflow";
	let decode = jwt_decode(token);
	workflowJson.workflows.name = retName;
	workflowJson.workflows.tenantId = decode.tenantID;

	console.log(workflowJson);
	console.log(JSON.stringify(workflowJson));

	postWorkflowData(url, workflowJson).then((response) => {
		console.log(response);
	});
}

async function postConfirmData(url, data) {
	const response = await fetch(url, {
		method: "POST",
		mode: "cors",
		cache: "no-cache",
		credentials: "same-origin",
		headers: {
			"Content-Type": "application/json"
		},
		redirect: "follow",
		referrerPolicy: "no-referrer",
		body: JSON.stringify(data)
	});
	return await response.status;
}

async function postLoginData(url, data) {
	const response = await fetch(url, {
		method: "POST",
		mode: "cors",
		cache: "no-cache",
		credentials: "same-origin",
		headers: {
			"Content-Type": "application/json"
		},
		redirect: "follow",
		referrerPolicy: "no-referrer",
		body: JSON.stringify(data)
	});

	loginStatus = response.status;
	return await response.json();
}

async function postWorkflowData(url, data) {
	const response = await fetch(url, {
		method: "POST",
		mode: "cors",
		cache: "no-cache",
		credentials: "same-origin",
		headers: {
			"Content-Type": "application/json"
		},
		redirect: "follow",
		referrerPolicy: "no-referrer",
		body: JSON.stringify(data)
	});
	return await response.status;
}

function login() {
	const url = "https://staging.admin.api.tracified.com/sign/login";
	const redirectUrl = "https://m.me/101757184804637?ref=TOKEN-";

	let loginJSON = {
		user: {
			username: retEmail,
			password: retPassword,
			newPassword: retPassword
		}
	};

	postLoginData(url, loginJSON).then((response) => {
		console.log(loginStatus);
		if (loginStatus == 200) {
			console.log("logged in");
			let token = response.Token;
			console.log(token);
			sendWorkflowJson(token);

			redirecLink = redirectUrl + token;
			document.getElementById("rdctBtn").style.display = "block";
		} else {
			console.log("log in failed");
		}
	}); 
}

function setConfError(msg) {
	let msgField = document.getElementById("codeError");

	msgField.innerHTML = msg;
	confirmCode.style.borderColor = "red";
}

function revertConfError() {
	let msgField = document.getElementById("codeError");

	msgField.innerHTML = "";
	confirmCode.style.borderColor = "#ced4da";
}

function redirectToFB() {
	window.location.replace(redirecLink);
}