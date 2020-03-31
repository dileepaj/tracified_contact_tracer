// variables to store form data
var empName;
var empEmail;
var orgName;
var selCountry;
var password;
var confPassword;

// variables to store the encypted data
var encEmail;
var encPassword;

// json variables
var formJson;
var stringFormJson;

//validation regexs
var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var strongPassRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{10,})");
var mediumPassRegex = new RegExp(
	"^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})"
);

//validation variables
var emailFormat;
var newEmail;
var pwdValid;
var pwdMatch;

//Register Form functions
function submitRegForm() {
	getRegValues();
	validate();
	// validateEmpty();
	encryption();
	setRegJson();
	// sendRegJson();
}

function getRegValues() {
	empName = document.getElementById("inputEmpName");
	empEmail = document.getElementById("inputEmpEmail");
	orgName = document.getElementById("inputOrgName");
	selCountry = document.getElementById("selectCountry");
	password = document.getElementById("inputPassword");
	confPassword = document.getElementById("inputConfirmPassword");
}

function validate() {
	let notEmpty = validateEmpty();
	let email = validateMail();

	console.log("empty", notEmpty, "email", email);
	console.log("new", newEmail, "format", emailFormat);
	if(notEmpty && email) {
		console.log("pass");
	} else {
		console.log("fail");
	}
}

function encryption() {
	let key = "hackerkaidagalbanisbaby".split("").reverse().join("");

	let encp = CryptoJS.AES.encrypt(password.value, key);
	let encm = CryptoJS.AES.encrypt(empEmail.value, key);

	encPassword = encp.toString();
	encEmail = encm.toString();

	sessionStorage.setItem("email", encEmail);
	sessionStorage.setItem("password", encPassword);
	sessionStorage.setItem("name", empName.value);
}

function setRegJson() {
	let contactNo = "+" + Math.round(Date.now() / Math.random(100000));
	let tempAddress = "A street, B street, Colombo";
	let tempDomain = "Domain";

	formData = {
		user: {
			name: empName.value,
			company: orgName.value,
			address: tempAddress,
			contact: contactNo,
			country: selCountry.value,
			domain: tempDomain,
			email: encEmail,
			password: encPassword
		}
	};

	stringFormJson = JSON.stringify(formData);

	console.log(formData);
	console.log(stringFormJson);
}

function sendRegJson() {
	let url = "https://staging.admin.api.tracified.com/sign/signup";

	const xhr = new XMLHttpRequest();

	xhr.open("POST", url);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(stringFormJson);

	xhr.onreadystatechange = function() {
		if (xhr.status == 201) {
			console.log("passed", xhr.status);
			redirect();
		} else {
			console.log("failed", xhr.status);
		}
	};
}

function redirect() {
	window.location = "confirm";
}

function validateMail() {
	if(newEmail && emailFormat) {
		return true;
	} else {
		return false;
	}
}

function checkMail() {
	console.log(document.getElementById("inputEmpEmail").value);

	let url =
		"https://staging.admin.api.tracified.com/sign/checkemail/" + document.getElementById("inputEmpEmail").value;

	console.log(url);

	const xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.send();

	xhr.onreadystatechange = function() {
		if (xhr.status == 200) {
			setError('inputEmpEmail', 'Email is already used.');
			newEmail = false;
		} else if(xhr.status == 403) {
			revert('inputEmpEmail');
			newEmail = true;
		}
	};
}

function validateEmailFormat() {
	let errMsg = "Enter a valid email address.";
	let className = "inputEmpEmail";
	let errorClassName = "inputEmpEmailError";

	emailFormat = emailRegex.test(document.getElementById(className).value);
	console.log(emailFormat);

	if (!emailFormat) {
		document.getElementById(className).style.borderColor = "red";
		document.getElementById(errorClassName).innerHTML = errMsg;
		emailFormat = false;
	} else {
		document.getElementById(className).style.borderColor = "#ced4da";
		document.getElementById(errorClassName).innerHTML = "";
		emailFormat = true;
	}
}

