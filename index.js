const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');

// initialise DB connection
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'ws://saveaverageage.firebaseio.com/',
});

process.env.DEBUG = 'dialogflow:debug';

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function handleAge(agent) {
    const age = agent.parameters.age;

    agent.add(`Thank you...`);

    return admin.database().ref('ageInfo').transaction((ageInfo) => {
      if(ageInfo !== null) {
        let oldAverage = ageInfo.runningAverage;
        let oldTotalCount = ageInfo.totalCount;
        let newAverage = (oldAverage * oldTotalCount + age) / (oldTotalCount + 1);
        ageInfo.runningAverage = newAverage;
        ageInfo.totalCount+=1;
        agent.add(`Our recorded average age is ` + newAverage);
      }
      return ageInfo;
    }, function(error, isSuccess) {
      console.log('Update average age transaction success: ' + isSuccess);
    });

  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('AskAge', handleAge);
  agent.handleRequest(intentMap);
});
