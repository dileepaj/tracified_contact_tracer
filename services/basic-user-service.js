
"use strict";
const BasicUser = require("../db/userSchema");
const TracifiedService = require("./tracified-service");
const AdminUserService = require("./admin-user-service");

module.exports = class BasicUserService {
  constructor() {
  }

  static createUser(PSID, tenantId, firstName, lastName) {
    return new Promise((resolve, reject) => {
      BasicUser.findOne({PSID: PSID}).then((res) => {
        if (res) {
          console.log(PSID, " already exists in DB no need to save.");
          resolve(res);
        } else {
          console.log(PSID, " does not exists in DB need to save.");
          BasicUser.create({
            PSID: PSID,
            tenantId: tenantId,
            lastLoggedIn: Date.now(),
            firstName: firstName,
            lastName: lastName,
          }).then((res) => {
            console.log(PSID, " PSID user saved in DB.");
            resolve(res);
          }).catch((err) => {
            console.log(err, " PSID user details failed to save in DB.");
            reject(err);
          });
        }
      }).catch((err) => {
        console.log(err);
        reject(err);
      });
    });
  }

  static findUser(conditions) {
    return new Promise((resolve, reject) => {
      BasicUser.findOne(conditions).then((res) => {
        if (res) {
          resolve(res);
        } else {
          resolve(null);
        }
      }).catch((err) => {
        console.log(err);
        reject(err);
      });
    });
  }

  static updateUserQuestion(PSID, question, answer, isUpdate) {
    let updateObject = {};
    if (isUpdate) {
      updateObject = {
        lastAnsweredTimestamp: Date.now(),
        startOverInitiated: false,
        $push: {
          answers: {
            question: question,
            answer: answer
          }
        }
      }
    } else {
      updateObject = {
        lastAnsweredTimestamp: Date.now(),
        startOverInitiated: false,
        $set: {
          answers: [{
            question: question,
            answer: answer
          }]
        }
      }
    }
    return new Promise((resolve, reject) => {
      BasicUser.findOneAndUpdate({ PSID: PSID }, updateObject).then((res) => {
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  static sendDataToTracified(PSID, answer3) {
    // TODO add code to refresh token
    return new Promise((resolve, reject) => {
      BasicUser.findOne({ PSID: PSID }).then((basicUser) => {
        // If answer is undefined that means data already present. Attempt to send previously saved data
        answer3 = answer3?answer3:basicUser.answers[2].answer
        const originalTDP = this.buildRawDataPacket(PSID, basicUser.answers[0].answer, basicUser.answers[1].answer, answer3);
  
        const identifier = this.generateIdentifier(basicUser.firstName, basicUser.lastName);
  
        let identifierBase64 = Buffer.from(JSON.stringify(identifier)).toString("base64");
        AdminUserService.getUser({ tenantId: basicUser.tenantId }).then((adminUser) => {
          TracifiedService.getTokenStatus(adminUser.token, identifierBase64).then((status) => {
            const tdp = this.buildTDPPayload(identifierBase64, adminUser.item.itemID, adminUser.item.itemName, originalTDP);
            if (!status[0].status) {
              const genesisPayload = this.buildGenesisPayload(identifierBase64, adminUser.item.itemID, adminUser.item.itemName)
              TracifiedService.postGenesis(genesisPayload, adminUser.token).then((genesisResult) => {
                console.log("genesis carried out successfully ", PSID)
                TracifiedService.postDataPacket(tdp, adminUser.token).then((tdpResult) => {
                  console.log("Saved TDP successfully", tdpResult, PSID);
                  console.log("Found previous answers in DB for PSID ", PSID)
                  this.clearAnswers(PSID);
                  resolve(tdpResult);
                }).catch((err) => {
                  console.log("Saving TDP failed", PSID, err);
                  reject(err);
                });
              }).catch((err) => {
                console.log("Gensis failed for ", PSID, identifierBase64, err);
                reject(err);
              });
            } else {
              tdp.data.header.stageID = status[0].stage;
              return TracifiedService.postDataPacket(tdp, adminUser.token).then((tdpResult) => {
                console.log("Saved TDP successfully", tdpResult);
                console.log("Found previous answers in DB for PSID ", PSID)
                this.clearAnswers(PSID);
                resolve(tdpResult)
              }).catch((err) => {
                console.log("Saving TDP failed", PSID, err);
                reject(err);
              });
            }
          }).catch((err) => {
            console.log(err);
            reject(err);
          })
        }).catch((err) => {
          console.log(err, " admin user not present for tenant " + basicUser.tenantId);
          reject(err);
        });
      }).catch((err) => {
        console.log(err, " PSID ", PSID);
        reject(err);
      });
    });
  }

  static clearAnswers(PSID) {
    BasicUser.findOneAndUpdate({ PSID: PSID }, {
      lastAnsweredTimestamp: undefined,
      answers: undefined,
    }).then((res) => {
      console.log("Old answers removed from DB for PSID  ", PSID);
      return res;
    }).catch((err) => {
      console.log(err, " PSID ", PSID);
      return err;
    });
  }

  static setStartOverInitiated(PSID, status) {
    BasicUser.findOneAndUpdate({ PSID: PSID }, {
      startOverInitiated: status,
    }).then((res) => {
      console.log("Startover updated to " + status + " for PSID  ", PSID);
      return res;
    }).catch((err) => {
      console.log(err, " PSID ", PSID);
      return err;
    });
  }

  static generateIdentifier(firstName, lastName) {
    const identifier = {
      type: "barcode",
      id: firstName + " " + lastName,
    }
    return identifier;
  }

  static buildRawDataPacket(PSID, answer1, answer2, answer3) {
    const originalTDP = {
      "haveyouattendedanyeventswhereyouhavebeenincontactwithanyonesufferingfromCovid-19": answer1,
      "pleaseselectthedateofcontact": answer2,
      "whattypeofcontactwiththepersonwhohadbeenaffectedwithCovid-19doyouthinkyouhadintheevent": answer3,
      "PSID": PSID,
    }
    return originalTDP;
  }

  static buildTDPPayload(identifierBase64, itemID, itemName, originalTDP) {
    const datetime = new Date();
    const tdp = {
      txns: [
        {
          xdr: "sample-xdr",
          identifier: identifierBase64,
        }
      ],
      data: {
        header: {
          stageID: "100",
          timestamp: datetime.toISOString(),
          identifiers: [
            identifierBase64
          ],
          item: {
            itemID: itemID,
            itemName: itemName
          },
          workflowRevision: 0
        },
        data: originalTDP
      },
      publicKey: [
        {
          publicKey: 'sdasda',
          role: 'FieldOfficer'
        },
        {
          publicKey: 'asdasfafa',
          role: 'FieldOfficerApp'
        }
      ]
    };
    return tdp;
  }

  static buildGenesisPayload(identifierBase64, itemID, itemName) {
    const genesisPayload = {
      "data": {
        "header": {
          "item": {
            "itemID": itemID,
            "itemName": itemName,
          },
          "stageID": "100",
          "identifiers": [
            identifierBase64,
          ]
        }
      },
      "txns": [
        {
          "xdr": "sample-xdr",
          "identifier": identifierBase64
        }
      ]
    }
    return genesisPayload;
  }
};