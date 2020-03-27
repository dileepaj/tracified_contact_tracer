// variables to store form data
var empName;
var empEmail;
var orgName;
var selCountry;
var password;

// variables to store the encypted data
var encEmail;
var encPassword;

// json variables
var formJson;
var stringFormJson;

function submitForm() {
	getValues();
	encryption();
	setJson();
	sendJson();
}

function setJson() {
	formData = {
		user: {
			name: empName.value,
			company: orgName.value,
			address: "A street, B street, Colombo",
			contact: "+9411111111",
			country: selCountry.value,
			domain: "Agriculture",
			email: encEmail,
			password: encPassword,
		},
	};

	stringFormJson = JSON.stringify(formData);

	console.log(formData);
	console.log(stringFormJson);
}

function getValues() {
	empName = document.getElementById("inputEmpName");
	empEmail = document.getElementById("inputEmpEmail");
	orgName = document.getElementById("inputOrgName");
	selCountry = document.getElementById("selectCountry");
	password = document.getElementById("inputPassword");
}

function encryption() {
	let key = "hackerkaidagalbanisbaby".split("").reverse().join("");

	let encp = CryptoJS.AES.encrypt(password.value, key);
	let encm = CryptoJS.AES.encrypt(empEmail.value, key);

	encPassword = encp.toString();
	encEmail = encm.toString();

	console.log("pass: ", encPassword, "email: ", encEmail);
	console.log(
		"pass: ",
		CryptoJS.AES.decrypt(encPassword, key).toString(CryptoJS.enc.Utf8),
		"email: ",
		CryptoJS.AES.decrypt(encEmail, key).toString(CryptoJS.enc.Utf8),
	);
}

function sendJson() {
	const xhr = new XMLHttpRequest();

	xhr.open("POST", "https://staging.admin.api.tracified.com/sign/signup");
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(stringFormJson);
}

function getWorkflowJson() {}
