const admin = require('firebase-admin');


const db = admin.firestore();
const ID_status_Ref = db.collection('ID_card_requests') //for database call in ID card status requests
const userRef = db.collection('users'); //for database call in LostID-Topic


module.exports = {
    async YesIntent() {
      this.$session.$data.end_reached = "True"
      this.followUpState("CancelState.UserDataState")
        .ask("Ok. Should we also delete your user data?")
    },

    async NoIntent() {
      this.followUpState(this.$session.$data.prevstate)
        .ask("Please proceed with answering your current inquiry.")
    },

    UserDataState: {
      async YesIntent() {
        this.$session.$data.end_reached = "True"
        this.followUpState("EndState")
          .ask("User data deleted. Do you want to end the converation now?")
        if (this.$session.$data.id) {
          const doc = await userRef.doc("" + this.$session.$data.id).get();
          if (doc.exists) {
            const res = await userRef.doc("" + this.$session.$data.id).delete()
          }
        }
        this.$session.$data.cred_matr_num = ""
        this.$session.$data.cred_name = ""
        this.$session.$data.cred_mail =""
        this.$session.$data.cred_city = ""
        this.$session.$data.cred_zipcode = ""
        this.$session.$data.cred_street =""
        },

      NoIntent() {
        this.followUpState("EndState")
          .ask("User data not deleted. Do you want to end the converation now?")
      },
      async UserDataIntent() { //work in progress
        var save_or_del = await this.getInput('UserDataEntity').key;
        if (save_or_del === "save") {
          this.followUpState("EndState")
            .ask("Ok we will save your user data. Do you want to end the conversation now?")
          //General Information
          if (this.$session.$data.cred_name) {
            userRef.doc("" + this.$session.$data.id).update({
              name: this.$session.$data.cred_name,
            });          
          }
          if (this.$session.$data.cred_matr_num) {
            userRef.doc("" + this.$session.$data.id).update({
              matr_num: this.$session.$data.cred_matr_num,
            });          
          }
          if (this.$session.$data.cred_mail) {
            userRef.doc("" + this.$session.$data.id).update({
              mail: this.$session.$data.cred_mail,
            });          
          }
          //Address credentials
          if (city && zipcode && address) {
            userRef.doc("" + this.$session.$data.cred_matr_num).update({
              city: this.$session.$data.city,
              zipcode: this.$session.$data.zipcode,
              address: this.$session.$data.address,
            });
          }

        } else if (save_or_del === "delete") {
          this.followUpState("EndState")
            .ask("Ok we will delete your user data. Do you want to end the conversation now?")
          console.log(this.$session.$data.cred_matr_num)
          const doc = await userRef.doc("" + this.$session.$data.cred_matr_num).get();
          if (this.$session.$data.id) {
            const doc = await userRef.doc("" + this.$session.$data.id).get();
            if (doc.exists) {
              const res = await userRef.doc("" + this.$session.$data.id).delete()
            }
          }
          this.$session.$data.cred_matr_num = ""
          this.$session.$data.cred_name = ""
          this.$session.$data.cred_mail =""
          this.$session.$data.cred_city = ""
          this.$session.$data.cred_zipcode = ""
          this.$session.$data.cred_street =""
        }
      },
      Unhandled() {
        this.ask("Please decide if your session data should be deleted")
      }
    },
}
