const express = require("express");
const configureMiddleware = require("./middleware/middleware.js");
require('dotenv').config();

// const managerRouter = require("./routes/managerRouter.js");
const teamMemberRouter = require("./routes/teamMemberRouter.js");
const teamRouter = require("./routes/teamRouter.js");
const {router} = require("./routes/surveyRouter.js");
const feelingRouter = require("./routes/feelingRouter.js");
const preFeelingRouter = require("./routes/preFeelingRouter");
const surveyFeelingRouter = require("./routes/survey_feelingsRouter");
const stripeRouter = require("./routes/stripeRouter");
const slashRouter = require("./routes/slashRouter");
const slackAuth = require("./routes/slackAuth.js");
const surveyActiveRouter = require("./routes/surveyActiveRouter");
const questionSurveyRouter = require("./routes/questionSurvey"); //labs11
const curieActiveSurveyRouter = require("./routes/curieActiveSurvey"); //labs11
const curieAnswers = require("./routes/curieAnswerRouter"); //labs11

const stripe = require("stripe")(process.env.SECRETKEY);
const bodyParser = require("body-parser");
// const exphbs = require('express-handlebars');
const server = express();
configureMiddleware(server);

// Stripe Middlewares
// Handlebars Middelware
// server.engine('handlebars', exphbs({defaultLayout: 'main'}));
// server.search('view engine', 'handlebars');
// Body Parser Middleware
// server.use(bodyParser.json());
server.use(bodyParser.text());
// server.use(bodyParser.urlencoded({extended:false}));

// server.use("/api/managers", managerRouter);
server.use("/api/team_members", teamMemberRouter);
server.use("/api/teams", teamRouter);
server.use("/api/surveys", router);
server.use("/api/feelings", feelingRouter);
server.use("/api/pre-set-feelings", preFeelingRouter);
server.use("/api/survey_feelings", surveyFeelingRouter);
server.use("/api/stripe", stripeRouter);
server.use("/api/slash", slashRouter);
server.use("/api/slackauth", slackAuth);
server.use("/api/survey_active", surveyActiveRouter);
server.use("/api/questionSurvey", questionSurveyRouter); //labs11
server.use("/api/curieActiveSurvey", curieActiveSurveyRouter); //labs11
server.use("/api/curieAnswers", curieAnswers); //labs11


server.get("/", (req, res) => {
  res.status(200).json("Sanity Check ITS WORKING");
  console.log("Sanity Check ITS WORKING!!!");
});

server.post("/charge", async (req, res) => {
  try {
    let { status } = await stripe.charges.create({
      amount: 1000,
      currency: "usd",
      description: "An example charge",
      source: req.body
    });

    res.json({ status });
  } catch (err) {
    res.status(500).end();
  }
});


module.exports = server;
