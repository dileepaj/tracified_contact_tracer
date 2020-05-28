
"use strict";
const axios = require('axios');
const jwt = require('jsonwebtoken');

module.exports = class TracifiedService {
  constructor() {
  }

  static addEmployeeAsItem(token, tenantId) {
    const itemPayload = [{
      Item: "Employees",
      Stages: [
        "100",
        "101",
        "102"
      ],
      TenantID: tenantId
    }];


    return new Promise((resolve, reject) => {
      axios.post(process.env.TRACIFIED_ADMIN_BACKEND_URL + "/api/tracifieditem", itemPayload, {
        observe: 'response',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'Application/json',
          'Authorization': 'Bearer ' + token
        }
      }).then((response) => {
        console.log("Tracified item created");
        const registeredItems = response.data;
        resolve(registeredItems);
      }).catch((error) => {
        console.log("Tracified item creation failed");
        console.log(error);
        reject(error);
      });
    });
  }

  static createUserToken(decodedToken) {
    decodedToken["permissions"] = {
      "0": [
        "16",
        "7",
        "8",
        "9",
        "14",
        "10"
      ],
      "100": [
        "15",
        "1",
        "3",
        "4",
        "5",
        "6",
        "2"
      ],
      "101": [
        "1",
        "3",
        "4",
        "5",
        "2",
        "6"
      ],
      "102": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6"
      ]
    };
    // Updating permissions and expiry
    delete decodedToken.exp;
    const encodedToken = jwt.sign(decodedToken, process.env.SECRET_TOKEN, { expiresIn: '720h' });
    return encodedToken;
  }

  static repopulateWorkflows(decodedToken) {
    decodedToken["permissions"] = {
      "0": [
        "12",
      ]
    };
    delete decodedToken.exp;
    const encodedTokenRepopulate = jwt.sign(decodedToken, process.env.SECRET_TOKEN, { expiresIn: '1h' });

    return new Promise((resolve, reject) => {
      axios.get("https://api.tracified.com/api/v2/config/workflow/repopulate", {
        observe: 'response',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'Application/json',
          'Authorization': 'Bearer ' + encodedTokenRepopulate,
        }
      }).then(() => {
        console.log("Worflows repopulated in BE");
        resolve(true);
      }).catch((err) => {
        console.log("Workflow repopulation failed in BE", err);
        reject(err);
      });
    });
  }

  static getTokenStatus(token, identifier) {
    return new Promise((resolve, reject) => {
      return this.adminGet(process.env.TRACIFIED_BACKEND_URL + '/api/v2/identifiers/status/' + identifier, token).then((res) => {
        resolve(res.data);
      }).catch(err => {
        reject(err);
      });
    });
  }

  static postGenesis(tdp, token) {
    return new Promise((resolve, reject) => {
      return this.backendPost(process.env.TRACIFIED_BACKEND_URL + '/api/v2/traceabilityProfiles/genesis', tdp, token).then((res) => {
        resolve(res.data);
      }).catch(err => {
        reject(err);
      });
    });
  }

  static postDataPacket(tdp, token) {
    return new Promise((resolve, reject) => {
      return this.backendPost(process.env.TRACIFIED_BACKEND_URL + '/api/v2/dataPackets', tdp, token).then((res) => {
        resolve(res.data);
      }).catch(err => {
        reject(err);
      });
    });
  }

  static adminGet(url, token) {
    return new Promise((resolve, reject) => {
      axios.get(url, {
        observe: 'response',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'Application/json',
          'Authorization': 'Bearer ' + token
        }
      })
        .then(function (response) {
          resolve(response);
        })
        .catch(function (error) {
          console.log(error);
          reject(error);
        });
    });
  }

  static backendPost(url, payload, token) {
    return new Promise((resolve, reject) => {
      axios.post(url, payload, {
        observe: 'response',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'Application/json',
          'Authorization': 'Bearer ' + token
        }
      })
        .then(function (response) {
          resolve(response);
        })
        .catch(function (error) {
          console.log(error);
          reject(error);
        });
    });
  }
};