"use strict";

// Imports dependencies
const Response = require("./response"),
  i18n = require("../i18n.config"),
  config = require("./config"),
  QuestionList = require("./../question-list");

module.exports = class Question {
  static question1() {
    let response;
    const payload = "QUESTION1"
    response = Response.genQuickReply(i18n.__(QuestionList.QUESTION1), [
        {
          title: i18n.__("Public Transport"),
          payload: payload
        },
        {
          title: i18n.__("Airport"),
          payload: payload
        },
        {
          title: i18n.__("Big Match"),
          payload: payload
        }
    ]);
    return response;
  }
  
  static question2() {
    let response = [];
    const payload = "QUESTION2";
    response.push({
      text: `Select from the options below`,
    });
    response.push(Response.genQuickReply(i18n.__(QuestionList.QUESTION2), [
        {
          title: i18n.__("Today"),
          payload: payload
        },
        {
          title: i18n.__("Yesterday"),
          payload: payload
        },
        {
          title: i18n.__("Day before Yesterday"),
          payload: payload
        },
        {
          title: i18n.__("Three days back"),
          payload: payload
        },
        {
          title: i18n.__("A week ago"),
          payload: payload
        },
        {
          title: i18n.__("Several weeks ago"),
          payload: payload
        }
    ]));
    return response;
  }

  static question3() {
    let response;
    const payload = "END";
    response = [
      { text: `Select from the options below` },
      Response.genText(i18n.__("Close Contact- Being in closed space with Covid-19 infectious person.")),
      Response.genText(i18n.__("Casual Contact- Not being in same confined space with Covid-19 infectious person")),
      Response.genQuickReply(i18n.__(QuestionList.QUESTION3),
        [
          {
            title: i18n.__("Close Contact"),
            payload: payload
          },
          {
            title: i18n.__("Casual Contact"),
            payload: payload
          }
        ])
    ];
    return response;
  }
};
