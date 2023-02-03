// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
  logging: true,
  user: {
    context: {
      enabled: true,
    },
  },
  db: {
    Firestore: {
      credential: require('./credentials/firestore.json'),
      databaseURL: 'https://digengproject02-default-rtdb.firebaseio.com'
    }
  },
  intentMap: {
    'Default Fallback Intent': 'Unhandled',
    "Default Welcome Intent": "LAUNCH",
  },
  intentsToSkipUnhandled: [
    'CancelIntent',
    'CredentialControlIntent',
    'UserDataIntent',
    'RepeatIntent',
    'CostIDCardIntent'
  ],
};
