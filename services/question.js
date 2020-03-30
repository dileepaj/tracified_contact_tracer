"use strict";

// Imports dependencies
const Response = require("./response"),
  i18n = require("../i18n.config"),
  config = require("./config");


module.exports = class Question {
  static handlePayload(payload) {
    let response;
    response = Response.genQuickReply(i18n.__("What type of contact with the person who had been affected with Covid-19 do you think you had in the event.\nClose Contact - Been in closed space with Covid-19 infectious person. \nCasual Contact - Not been in same confined space with Covid-19 infectious person"),
    [
        {
          title: i18n.__("Close Contact"),
          payload: "END"
        },
        {
          title: i18n.__("Casual Contact"),
          payload: "END"
        }
    ]);
    return response;
  }
};
