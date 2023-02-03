const admin = require('firebase-admin');


const db = admin.firestore();
const ID_status_Ref = db.collection('ID_card_requests') //for database call in ID card status requests
const userRef = db.collection('users'); //for database call in LostID-Topic



module.exports = {

    YesIntent() {
        //TODO: Have this message formatted properly when showing
        this.followUpState(null)
        .ask(`You can generate new TANs from the LSF console.
        1. Open your LSF account and navigate to General Administration → TAN Management
        2. Click on Create new TAN list and enter a TAN that you already have
        3. Specify the amount of TANs that you need
        4. Click on Create and save the resulting document.
        To activate this TAN list:
        1. Enter an old and a new TAN number in the corresponding text fields
        2. Click Submit
        ` +
        "Anything else we can help you with?");
    },

    NoIntent() {
        this.followUpState(null)
        . ask('Since you have fewer than 2 TANs, please go to the Campus Service Center to get a new TAN list. Anything else we can do for you?');

        this.$session.$data.prev_loc = "campus service center";
        this.$session.$data.prev_dt = new Date();
    }
}