function validateEmpty() {
	let msg;

	if (empName.value == null || empName.value == "") {
		msg = "Please enter your name.";
		setError("inputEmpName", msg);
		return false;
	}

	if (empEmail.value == null || empEmail.value == "") {
		msg = "Please enter your email.";
		setError("inputEmpEmail", msg);
		return false;
	}

	if (orgName.value == null || orgName.value == "") {
		msg = "Please enter your organization name.";
		setError("inputOrgName", msg);
		return false;
	}

	if (selCountry.value == null || selCountry.value == "") {
		msg = "Please select a country.";
		setError("selectCountry", msg);
		return false;
	}

	if (password.value == null || password.value == "") {
		msg = "Please enter a password.";
		setError("inputPassword", msg);
		return false;
	}

	if (confPassword.value == null || confPassword.value == "") {
		msg = "Please re-enter your password.";
		setError("inputConfirmPassword", msg);
		return false;
	}

	return true;
}

function setError(element, msg) {
	let errClass = element + "Error";

	document.getElementById(element).style.borderColor = "red";
	document.getElementById(errClass).innerHTML = msg;
}

function revert(element) {
	let errClass = element + "Error";

	document.getElementById(element).style.borderColor = "#ced4da";
	document.getElementById(errClass).innerHTML = "";
}

function checkPasswordStrength() {
	let pwd = document.getElementById("inputPassword");
	let color;
	let msg;

	if (pwd.value.length >= 6) {
		if (strongPassRegex.test(pwd.value)) {
			color = "green";
			msg = "Password Strength is High";
		} else if (mediumPassRegex.test(pwd.value)) {
			color = "orange";
			msg = "Password Strength is Average";
		} else {
			color = "red";
			msg = "Password Strength is Low";
		}
		pwdValid = true;
	} else {
		color = "red";
		msg = "Password length should exceed 6 characters";
		pwdValid = false;
	}

	showPwdStrength(color, msg);
}

function showPwdStrength(color, msg) {
	let message = document.getElementById("inputPasswordStrength");
	document.getElementById("inputPassword").style.borderColor = "#ced4da";
	message.innerHTML = msg;
	message.style.color = color;

	if (!pwdValid) {
		document.getElementById("inputPassword").style.borderColor = "red";
	}
}

function showPwd(element) {
	let field = document.getElementById(element);

	if (field.type === "password") {
		field.type = "text";
		console.log("password show");
	} else {
		field.type = "password";
		console.log("password hide");
		// document.getElementById(element).type = "password";
	}
}

function cnfPassword() {
	let pwd = document.getElementById("inputPassword");
	let cnfPwd = document.getElementById("inputConfirmPassword");

	let message = document.getElementById("passwordMatch");

	if (pwd.value == null || pwd.value == "") {
		setError("inputConfirmPassword", "Password field is empty");
	} else {
		if (pwd.value !== cnfPwd.value) {
			message.innerHTML = "Passwords do not match.";
			message.style.color = "red";
			cnfPwd.style.borderColor = "red";
			pwdMatch = false;
		} else {
			message.innerHTML = "Passwords match.";
			message.style.color = "green";
			cnfPwd.style.borderColor = "#ced4da";
			pwdMatch = true;
		}
	}
}

function clearOtherMessages() {
	let message1 = document.getElementById("passwordMatch");
	let message2 = document.getElementById("inputPasswordStrength");

	if (!pwdMatch) {
		message1.innerHTML = "";
	}

	if (!pwd) {
		message2.innerHTML = "";
	}

	if (!pwd && !pwdMatch) {
		message1.innerHTML = "";
		message2.innerHTML = "";
	}
}

function clearErrorMessages(element) {
	let errClass = element + "Error";
	document.getElementById(errClass).innerHTML = "";
}