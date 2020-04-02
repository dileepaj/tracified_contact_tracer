"use strict";

// Imports dependencies
const Response = require("./response"),
  i18n = require("../i18n.config"),
  config = require("./config")

module.exports = class Question {
  static handlePayload(payload) {
    let response;
    response = [
    { text: `Select from the options below` },
    Response.genText(i18n.__("Close Contact- Being in closed space with Covid-19 infectious person.")),
    Response.genText(i18n.__("Casual Contact- Not being in same confined space with Covid-19 infectious person")),
    Response.genQuickReply(i18n.__("What type of contact with the person who had been affected with Covid-19 do you think you had in the event."),
    [
        {
          title: i18n.__("Close Contact"),
          payload: "END"
        },
        {
          title: i18n.__("Casual Contact"),
          payload: "END"
        }
    ])
    ];
    return response;
  }
};
