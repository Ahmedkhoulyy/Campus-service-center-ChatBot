const admin = require('firebase-admin');


const db = admin.firestore();
const ID_status_Ref = db.collection('ID_card_requests') //for database call in ID card status requests
const userRef = db.collection('users'); //for database call in LostID-Topic


module.exports = {
    YesIntent() {
        this.tell("Thanks for talking with me. Goodbye. You can close this chat now.")
    },

    NoIntent() {
        this.followUpState(null)
        .ask("Ok. Please ask another question.")
        
    }
}
