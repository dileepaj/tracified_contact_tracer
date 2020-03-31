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

	// login();
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

	postData(url, confirmJSON).then((response) => {
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

	postData(url, workflowJson).then((response) => {
		console.log(response);
	});
}

async function postData(url, data) {
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

	//for testing
	// let loginJSON = {
	// 	user: {
	// 		username: "U2FsdGVkX1+tqKpPzx/B0zgY6O+7XVTquhFrLlNVrqIUlPTtLf4/PcXQrHs4QCEp",
	// 		password: "U2FsdGVkX19FL+SkOuzL955tIKhw1OYt7zzD85vTQI4=",
	// 		newPassword: "U2FsdGVkX19FL+SkOuzL955tIKhw1OYt7zzD85vTQI4="
	// 	}
	// };

	postLoginData(url, loginJSON).then((response) => {
		console.log(loginStatus);
		if (loginStatus == 200) {
			console.log("logged in");
			let token = response.Token;
			console.log(token);
			sendWorkflowJson(token);

			redirecLink = redirectUrl + token;
			document.getElementById("rdctBtn").style.display = "block";

			saveAdmin(token);
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

function saveAdmin(recToken) {
	let url = "/registerAdmin";
	let nameArray = retName.split(" ");
	let decode = jwt_decode(recToken);

	let fname = nameArray[0],
		lname = nameArray[nameArray.length - 1],
		psid = "",
		tenant = decode.tenantID;

	let newAdmin = {
		firstName: fname,
		lastName: lname,
		PSID: psid,
		tenantId: tenant,
		token: recToken,
		lastLoggedIn: Date.now(),
		username: retEmail,
		password: retPassword
	};

	postData(url, newAdmin).then((response) => {
		console.log("add new admin endpoint", response);
	});
	console.log("f", fname, "l", lname);
	console.log("new admin", newAdmin);
}
