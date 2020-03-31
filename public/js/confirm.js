//confirmation code variables
var confirmCode;
var confirmJSON;
var confirmJSONString;

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
    setConfJson();
    // confirm();
}

function getConfValues() {
    confirmCode = document.getElementById("inputCode");
}

function setConfJson() {
	confirmJSON = {
		confirmUser: {			
			email: encEmail,
			code: confirmCode.value
		}
	};

	confirmJSONString = JSON.stringify(confirmJSON);

	console.log(confirmJSON);
	console.log(confirmJSONString);
}

function confirm() {
	const xhr = new XMLHttpRequest();

	xhr.open("POST", "https://staging.admin.api.tracified.com/sign/confirm");
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(confirmJSONString);
	xhr.onreadystatechange = function() {
		// if (xhr.status == 201) {
		// 	console.log("passed", xhr.status);
		// 	redirect();
		// } else {
		// 	console.log("failed", xhr.status);
		// }
		console.log(xhr.status);
	};
}

function setWorkflowJson() {
	workflowJson.workflows.name = empName.value;

	console.log(JSON.stringify(workflowJson));
	console.log(workflowJson);
}

function login() {
	let loginJSON = {
		user: {
			username: encEmail,
			password: encPassword,
			newPassword: encPassword
		}
	};

	let url = "https://staging.admin.api.tracified.com/sign/login";

	const xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if (xhr.status == 200) {
			console.log(xhr.responseText);
		}
	};
	xhr.open("POST", url);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(JSON.stringify(loginJSON));
}