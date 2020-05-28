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

const Response = require("./response"),
  Question = require("./question"),
  GraphAPi = require("./graph-api"),
  BasicUser = require("../db/userSchema"),
  BasicUserService = require("./basic-user-service"),
  AdminUserService = require("./admin-user-service"),
  QuestionList = require('./../question-list'),
  i18n = require("../i18n.config");

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
          // TODO code duplicated
          responses = this.handleTextMessage().then((textResponse) => {
            if (Array.isArray(textResponse)) {
              let delay = 0;
              for (let response of textResponse) {
                this.sendMessage(response, delay * 1000);
                delay++;
              }
            } else {
              this.sendMessage(textResponse);
            }
          }).catch((err) => {
            console.log(err)
          });
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

    if (responses instanceof Promise) {
      responses.then((actualResponses) => {
        actualResponses
        if (Array.isArray(actualResponses)) {
          let delay = 0;
          for (let response of actualResponses) {
            this.sendMessage(response, delay * 1000);
            delay++;
          }
        } else {
          this.sendMessage(actualResponses);
        }
      }).catch((err) => {
        console.log(err)
      })
    } else if (Array.isArray(responses)) {
      let delay = 0;
      for (let response of responses) {
        this.sendMessage(response, delay * 1000);
        delay++;
      }
    } else {
      this.sendMessage(responses);
    }
  }

  // Handles messages events with text
  handleTextMessage() {

    // Check DB if first question answered. If not then take it as response if text isnt start over else repeaat appropriate question 
    // check greeting is here and is confident
    let greeting = this.firstEntity(this.webhookEvent.message.nlp, "greetings");
    const payload = "";

    let message = this.webhookEvent.message.text.trim().toLowerCase();
    let response;

    console.log(this.webhookEvent, this.webhookEvent.message, JSON.stringify(this.webhookEvent))
    console.log(
      "Received text:",
      `${this.webhookEvent.message.text} for ${this.user.psid}`
    );
    return BasicUser.findOne({ PSID: this.user.psid }).then((basicUser) => {
      // TODO check if user exists or not. If not tell him to go back and come again as user not registered properly
      if (message.includes("start over")) {
        response = Question.question1(this.user)
        BasicUserService.clearAnswers(this.user.psid);
        BasicUserService.setStartOverInitiated(this.user.psid, true);
      } else if (basicUser.startOverInitiated === false && !basicUser.answers) {
        response = {
          text: `If you wish to redo the survey, please type "start over" in text box below`
        };
      } else if (!basicUser.answers || basicUser.answers.length === 0) {
        BasicUserService.updateUserQuestion(
          this.webhookEvent.sender.id,
          QuestionList.QUESTION1,
          this.webhookEvent.message.text,
        ).then((basicUser) => {
          console.log("1st answer saved for PSID ", basicUser.PSID)
        }).catch((err) => {
          console.log(err, " PSID ", this.webhookEvent.sender.id)
        });
        response = Question.question2(payload);
      }
      else if (basicUser.answers[0].question != QuestionList.QUESTION1) {
        // TODO ask first question again
        response = Question.question1(this.user);
      } else if (!basicUser.answers[1]) {
        response = Question.question2(payload);
      } else if (!basicUser.answers[2]) {
        response = Question.question3(payload);
      } else {
        // TODO this means all questions are there but it hasn't been saved
        BasicUserService.sendDataToTracified(this.webhookEvent.sender.id, null).then(() => {
          console.log("Data sent to Tracified");
          response = {
            text: `Data saved successfully!`
          };
        }).catch((err) => {
          console.log("Something went wrong, data did not go to Tracified. PSID ", this.webhookEvent.sender.id, err)
        })
      }
      console.log("receive.js ---> handleTextMessage");
      return response;

    }).catch((err) => {
      console.log(`Cannot find user ${this.user.psid}`, err);
    });

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
    return new Promise((resovle, reject) => {
      if (
        payload.toUpperCase() === "GET_STARTED" ||
        payload === "DEVDOCS" ||
        payload === "GITHUB"
      ) {
        //Where questions are being called from
        //First question starts here
        response = Question.question1(this.user);
        resovle(response);
      } else if (payload.toUpperCase().includes("QUESTION1")) {
        BasicUserService.updateUserQuestion(
          this.webhookEvent.sender.id,
          QuestionList.QUESTION1,
          this.webhookEvent.message.text,
        ).then((basicUser) => {
          console.log("1st answer saved for PSID ", basicUser.PSID)
        }).catch((err) => {
          console.log(err, " PSID ", this.webhookEvent.sender.id)
        });
        response = Question.question2(payload);
        resovle(response);
      } else if (payload.toUpperCase().includes("QUESTION2")) {
        BasicUserService.updateUserQuestion(this.webhookEvent.sender.id, QuestionList.QUESTION2,
          this.webhookEvent.message.text, true).then((basicUser) => {
          console.log("2nd answer saved for PSID ", basicUser.PSID)
        }).catch((err) => {
          console.log(err, " PSID ", this.webhookEvent.sender.id)
        });
        response = Question.question3(payload);
        resovle(response);
      } else if (payload.toUpperCase().includes("END")) {
        BasicUserService.updateUserQuestion( this.webhookEvent.sender.id, QuestionList.QUESTION3,
          this.webhookEvent.message.text, true).then((basicUser) => {
          console.log("3rd answer saved for PSID ", basicUser.PSID)
        }).catch((err) => {
          console.log(err, " PSID ", this.webhookEvent.sender.id)
        });
  
        BasicUserService.sendDataToTracified(this.webhookEvent.sender.id, this.webhookEvent.message.text).then(() => {
          console.log("Data sent to Tracified")
        }).catch((err) => {
          console.log("Something went wrong, data did not go to Tracified. PSID ", this.webhookEvent.sender.id, err)
        })
  
        response = [];
        response.push({
          text: `Thank you for completing the survey. If you wish to redo the survey, please type "start over" in text box below`
        });
        resovle(response);
      } else if (payload.includes("TOKEN")) {
        const extractedToken = payload.substring(payload.indexOf('-') + 1);
        console.log("got a token request ", extractedToken);
        if (extractedToken) {
          // TODO Validate token
          AdminUserService.updatePSID(extractedToken, this.webhookEvent.sender.id).then((updatedAdminUser) => {
            console.log("admin user attached to PSID ", updatedAdminUser.PSID)
            response = [];
            response.push({
              text: this.user.firstName + ` You can simply forward the message that follows to your employees.`
            });
            response.push({
              text: `Hi! The company has partnered with Tracified Contact Tracer to help fight against the COVID-19 virus. Please follow this link and do the needful https://m.me/101757184804637?ref=TENANTID-` + updatedAdminUser.tenantId + `. The company look forwards to your full co-operation. Thank you.`,
            });
            resovle(response);
          }).catch((err) => {
            // TODO add message to try again
            console.log("admin user with token ", extractedToken, " failed to attach PSID ", this.webhookEvent.sender.id, err)
          });
        } else {
          response.push({
            text: `Unauthorised User`,
          });
          resovle(response);
        }
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
        let userPSID = this.webhookEvent.sender.id;
        GraphAPi.getUserProfile(userPSID).then((userProfile) => {
          console.log(userProfile)
          //saving tenant ID with PSID
          BasicUserService.createUser(this.webhookEvent.sender.id, tenantID, userProfile.firstName, userProfile.lastName);
        }).catch((error) => {
          // The profile is unavailable
          console.log("Profile is unavailable:", error);
        });
        response = [];
        response.push({
          text: `Hi ` + this.user.firstName + `!`,
        });
        response.push({
          text: `Welcome to Tracified Contact Tracer. We will now ask you a some questions. Please answer honestly to ensure the safety of yourself and everyone around you.`
        });
        response.push(Question.question1(this.user));
        resovle(response);
      }
      else {
        response = {
          text: `This is a default postback message for payload: ${payload}!`
        };
        resovle(response);
      }
    });
  }

  handlePrivateReply(type, object_id) {
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

};
