const admin = require('firebase-admin');


const db = admin.firestore();
const ID_status_Ref = db.collection('ID_card_requests') //for database call in ID card status requests


module.exports = {


    async CredentialIntent() {
        var prevname = this.$session.$data.cred_name
        var prevmatr_num = this.$session.$data.cred_matr_num;


        var name = await this.getInput('name').value ? this.getInput('name').value : prevname;
        if (typeof name === 'object' && name !== null) {
            name = this.getInput('name').value.name;
        }

        console.log(name)

        var matr_num = this.getInput('matric').value ? this.getInput('matric').value : prevmatr_num;

        if (!name && !matr_num) {
        this.ask("In order to check for the status of your card, please provide your name, your student number, and your university email")
        }


        if (name) { //Name split for email address
            var nameArray = JSON.stringify(name).split(" ");
            if (nameArray.length < 2) {
              this.ask("Please provide your firstname and surname")
              return
            } else {
              var firstName = nameArray[0].replace('"', "")
              var surName = nameArray[1].replace('"', "")
              this.$session.$data.cred_name = name;
            }
        } else {
        this.ask("Please tell me your name");
        return;
        }
        
            
        if (matr_num) {
            if (matr_num.toString().length != 6) {
                this.ask("Please re-check the matriculation number you've entered");
            } else {
                this.$session.$data.cred_matr_num = matr_num;
            }
        } else {
            this.ask("We also need your student number to proceed");
            return;
        }

        //Status query

        try {
        const doc = await ID_status_Ref.doc("" + this.$session.$data.cred_matr_num).get();
        if (!doc.exists) {
            console.log('No such document!');
            this.ask("Thanks for your information. Unfortunately we have no information on the status of your card.")
        } else {
            console.log('Document data:', doc.data());
            var user = doc.data()

            if ((user["status"]) === 1) { // missing confirmation
            this.followUpState("IDCardState.NewIDCardState.CredentialState.ConfirmationState")
                .ask("You did not confirm the ID-card inquiry yet. This involves confirming the handling fee. Would you like to confirm now?" +
                "(This is only a test version, so no strings attached)") //call to confirmation state
            } else if ((user["status"]) === 2) { //confirmed inquiry //manual increase - CSC interaction necessary
            this.ask("We have received your inquiry about your id card and are currently in the process of making you a new one. Please wait a while longer.")
            ID_status_Ref.doc("" + this.$session.$data.cred_matr_num).set({
                status: 3
            });
            } else if ((user["status"]) === 3) { //ready for pickup //Implement a way back to appointment state
            this.followUpState("IDCardState.NewIDCardState.PickUpState")
                .ask("Your card is ready for pickup now. Would you like to come by yourself or should we send it to you per post?")
            } else if ((user["status"]) === 4) { // picked up //equals deletion, maybe timed? Two days after pickup or something?
            this.ask("You picked up your card already. We will soon delete your inquiry from the database.")
            }
        }
        } catch (e) {
        console.error("test", e.message);
        this.ask("Thanks for your information. Unfortunately we were not able to find your card. Would you like us to make you a new one?")
        }
    },
    
    
}
