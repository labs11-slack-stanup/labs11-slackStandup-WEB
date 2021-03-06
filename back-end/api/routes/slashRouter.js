////
require("dotenv").config();
const express = require("express");
const router = express.Router();
const db = require("../database/helpers/slashDb");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const request = require("request");
const dbAuth = require("../database/helpers/slackAuthDb");
const dbFeelings = require("../database/helpers/feelingsDb");
const dbSurveys = require("../database/helpers/surveysDb");
const dbTeamMembers = require("../database/helpers/teamMembersDb");
const surveyFeelingsDb = require("../database/helpers/surveysFeelingsDb");
const preFeelingsDb = require("../database/helpers/preFeelingsDb");
const surveysActiveDb = require("../database/helpers/surveysActiveDb");

//labs11 helpers
const questionDb = require("../database/helpers/questionSurveyDb.js");
const activeCurieDb = require("../database/helpers/curieSurveyActiveDb");
const curieAnswerDb = require("../database/helpers/curieAnswersDb.js");

const {
  postSuccess,
  serverErrorPost,
  getSuccess,
  serverErrorGet,
  serverErrorGetID,
  serverErrorDelete404,
  serverErrorDelete500,
  serverErrorUpdate404,
  serverErrorUpdate500
} = require("./routeHelpers/helpers.js");

//routes for slash commands through Slack API//
router.use(bodyParser.urlencoded({ extended: true }));
//labs11
let answerURl;
if (process.env.DB_ENV === "development") {
  answerURl = "localhost:5003/api/curieAnswers";
  // answerURl = "https://occasum.serveo.net/api/curieAnswers";
} else if (process.env.DB_ENV === "production") {
  answerURl = "https://labs11-curie-web.herokuapp.com/api/curieAnswers";
}

// router.get("/", (req, res) => {
//   db.get()
//     .then(getSuccess(res))
//     .catch(serverErrorGet(res));
// });

