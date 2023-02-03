// ------------------------------------------------------------------
// JOVO PROJECT CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
  googleAction: {
    nlu: 'dialogflow',
  },
  dialogflow: {
    projectId: 'digengproject02',
    keyFile: './src/credentials/dialogflow.json',
  },
  endpoint: '${JOVO_WEBHOOK_URL}',
};
