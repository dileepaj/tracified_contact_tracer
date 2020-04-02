"use strict";

// Imports dependencies
const Response = require("./response"),
  i18n = require("../i18n.config"),
  config = require("./config");

module.exports = class Rating {
  static handlePayload(payload) {
    let response = [];
    response.push({
      text: `Select from the options below`,
    });
    response.push(Response.genQuickReply(i18n.__("Please select the date of contact"), [
        {
          title: i18n.__("Today"),
          payload: "QUESTION"
        },
        {
          title: i18n.__("Yesterday"),
          payload: "QUESTION"
        },
        {
          title: i18n.__("Day before Yesterday"),
          payload: "QUESTION"
        },
        {
          title: i18n.__("Three days back"),
          payload: "QUESTION"
        },
        {
          title: i18n.__("A week ago"),
          payload: "QUESTION"
        }
    ]));
    return response;
  }
};
