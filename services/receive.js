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

const Curation = require("./curation"),
  Order = require("./order"),
  Response = require("./response"),
  Care = require("./care"),
  Survey = require("./survey"),
  Question = require("./question"),
  Rating = require("./rating"),
  GraphAPi = require("./graph-api"),
  BasicUser = require("../db/userSchema"),
  AdminUser = require("../db/adminUserSchema"),
  request = require('request'),
  axios = require('axios'),
  i18n = require("../i18n.config");
  let questionOne
  let questionTwo 
  let questionThree

const jwt = require('jsonwebtoken');

module.exports = class Receive {
  constructor(user, webhookEvent) {
    this.user = user;
    this.webhookEvent = webhookEvent;
  }

  // Check if the event is a message or postback and
  // call the appropriate handler function
  handleMessage() {
    let event = this.webhookEvent;
    let responses;

    try {
      if (event.message) {
        let message = event.message;

        if (message.quick_reply) {
          responses = this.handleQuickReply();
        } else if (message.attachments) {
          responses = this.handleAttachmentMessage();
        } else if (message.text) {
          responses = this.handleTextMessage();
        }
      } else if (event.postback) {
        responses = this.handlePostback();
      } else if (event.referral) {
        responses = this.handleReferral();
      }
    } catch (error) {
      console.error(error);
      responses = {
        text: `An error has occured: '${error}'. We have been notified and \
        will fix the issue shortly!`
      };
    }

    if (Array.isArray(responses)) {
      let delay = 0;
      for (let response of responses) {
        this.sendMessage(response, delay * 2000);
        delay++;
      }
    } else {
      this.sendMessage(responses);
    }
  }

  // Handles messages events with text
  handleTextMessage() {
    // TODO logic to identify normal text for first question by checking DB
    console.log(this.webhookEvent, this.webhookEvent.message, JSON.stringify(this.webhookEvent))
    console.log(
      "Received text:",
      `${this.webhookEvent.message.text} for ${this.user.psid}`
    );

    // check greeting is here and is confident
    let greeting = this.firstEntity(this.webhookEvent.message.nlp, "greetings");

    let message = this.webhookEvent.message.text.trim().toLowerCase();
    let response;

    if (
      (greeting && greeting.confidence > 0.8) ||
      message.includes("start over")
    ) {
      response = Response.genNuxMessage(this.user);
      questionOne = response;
    } else {
        response = Response.genNuxMessage(this.user);
    }
    console.log("receive.js ---> handleTextMessage");
    return response;
  }

  // Handles mesage events with attachments
  handleAttachmentMessage() {
    let response;

    // Get the attachment
    let attachment = this.webhookEvent.message.attachments[0];
    console.log("Received attachment:", `${attachment} for ${this.user.psid}`);

    response = Response.genQuickReply(i18n.__("fallback.attachment"), [
      {
        title: i18n.__("menu.help"),
        payload: "CARE_HELP"
      },
      {
        title: i18n.__("menu.start_over"),
        payload: "GET_STARTED"
      }
    ]);

    return response;
  }

  // Handles mesage events with quick replies
  handleQuickReply() {
    // Get the payload of the quick reply
    let payload = this.webhookEvent.message.quick_reply.payload;

    return this.handlePayload(payload);
  }

  // Handles postbacks events
  handlePostback() {
    let postback = this.webhookEvent.postback;
    // Check for the special Get Starded with referral
    let payload;
    if (postback.referral && postback.referral.type == "OPEN_THREAD") {
      payload = postback.referral.ref;
    } else {
      // Get the payload of the postback
      payload = postback.payload;
    }
    return this.handlePayload(payload);
  }

  // Handles referral events
  handleReferral() {
    // Get the payload of the postback
    let payload = this.webhookEvent.referral.ref;

    return this.handlePayload(payload);
  }

  handlePayload(payload) {
    console.log("Received Payload:", `${payload} for ${this.user.psid}`);

    // Log CTA event in FBA
    GraphAPi.callFBAEventsAPI(this.user.psid, payload);

    let response;

    // Set the response based on the payload
    if (
      payload.toUpperCase() === "GET_STARTED" ||
      payload === "DEVDOCS" ||
      payload === "GITHUB"
    ) {
    //Where questions are being called from
    //First question starts here
      response = Response.genNuxMessage(this.user);
    } else if (payload.toUpperCase().includes("RATING")) {
      BasicUser.findOneAndUpdate({ PSID: this.webhookEvent.sender.id }, {
        lastAnsweredTimestamp: Date.now(),
        $push: {
          answers: {
            question: "What crowded places have you been to since the Covid-19 epidemic outbreak?",
            answer: this.webhookEvent.message.text
          }
        }
      }).then((res) => {
        console.log("1st answer saved for PSID ", this.webhookEvent.sender.id)
      }).catch((err) => {
        console.log(err, " PSID ", this.webhookEvent.sender.id)
      });
      response = Rating.handlePayload(payload);
      questionOne = this.webhookEvent.message.text;     
    } else if (payload.toUpperCase().includes("QUESTION")) {
      BasicUser.findOneAndUpdate({ PSID: this.webhookEvent.sender.id }, {
        lastAnsweredTimestamp: Date.now(),
        $push: {
          answers: {
            question: "Please select the date of contact",
            answer: this.webhookEvent.message.text
          }
        }
      }).then((res) => {
        console.log("2nd answer saved for PSID ", this.webhookEvent.sender.id)
      }).catch((err) => {
        console.log(err, " PSID ", this.webhookEvent.sender.id)
      });
      response = Question.handlePayload(payload);
      questionTwo = this.webhookEvent.message.text;     
    } else if (payload.toUpperCase().includes("END")) {
      BasicUser.findOneAndUpdate({ PSID: this.webhookEvent.sender.id }, {
        lastAnsweredTimestamp: Date.now(),
        $push: {
          answers: {
            question: "What type of contact with the person who had been affected with Covid-19 do you think you had in the event.",
            answer: this.webhookEvent.message.text
          }
        }
      }).then((res) => {
        console.log("3rd answer saved for PSID ", this.webhookEvent.sender.id)
      }).catch((err) => {
        console.log(err, " PSID ", this.webhookEvent.sender.id)
      });
      response = Question.handlePayload(payload);
      questionThree = this.webhookEvent.message.text;
      BasicUser.findOne({ PSID: this.webhookEvent.sender.id }).then((res) => {
        const originalTDP = {
          "haveyouattendedanyeventswhereyouhavebeenincontactwithanyonesufferingfromCovid-19": res.answers[0].answer,
          "pleaseselectthedateofcontact": res.answers[1].answer,
          "whattypeofcontactwiththepersonwhohadbeenaffectedwithCovid-19doyouthinkyouhadintheevent": this.webhookEvent.message.text
        }
        const tdp = {
          txns: null,
          data: originalTDP,
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

        const identifier = {
          type: "barcode",
          id: this.webhookEvent.sender.id
        }

        let identifierBase64 = Buffer.from(JSON.stringify(identifier)).toString("base64");
        AdminUser.findOne({tenantId: res.tenantId}).then((adminUser) => {
          // TODO admin wont have permissions
          this.getStatus(adminUser.token, identifierBase64).then((status) => {
            if(!status[0].status) {
              this.genesis(tdp, adminUser.token).then((genesisResult) => {
                this.postDataPacket(tdp, adminUser.token).then((tdpResult) => {
                  console.log("Saved TDP successfully", tdpResult);
                }).catch((err) => {
                  console.log("Saving TDP failed", tdpResult);
                });
              });
            } else {
              this.postDataPacket(tdp, adminUser.token).then((tdpResult) => {
                console.log("Saved TDP successfully", tdpResult);
              }).catch((err) => {
                console.log("Saving TDP failed", tdpResult);
              });
            }
            console.log("Found previous answers in DB for PSID ", this.webhookEvent.sender.id)
            BasicUser.findOneAndUpdate({ PSID: this.webhookEvent.sender.id }, {
              lastAnsweredTimestamp: undefined,
              answers: undefined
            }).then((res) => {
              console.log("Old answers removed from DB for PSID  ", this.webhookEvent.sender.id)
            }).catch((err) => {
              console.log(err, " PSID ", this.webhookEvent.sender.id)
            });
          }).catch((err) => {
            console.log(err);
          })
        }).catch((err) => {
          console.log(err, " admin user not present for tenant " + res.tenantId);
        });
      }).catch((err) => {
        console.log(err, " PSID ", this.webhookEvent.sender.id)
      });
      

      response = [];
      response.push({
        text: `Thank you for completing the survey. If you wish to redo the survey, please type "start over" in text box below`
      });
    } else if (payload.includes("TOKEN")) {
      const extractedToken = payload.substring(payload.indexOf('-') + 1);
      if(extractedToken) {
        // TODO Validate token and save PSID in DB
        let decode = jwt.decode(extractedToken);
        let tenantId;
        // if(decode.exp > Date.now()) {
          tenantId = decode.tenantID;
        // } else {
        //   console.log("token expired");
        // }        
        AdminUser.findOneAndUpdate({tenantId: tenantId}, {
          PSID: this.webhookEvent.sender.id,
        }).then((res) => {
          console.log("admin user for tenant ", tenantId, " attached to PSID ", this.webhookEvent.sender.id)
        }).catch((err) => {
          console.log("admin user for tenant ", tenantId, " failed to attach PSID ", this.webhookEvent.sender.id)
        });
        response = [];
        response.push({
          text: this.user.firstName + ` You can simply forward the message that follows to your employees.`
        });
        response.push({
          text: `Hi! The company has partnered with Tracified Contact Tracer to help fight against the COVID-19 virus. Please follow this link and do the needful https://m.me/101757184804637?ref=TENANTID-` + tenantId +`. The company look forwards to your full co-operation. Thank you.`,
        });
      } else {
        response.push({
          text: `Unauthorised User`,
        });
      }
      console.log("got a token request");
      // response = [{
      //   attachment: {
      //     type: "template",
      //     payload: {
      //       template_type: "button",
      //       text: "Register for Tracified Contact Tracer! Click on the button below and share the page with your employees! 🔗🔗 Or simple copy this link and share it https://m.me/101757184804637?ref=TENANTID-asda",
      //       buttons: [
      //         {
      //           type: "web_url",
      //           url: "https://m.me/101757184804637?ref=TENANTID-asda",
      //           title: "Tracified Contact Tracer",
      //           webview_height_ratio: "tall"
      //         }
      //       ]
      //     }
      //   }
      // }];
      
    } else if (payload.includes("TENANTID")) {
      const tenantID = payload.substring(payload.indexOf('-') + 1); 
      let batchId = this.webhookEvent.sender.id; 
      
      //saving tenant ID with PSID
      BasicUser.findOne({PSID: this.webhookEvent.sender.id}).then((res) => {
        if (res) {
          console.log(this.webhookEvent.sender.id, " already exists in DB no need to save.")
        } else {
          console.log(this.webhookEvent.sender.id, " does not exists in DB need to save.")
          BasicUser.create({
            PSID: this.webhookEvent.sender.id,
            tenantId: tenantID,
            lastLoggedIn: Date.now(),
          }).then((res) => {
            console.log(this.webhookEvent.sender.id, " PSID user saved in DB.")
          }).catch((err) => {
            console.log(err, " PSID user details failed to save in DB.")
          });
        }
      }).catch((err) => {
        console.log(err)
      });
      response = [];
      response.push({
        text: `Hi ` + this.user.firstName + `!`,
      });
      response.push({
        text: `Welcome to Tracified Contact Tracer. We will now ask you a some questions. Please answer honestly to ensure the safety of yourself and everyone around you.`
      });
    }
    else {
      response = {
        text: `This is a default postback message for payload: ${payload}!`
      };
    }

    return response;
  }

  handlePrivateReply(type,object_id) {
    let welcomeMessage = i18n.__("get_started.welcome") + " " +
      i18n.__("get_started.guidance") + ". " +
      i18n.__("get_started.help");

    let response = Response.genQuickReply(welcomeMessage, [
      {
        title: i18n.__("menu.suggestion"),
        payload: "CURATION"
      },
      {
        title: i18n.__("menu.help"),
        payload: "CARE_HELP"
      },
      {
        title: "Send to Contacts",
        payload: "CARE_ORDER"
      }
    ]);
    console.log("receive.js ---> handlePrivateReply");
    let requestBody = {
      recipient: {
        [type]: object_id
      },
      message: response
    };

    GraphAPi.callSendAPI(requestBody);
  }

  sendMessage(response, delay = 0) {
    // Check if there is delay in the response
    if ("delay" in response) {
      delay = response["delay"];
      delete response["delay"];
    }

    // Construct the message body
    let requestBody = {
      recipient: {
        id: this.user.psid
      },
      message: response
    };

    // Check if there is persona id in the response
    if ("persona_id" in response) {
      let persona_id = response["persona_id"];
      delete response["persona_id"];

      requestBody = {
        recipient: {
          id: this.user.psid
        },
        message: response,
        persona_id: persona_id
      };
    }

    setTimeout(() => GraphAPi.callSendAPI(requestBody), delay);
  }

  firstEntity(nlp, name) {
    return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
  }
  
  getStatus(token, identifier) {
    return this.adminGet('https://api.tracified.com/api/v2/identifiers/status/' + identifier, token).then((res) => {
      return res.body;
    }).catch(err => {
      return err; 
    });
  }

  genesis(tdp, token) {
    this.backendPost('https://api.tracified.com/api/v1/traceabilityProfiles/genesis', tdp, token).then((res) => {
      return res.body;
    }).catch(err => {
      return err; 
    });
  }

  postDataPacket(tdp, token) {
    this.backendPost('https://api.tracified.com/api/v1/dataPackets', tdp, token).then((res) => {
      return res.body;
    }).catch(err => {
      return err; 
    });
  }

  adminGet(url, token) {
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
        console.log(response);
        resolve(response);
      })
      .catch(function (error) {
        console.log(error);
        reject(error);
      });
    });
  }

  backendPost(url, payload, token) {
    return new Promise((resolve, reject) => {
      request.post(url, payload, {
        observe: 'response',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'Application/json',
          'Authorization': 'Bearer ' + token
        }
      }) 
      .then(function (response) {
        console.log(response);
        resolve(response);
      })
      .catch(function (error) {
        console.log(error);
        reject(error);
      });
    });
  }

};
