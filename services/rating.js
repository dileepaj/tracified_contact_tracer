"use strict";

// Imports dependencies
const Response = require("./response"),
  i18n = require("../i18n.config"),
  config = require("./config");

module.exports = class Rating {
  static handlePayload(payload) {
    let response;
    response = Response.genQuickReply(i18n.__("Please rate the level of severity you may have experienced"), [
        {
          title: i18n.__("Low"),
          payload: "QUESTION"
        },
        {
          title: i18n.__("Medium"),
          payload: "QUESTION"
        },
        {
          title: i18n.__("High"),
          payload: "QUESTION"
        }
    ]);
    return response;
  }
};
