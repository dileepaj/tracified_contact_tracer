
"use strict";
const AdminUser = require("../db/adminUserSchema");
const jwt = require('jsonwebtoken');

module.exports = class AdminUserService {
  constructor() {
  }

  static createUser(decodedToken, username, password, tenantId, registeredItems) {
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
    return new Promise((resolve, reject) => {
      AdminUser.create({
        username: username,
        password: password,
        tenantId: tenantId,
        token: encodedToken,
        item: registeredItems[0],
      }).then((data) => {
        console.log("Admin added successfully");
        resolve(data);
      }).catch((error) => {
        console.log("Admin not added.", error);
        reject(error);
      });
    });
  }

  static updatePSID(extractedToken, PSID) {
    let decode = jwt.decode(extractedToken);
    const tenantId = decode.tenantID;
    return new Promise((resolve, reject) => {
      AdminUser.findOneAndUpdate({ tenantId: tenantId }, {
        PSID: PSID,
      }).then((res) => {
        console.log("admin user for tenant ", tenantId, " attached to PSID ", PSID);
        resolve(res);
      }).catch((err) => {
        console.log("admin user for tenant ", tenantId, " failed to attach PSID ", PSID);
        reject(err);
      });
    });
  }

  static getUser(conditions) {
    return new Promise((resolve, reject) => {
      AdminUser.findOne(conditions).then((adminUser) => {
        resolve(adminUser);
      }).catch((err) => {
        console.log(err, " admin user not present for conditions " + conditions);
        reject(err);
      });
    });
  }
};