function sendMessageToSlackResponseURL(responseURL, JSONmessage) {
  let postOptions = {
    uri: responseURL,
    method: "POST",
    headers: {
      "Content-type": "application/json"
    },
    json: JSONmessage
  };
  request(postOptions, (error, response, body) => {
    if (error) {
      // handle errors as you see fit
      res.json({ error: "Error." });
    }
  });
}
// part 1 add a function for direct message
function postPrivateMessage(message, token) {
  let postMessage = {
    uri: `https://slack.com/api/chat.postMessage`,
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`
    },
    json: message
  };
  request(postMessage, (error, response, body) => {
    if (error) {
      res.json({ error: "Error." });
    }
  });
}

function conversationMessage(token, channel, res) {
  const url =
    "https://slack.com/api/conversations.history?token=" +
    token +
    "&channel=" +
    channel;
  console.log("url", url);
  // let answerOptions = {
  //   uri: answerURl,
  //   method: "POST",
  //   headers: {
  //     "Content-type": "application/json"
  //   },
  //   json: message
  // };

  request(url, (error, response, body) => {
    if (error) {
      res.json({ error: "Error." });
      // } else {
      //   request(answerOptions, (error,response, body) => {
      //      console.log("answerOptions", answerOptions)
      //   })
    }
  });
}
function postMessage(JSONmessage, token) {
  let postOptions = {
    uri: `https://slack.com/api/chat.postMessage`,
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`
    },
    json: JSONmessage
  };
  request(postOptions, (error, response, body) => {
    if (error) {
      // handle errors as you see fit
      res.json({ error: "Error." });
    }
  });
}

function postEphMessage(JSONmessage, token) {
  let postOptions = {
    uri: `https://slack.com/api/chat.postEphemeral`,
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`
    },
    json: JSONmessage
  };
  request(postOptions, (error, response, body) => {
    if (error) {
      // handle errors as you see fit
      res.json({ error: "Error." });
    }
  });
}

// https://slack.com/api/chat.postMessage?token=xoxb-553324377632-553511725281-WtIU01FxATAkavAPlFn6BPz2&channel=CG9EQ53QR&text=Test

router.post("/connect-channel-to-survey", urlencodedParser, (req, res) => {
  // res.status(200).end(); // best practice to respond with empty 200 status code
  let reqBody = req.body;
  console.log("reqBody", reqBody);
  let { channel_id, user_id } = reqBody;
  console.log({ channel_id: channel_id, user_id: user_id });

  dbAuth
    .getBySlackUserId(user_id)
    .then(data => {
      console.log({ data: data });
      let { id, member_id } = data[0];
      console.log({ id: id });
      let post = {
        channel_id: channel_id
      };
      dbTeamMembers
        .getID(member_id)
        .then(data => {
          if (data[0].type !== "manager") {
            res
              .status(400)
              .json(`Team Members do not require channel connection!`);
          } else {
            dbAuth
              .update(id, post)
              .then(() => {
                res.json(
                  `Updated Manager Slack Authenticate ID: ${id} with slack channel ID: ${channel_id}.`
                );
              })
              .catch(serverErrorDelete500(res, "Auth"));
          }
        })
        .catch(
          err => {
            res.json(`Error: member with ID ${member_id} does not exist.`);
          }
          // serverErrorGetID(res, "Auth", member_id)
        );
    })
    .catch(
      serverErrorDelete404(() => {
        res.status(400).json({
          error: `Slack User with user_id: ${user_id} does not exist in the database.`
        });
      })
    );
});
//ssh -R 80:localhost:5003 serveo.net
//event post
router.post("/events", urlencodedParser, (req, res) => {
  let reqBody = req.body;
  console.log("this got hit after we sent survey");
  res.status(200).send(reqBody.challenge);
  console.log("event message", reqBody);
  let slackTeamId = reqBody.team_id;
  let conChannel = reqBody.event.channel;
  console.log("conChannel", conChannel);
  dbAuth.getBySlackBot(slackTeamId).then(data => {
    console.log("resConsole", data);
    let managerIDD;
    for (let i = 0; i < data.length; i++) {
      dbTeamMembers.getID(data[i].member_id).then(loop => {
        console.log("loop", loop);
        if (loop[0].type === "manager") {
          managerIDD = loop[0].id;
        } else if (i === data.length - 1) {
          dbAuth.getByMemberId(managerIDD).then(date => {
            let botToken = date[0].bot_access_token;
            console.log("botToken", botToken);
  //////////////////////////////////////////////////////////////////////////
           
              
       
          });
        }
      });
    }
  });
});
// slash command to recieve mood surveys and curie surveys
router.post("/send-me-buttons", urlencodedParser, (req, res) => {
  // res.status(200).end(); // best practice to respond with empty 200 status code
  let reqBody = req.body;
  console.log("reqBody", reqBody);

  if (reqBody.command === "/send-me-buttons") {
    let responseURL = reqBody.response_url;
    if (reqBody.token != process.env.VERIFICATION_TOKEN) {
      ///// changed spelling of verification
      res.status(403).end("Access forbidden");
    } else {
      let user_id = reqBody.user_id;
      dbAuth
        .getBySlackUserId(user_id)
        .then(data => {
          if (data.length === 0) {
            console.log({ error: "User is not Authorized" });
          }
          //mood survey
          else {
            let member_id = data[0].member_id; ///// team_member_id
            dbTeamMembers
              .getID(member_id)
              .then(data => {
                if (data.length === 0) {
                  console.log({ error: "User does not exist" });
                } else {
                  let team_id = data[0].team_id;
                  dbTeamMembers
                    .getManager(team_id)
                    .then(data => {
                      if (data.length === 0) {
                        console.log({
                          error: "Manager does not exist for this team"
                        });
                      } else {
                        let manager_id = data[0].id;
                        dbSurveys
                          .getManagerID(manager_id)
                          .then(data => {
                            // let title = data[data.length - 1].title;
                            // let description = data[data.length - 1].description;
                            let count = 1;
                            let length = data.length;
                            for (let z = 0; z < data.length; z++) {
                              let survey_id = data[z].id;
                              let title = data[z].title;
                              let description = data[z].description;
                              console.log("survey id", survey_id);
                              console.log("title", title);
                              console.log("description", description);

                              surveysActiveDb
                                .getBySurveyID(survey_id)
                                .then(data => {
                                  let active = data[0].active;
                                  console.log("active", active);
                                  let slackChannelID = reqBody.channel_id;
                                  let slackUserID = reqBody.user_id;
                                  let teamID = reqBody.team_id;
                                  if (!active && count < length) {
                                    count += 1;
                                    console.log("count", count);
                                  } else if (!active && count === length) {
                                    console.log("count", count);
                                    dbAuth
                                      .getBySlackTeamIdSTD(teamID)
                                      .then(data => {
                                        let botToken = data.map(item => {
                                          return item.bot_access_token !== null
                                            ? item.bot_access_token
                                            : null;
                                        })[0];
                                        console.log("botToken", botToken);
                                        let message3 = {
                                          channel: slackChannelID,
                                          user: slackUserID,
                                          text: "All Survey's are Deactivated!"
                                        };
                                        postEphMessage(message3, botToken);
                                      })
                                      .catch();
                                  } else if (active) {
                                    if (data.length === 0) {
                                      console.log({
                                        error: `Survey with Manager Id: ${manager_id} does not exist.`
                                      });
                                    } else {
                                      surveyFeelingsDb
                                        .getSurveyID(survey_id)
                                        .then(data => {
                                          // console.log(
                                          //   "survey feeling array slash",
                                          //   data
                                          // );
                                          let feelingTextArray = [];
                                          for (
                                            let j = 0;
                                            j < data.length;
                                            j++
                                          ) {
                                            let { feelings_id } = data[j];
                                            let max = data.length - 1;
                                            // console.log("feelings_id", feelings_id);
                                            preFeelingsDb
                                              .getID(feelings_id)
                                              .then(data => {
                                                // console.log("pre feeling array", data);
                                                if (data.length === 0) {
                                                  console.log({
                                                    error: `Pre Feeling with Id: ${feelings_id} does not exist.`
                                                  });
                                                } else if (
                                                  data.length !== 0 &&
                                                  j < max
                                                ) {
                                                  let feeling_text =
                                                    data[0].feeling_text;
                                                  feelingTextArray.push(
                                                    feeling_text
                                                  );
                                                } else if (
                                                  data.length !== 0 &&
                                                  j === max
                                                ) {
                                                  let feeling_text =
                                                    data[0].feeling_text;
                                                  feelingTextArray.push(
                                                    feeling_text
                                                  );
                                                  // console.log(
                                                  //   "feelingTextArray",
                                                  //   feelingTextArray
                                                  // );

                                                  let arrayOptions = [];
                                                  for (
                                                    let t = 0;
                                                    t < feelingTextArray.length;
                                                    t++
                                                  ) {
                                                    let max2 =
                                                      feelingTextArray.length -
                                                      1;
                                                    if (t === max2) {
                                                      let value = {
                                                        name:
                                                          feelingTextArray[t],
                                                        text:
                                                          feelingTextArray[t],
                                                        type: "button",
                                                        value:
                                                          feelingTextArray[t]
                                                      };
                                                      // console.log("value", value);
                                                      arrayOptions.push(value);
                                                      ///////////////////////////////////////////////////////////////////

                                                      console.log(
                                                        "arrayOptions",
                                                        arrayOptions
                                                      );
                                                      let message = {
                                                        is_app_unfurl: true,
                                                        // "original_message": {
                                                        attachments: [
                                                          {
                                                            title: `${title}`,
                                                            text: `${description}`,
                                                            pretext: `Survey #${survey_id}`,
                                                            // fallback:
                                                            //   "Shame... buttons aren't supported in this land",
                                                            callback_id: `button_tutorial ${survey_id}`,
                                                            color: "#3AA3E3",
                                                            attachment_type:
                                                              "default",
                                                            actions: arrayOptions
                                                          }
                                                        ]
                                                        // }
                                                      };
                                                      // console.log("message", message);
                                                      sendMessageToSlackResponseURL(
                                                        responseURL,
                                                        message
                                                      );

                                                      ///////////////////////////////////////////////////////////////////
                                                    } else {
                                                      let value = {
                                                        name:
                                                          feelingTextArray[t],
                                                        text:
                                                          feelingTextArray[t],
                                                        type: "button",
                                                        value:
                                                          feelingTextArray[t]
                                                      };
                                                      // console.log("value", value);
                                                      arrayOptions.push(value);
                                                    }
                                                  }
                                                }
                                              })
                                              .catch(err => console.log(err));
                                          }
                                          //     })
                                          //     .then(data => {
                                          //       // console.log("data", data);
                                          //     })
                                          //     .then(() => {})
                                          //     .catch(err => console.log(err));
                                          // }
                                        })
                                        .catch(err => console.log(err));
                                    }
                                  }
                                })
                                .catch();
                            }
                          })
                          .catch(err => console.log(err));
                      }
                    })
                    .catch(err => console.log(err));
                }
              })
              .catch(err => console.log(err));
          }
        })
        .catch(err => console.log(err));
    }
  } else if (reqBody.message === true) {
    let surveyId = reqBody.survey_id;
    console.log("surveyId", surveyId);
    // surveyIdDep = surveyId;
    // console.log("surveyIdDep test", surveyIdDep);
    let title = reqBody.title;
    let description = reqBody.description;
    let options = reqBody.options;
    // console.log("options", options);
    let arrayOptions = [];
    for (let i = 0; i < options.length; i++) {
      let value = {
        text: options[i],
        value: options[i]
      };
      // console.log("value", value);
      arrayOptions.push(value);
    }
    // console.log("arrayOptions", arrayOptions);

    dbAuth
      .getByMemberId(reqBody.member_id)
      .then(data => {
        // const botToken = data[0].access_token;
        const botToken = data[0].bot_access_token;
        console.log("botToken", botToken);
        const { channel_id } = data[0];
        console.log("channel_id", channel_id);
        if (channel_id === "") {
          res.status(404).json("channel id is equall to null");
        } else {
          let message = {
            channel: channel_id,
            response_type: "ephemeral",
            as_user: false,
            attachments: [
              {
                title: `${title}`,
                text: `${description}`,
                pretext: `Survey #${surveyId}`,
                // fallback:
                //   "If you could read this message, you'd be picking a feeling right now.",
                color: "#3AA3E3",
                attachment_type: "default",
                callback_id: "feeling_menu",
                actions: [
                  {
                    name: "feeling_list",
                    text: "Pick a feeling...",
                    type: "select",
                    options: arrayOptions
                  }
                ]
              }
            ]
          };
          // console.log(message);

          postMessage(message, botToken);
        }
      })
      .catch(err => err);
  } else if (reqBody.message === "curie") {
    // console.log("testing curie"); //grabbing data from survey router
    let curieSurveyId = reqBody.survey_id;
    let managerID = reqBody.manager_id;
    // console.log("managerId", managerID);
    // console.log("curieSurveyId", curieSurveyId);
    let title = reqBody.title;
    let question_1 = reqBody.question_1;
    let question_2 = reqBody.question_2;
    let question_3 = reqBody.question_3;

    dbAuth.getByMemberId(managerID).then(managerSlack => {
      // console.log("mangerslack", managerSlack);
      const curieBotToken = managerSlack[0].bot_access_token;
      // console.log("curieBotToken", curieBotToken);
      dbTeamMembers.getManager(managerID).then(manager => {
        // console.log(manager);
        dbTeamMembers.getTeamMember(manager[0].team_id).then(team => {
          // console.log(team);

          dbAuth.getByMemberId(team[0].id).then(slackUser => {
            console.log("teamMember", slackUser);
            let curieMessage = {
              channel: slackUser[0].user_id,
              as_user: true,
              reply_broadcast: true,
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "plain_text",
                    text: `${title}`
                  }
                },
                {
                  type: "section",
                  block_id: "question1",
                  text: {
                    type: "plain_text",
                    text: `${question_1}`
                  }
                },
                {
                  type: "section",
                  block_id: "question2",
                  text: {
                    type: "plain_text",
                    text: `${question_2}`
                  }
                }
                // {
                //   type: "section",
                //   block_id: "question3",
                //   text: {
                //     type: "plain_text",
                //     text: `${question_3}`
                //   }
                // }
              ]
            };
            console.log("posting private message");
            postPrivateMessage(curieMessage, curieBotToken);
          });
        });
      });
    });
  } else if (reqBody.payload) {
    let jsonPayload = JSON.parse(reqBody.payload);
    let userIdSlack = jsonPayload.user.id;
    let callbackIDSlash = jsonPayload.callback_id;
    console.log("jsonPayload", jsonPayload);
    /////////////////////////////////////////////
    console.log("jsonPayload time stamp", jsonPayload.message_ts);

    let SurveyID = Number(callbackIDSlash.split(" ")[1]);
    console.log("SurveyID", SurveyID);
    let teamID = jsonPayload.team.id;
    console.log(teamID);
    dbAuth
      .getBySlackTeamId(teamID)
      .then(data => {
        let buttonManagerID = data[0].id;
        console.log("data", data);
        console.log("buttonManagerID", buttonManagerID);

        /////////////////////////////////////////////////////////////////////////////

        if (callbackIDSlash.includes("button_tutorial")) {
          ///////////////////////////////////////////////////////////////////////////////////////////

          dbAuth
            .getBySlackUserId(jsonPayload.user.id)
            .then(data => {
              console.log("getBySlackUserId", data);
              let id = data[0].member_id;
              dbTeamMembers
                .getID(id)
                .then(data => {
                  console.log("data member", data);
                  if (data[0].type === "manager") {
                    res.json(`Manager's Cannot Respond to Survey's!`);
                  } else {
                    dbSurveys
                      .getID(SurveyID)
                      .then(data => {
                        if (data.length > 0) {
                          console.log("data survey id for time", data);
                          let putInfo;
                          let survey_time_stamp;
                          if (data[0].survey_time_stamp === null) {
                            putInfo = {
                              survey_time_stamp: jsonPayload.message_ts
                            };
                            survey_time_stamp = jsonPayload.message_ts;
                          } else {
                            putInfo = {
                              survey_time_stamp: data[0].survey_time_stamp
                            };
                            survey_time_stamp = data[0].survey_time_stamp;
                          }

                          dbSurveys
                            .update(SurveyID, putInfo)
                            .then(() => {
                              dbAuth
                                .getBySlackUserId(userIdSlack)
                                .then(data => {
                                  console.log("data slack user id", data[0]);
                                  let team_member_id = data[0].member_id;
                                  console.log("team_member_id", team_member_id);
                                  let postFeel;
                                  if (
                                    callbackIDSlash.includes("button_tutorial")
                                  ) {
                                    postFeel = {
                                      feeling_text:
                                        jsonPayload.actions[0].value,
                                      team_member_id: team_member_id,
                                      survey_time_stamp: survey_time_stamp,
                                      survey_id: surveyID
                                    };
                                  } else {
                                    postFeel = {
                                      feeling_text:
                                        jsonPayload.actions[0]
                                          .selected_options[0].value,
                                      team_member_id: team_member_id,
                                      survey_time_stamp: survey_time_stamp,
                                      survey_id: surveyID
                                    };
                                  }

                                  console.log("postFeel", postFeel);
                                  dbFeelings
                                    .getByMemberAndSurveyTimeStamp(
                                      team_member_id,
                                      survey_time_stamp
                                    )
                                    .then(data => {
                                      console.log("data mem sur", data);
                                      dbFeelings
                                        .insert(postFeel)
                                        .then(() => {
                                          res.json(
                                            `Submited Feeling: ${
                                              postFeel.feeling_text
                                            }`
                                          );
                                        })
                                        .catch(serverErrorPost(res));
                                    })
                                    .catch(serverErrorGet(res));
                                })
                                .catch(serverErrorGet(res));
                            })
                            .catch(err => console.log(err));
                        } else {
                          console.log({
                            error: "survey does not exist"
                          });
                        }
                      })
                      .catch(err => console.log(err));
                  }
                })
                .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
        } else {
          console.log(
            "jsonPayload.original_message",
            jsonPayload.original_message
          );
          console.log(
            "jsonPayload.original_message.attachments",
            jsonPayload.original_message.attachments
          );
          let preText = jsonPayload.original_message.attachments[0].pretext;
          let ArrayS = preText.split("#");
          SurveyID = Number(ArrayS[1]);
          console.log("preText", preText);
          console.log("ArrayS", ArrayS);
          console.log("SurveyID", SurveyID);
          console.log("jsonPayload.user.id", jsonPayload.user.id);

          let slackUserID = jsonPayload.user.id;
          let slackChannelID = jsonPayload.channel.id;
          let teamID = jsonPayload.team.id;

          console.log("slackUserID", slackUserID);
          console.log("slackChannelID", slackChannelID);
          console.log("teamID", teamID);

          dbAuth
            .getBySlackTeamIdSTD(teamID)
            .then(data => {
              let botToken = data.map(item => {
                return item.bot_access_token !== null
                  ? item.bot_access_token
                  : null;
              })[0];
              console.log("botToken", botToken);
              dbAuth
                .getBySlackUserId(slackUserID)
                .then(data => {
                  console.log("getBySlackUserId", data);

                  let id = data[0].member_id;
                  dbTeamMembers
                    .getID(id)
                    .then(data => {
                      console.log("data member", data);
                      if (data[0].type === "manager") {
                        let message1 = {
                          channel: slackChannelID,
                          user: slackUserID,
                          text: "Manager's Cannot Respond to Survey's!"
                        };

                        postEphMessage(message1, botToken);
                      } else {
                        dbSurveys
                          .getID(SurveyID)
                          .then(data => {
                            if (data.length > 0) {
                              console.log("data survey id for time", data);
                              let putInfo;
                              let survey_time_stamp;
                              if (data[0].survey_time_stamp === null) {
                                putInfo = {
                                  survey_time_stamp: jsonPayload.message_ts
                                };
                                survey_time_stamp = jsonPayload.message_ts;
                              } else {
                                putInfo = {
                                  survey_time_stamp: data[0].survey_time_stamp
                                };
                                survey_time_stamp = data[0].survey_time_stamp;
                              }

                              dbSurveys
                                .update(SurveyID, putInfo)
                                .then(() => {
                                  dbAuth
                                    .getBySlackUserId(userIdSlack)
                                    .then(data => {
                                      console.log(
                                        "data slack user id",
                                        data[0]
                                      );
                                      let team_member_id = data[0].member_id;
                                      console.log(
                                        "team_member_id",
                                        team_member_id
                                      );
                                      let postFeel;
                                      // if (callbackIDSlash === "button_tutorial") {
                                      //   postFeel = {
                                      //     feeling_text: jsonPayload.actions[0].value,
                                      //     team_member_id: team_member_id,
                                      //     survey_time_stamp: survey_time_stamp
                                      //   };
                                      // } else {
                                      postFeel = {
                                        feeling_text:
                                          jsonPayload.actions[0]
                                            .selected_options[0].value,
                                        team_member_id: team_member_id,
                                        survey_time_stamp: survey_time_stamp,
                                        survey_id: surveyID
                                      };
                                      // }

                                      console.log("postFeel", postFeel);
                                      dbFeelings
                                        .getByMemberAndSurveyTimeStamp(
                                          team_member_id,
                                          survey_time_stamp
                                        )
                                        .then(data => {
                                          console.log("data mem sur", data);
                                          dbFeelings
                                            .insert(postFeel)
                                            .then(() => {
                                              let message2 = {
                                                channel: slackChannelID,
                                                user: slackUserID,
                                                text: `Submited Feeling: ${
                                                  postFeel.feeling_text
                                                }`
                                              };

                                              postEphMessage(
                                                message2,
                                                botToken
                                              );
                                            })
                                            .catch(serverErrorPost(res));
                                        })
                                        .catch(serverErrorGet(res));
                                    })
                                    .catch(serverErrorGet(res));
                                })
                                .catch(err => console.log(err));
                            } else {
                              console.log({ error: "survey does not exist" });
                            }
                          })
                          .catch(err => console.log(err));
                      }
                    })
                    .catch(err => console.log(err));
                })
                .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
        }
      })
      .catch(err => console.log(err));
  }
});

module.exports = router;

// heroku logs --tail -a botsentiment

// chnage heroku time zone for moment.js to work
// heroku config:add TZ="America/New_York" -a labs11-curie-web
