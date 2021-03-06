# Labs11-Curie
//
Curie is an add-on to Mood that creates easy and user friendly way for employees to generate survey questionnaires. It provides an efficient method of getting feedback from a large pool of questions that can help with group productivity and morale.

## Front End

 Front end was built with create-react-app. To run a local server,

 yarn start must be run inside of the sentiment bot file.

 Redux is being used to manage state.

 Notable APIs in use are Stripe, Auth0, and Slack.

 Hosted on Netlify.

## Back End

 Backend built with Express and NodeJS

 Notable APIs in use are Stripe and Slack.

 Hosted on Heroku.

## Data Base

Local created with knex.js and sqlite3

Production created with knex.js and Heroku PostgresSQL

## Authors

* **Justin Arata**  - [jarata](https://github.com/jarata)
* **Samantha Soucy** - [SamSoucy](https://github.com/SamSoucy)
* **Cynthia Ramos**  - [bluelogix](https://github.com/bluelogix)
* **Sheila Febres**  - [s-hopper01110](https://github.com/s-hopper01110)
* **Farhan Farooqui**  - [farhanf](https://github.com/farhanf)
* **CJ Wright** - [cwright0428](https://github.com/cwright0428)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Useful Info

Using Heroku CLI:
Migration Latest Command: heroku run knex --knexfile=./back-end/knexfile.js  migrate:latest -a botsentiment
Migration Rollback Command: heroku run knex --knexfile=./back-end/knexfile.js  migrate:rollback -a botsentiment
Veiw Real Time Production Logs: heroku logs --tail -a botsentiment

Notes:
Changes Heroku Time Zone to Eastern Standard for momnet.js day light savings
Command: heroku config:add TZ="America/New_York" -a botsentiment

## Endpoints

### GET : [

| Method | Endpoint      | Description                                                                   |
| ------ | ------------- | ----------------------------------------------------------------------------- |
| GET    | /api/team_members | responds with all team members and managers [{data}] |
| GET    | /api/team_members/:id | responds with the team member/manager associated with the specified id [{data}] |
| GET    | /api/team_members/Email/:email | responds with the team member/manager associated with the specified email [{data}] |
| GET    | /api/teams  | responds with all teams [{data}]  |
| GET    | /api/teams/:id | responds with a team associated with the specified id [{data}] |
| GET    | /api/surveys/manager/:id | responds with all survey's [{data}]  |
| GET    | /api/surveys/:id |  responds with a survey associated with the specified id [{data}]  |
| GET    | /api/surveys/changeActivity/:id |  changes the activity of a survey to inactive associated with the specified id [{data}] |
| GET    | /api/surveys/surveys/team-member/:id  | responds with the surveys by team member id for IOS  |
| GET    | /api/surveys/curie/surveys/team-member/:id | respond with the curie surveys for team member by id  | 
| GET    | /api/survey_active | responds with all survey's activity info in the Data Base [{data}]  |      
| GET    | /api/survey_feelings | responds with all survey feelings in the Data Base [{data}]  |
| GET    | /api/survey_feelings/:id | responds with survey feeling associated with specified survey feeling id [{data}] |   
| GET    | /api/slackauth | Process for Slack Authorization Returns to Netlify |   
| GET    | /api/slackauth/all | responds with all Slack Auth Table's in the Data Base [{data}]  | 
| GET    | /api/slackauth/:id | responds with slack auth associated with specified slack auth id [{data}] |  
| GET    | /api/slackauth/single/:id | responds with slack auth associated with specified slack auth member_id [{data}] |  
| GET    | /api/pre-set-feelings | responds with all pre set feelings in the  Data Base [{data}]  |
| GET    | /api/pre-set-feelings/:id | responds with pre set feeling associated with specified pre set feeling id [{data}] |   
| GET    | /api/feelings| responds with all feelings in the Data Base [{data}]  |
| GET    | /api/feelings/:id | responds with feeling associated with specified feeling id [{data}]  |
| GET    | /api/feelings/:team_id | responds with feelings associated with specified team id [{data}]  |
| GET    | /api/feelings/myfeelings/:id | responds with all feelings associated with specified team-member [{data}] |
| GET | /api/questionSurvey | responds with all surveys in data base |
| GET | /api/questionSurvey/:id | responds with survey associated with specific survey id |
| GET | /api/questionSurvey/created/:date | responds with survey associated with specific date |
| GET | /api/questionSurvey/changeActivityCurie/:id | responds with survey associated with activity change and id |
| GET | /api/curieActiveSurvey | responds with all active surveys in data base |
| GET | /api/curieAnswers | responds with all answers for curie surveys |
| GET | /api/curieAnswers/questions_id/:id | responds with questions and answers for the curie surveys by ID for team members |
| Get | /api/curieAnswers/team/:id | responds with questions and answers for a manger to get them for all members of their team members using team id |



### POST : [

| Method | Endpoint      | Description                                                                   | body                  |
| ------ | ------------- | ----------------------------------------------------------------------------- | --------------------- |
| POST    | /api/team_members | Creates a new team member during initial registration, type and team_id to be determined later | {"firstName": "string", "lastName": "string", "email": "string", "phone": "string", "type": null, "team_id": null}|
| POST    | /api/teams | Creates a new team |{"name": "string", "memberId": integer}|
| POST    | /api/surveys | Creates a new survey with a recurring schedule |{"title": "string", "description": "string", "manager_id": integer, "dailyWeeklyMonthly": "string", "hour": integer, "amPm": "string", "timeZone": "string", "min": integer, "preFeelingIdsArray": [ integers ]}|
| POST    | /api/survey_feelings | Creates a new survey-feeling this is an intermediate table acossiating a survey to a pre set feeling |{"survey_id": integer, "feelings_id": integer}|
| POST    | /api/slash/connect-channel-to-survey | when you place the slash command /connect-channel-to-survey inside the slack channel you will update your users slack auth with the appropriate slack channel id| ---|
| POST    | /api/slash/send-me-buttons | this is route containing the process for posting surveys to slack, use slash command /send-me-buttons inorder to respond to active survey's | ---|
| POST    | /api/pre-set-feelings | Creates a new pre set feeling |{"feeling_text": "string"}|
| POST    | /api/feelings | Creates a new feeling |{"feeling_text": "string", "team_member_id": integer}|
| POST    | /api/questionSurvey  | Creates a new survey  |
| POST    | /api/curieAnswers  | Creates answers for Curie survey  |
| POST    |/api/curieAnswers/ios | Creates answers for IOS curie surveys |
| POST    | /api/stripe | creates a subscription to curie surveys |

### PUT : [

| Method | Endpoint      | Description                                                                   | body                  |
| ------ | ------------- | ----------------------------------------------------------------------------- | --------------------- |
| PUT    | /api/team_members/:id | Update team member associated with specified id |{ "firstName": "string", "lastName": "string", "email": "string", "phone": "string", "type": "string", "team_id": integer }|
| PUT    | /api/team_members/:id/join | Update team member associated with specified team id (During Join a Team Process) |{ "team_code": integer }|
| PUT    | /api/teams/:id | Update team associated with specified id |{"name": "string", "team_code": integer}|
| PUT    | /api/surveys/:id | Update survey associated with specified id |{"title": "string", "description": "string", "manager_id": integer}|
| PUT    | /api/survey_feelings/:id | Update survey_feeling associated with specified id |{"survey_id": integer, "feelings_id": integer}|
| PUT    | /api/slackauth/slackAuth/:id | Not Implemented |
| PUT    | /api/pre-set-feelings/:id | Update pre set feeling associated with specified id |{"feeling_text": "string"}|
| PUT    | /api/feelings/:id | Update feeling associated with specified id |{"feeling_text": "string", "team_member_id": integer}|
| PUT |  /api/questionSurvey/:id | Updates survey associated with specified id  |
### DELETE : [

| Method | Endpoint      | Description                                                                   |
| ------ | ------------- | ----------------------------------------------------------------------------- |
| DELETE    | /api/team_members/:id | Deletes member with associated id |
| DELETE    | /api/teams/:id | Deletes team with associated id |
| DELETE    | /api/surveys/:id | Deletes survey with associated id |
| DELETE    | /api/survey_feelings/:id | Deletes survey_feeling with associated id |
| DELETE    | /api/slackauth/slackAuth/:id | Deletes slack auth with associated id |
| DELETE    | /api/pre-set-feelings/:id | Deletes pre set feeling with associated id |
| DELETE    | /api/feelings/:id | Deletes feeling with associated id |
| DELETE    | /api/questionSurvey/:id | Deletes survey with associated id  |