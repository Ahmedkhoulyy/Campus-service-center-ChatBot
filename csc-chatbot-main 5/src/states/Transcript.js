const admin = require('firebase-admin');


const db = admin.firestore();
const ID_status_Ref = db.collection('ID_card_requests') //for database call in ID card status requests
const userRef = db.collection('users'); //for database call in LostID-Topic

const collection_transcript_req = "Transcript Requests";

module.exports = {


    PhysicalIntent() {
        this.$speech.addText('Please tell us your name, id number, and your student email id');
        this.$reprompt.addText('Your name, matriculation number, and email please');

        this.followUpState("TranscriptTypeState.TranscriptCredentialState")
            .ask(this.$speech, this.$reprompt);
    },

    TranscriptCredentialState: {
        async CredentialIntent() {
            console.log('Transcripts: (Inputs): ', this.$inputs);
            let tr_name = this.$inputs.name.key.name ? this.$inputs.name.key.name : this.$session.$data.cred_name;
            let tr_id = this.$inputs.matric.key ? this.$inputs.matric.key : this.$session.$data.cred_matr_num;

            if (!tr_id) {
                this.ask('And your matriculation number is?');
                return;
            }

            if (!tr_name) {
                this.ask("Please also tell us your name");
                return;
            }

            if (!tr_name || !tr_id) {
                this.ask("Please provide both your name and your matriculation number");
                return;
            }

            this.$session.$data.tr_name = tr_name;

            if (tr_id.toString().length != 6) {
                this.ask("Please re-check the matriculation number you've entered");
                return;
            }

            const transcriptCollection = db.collection(collection_transcript_req);
            const queryRes = await transcriptCollection.where('id', '==', tr_id).get();
            if (!queryRes.empty) {
                this.followUpState(null)
                    .ask(`You already have a pending request for transcripts. Please go to the Campus Service Center to collect them.`);
                return;
            }

            this.$session.$data.tr_id = tr_id;

            this.$speech.addText(`Thank you. Your name is ${tr_name} and matriculation number is ${tr_id}. Is that correct?`);
            this.followUpState('TranscriptTypeState.TranscriptCredentialState.CredentialConfirmationState')
                .ask(this.$speech);
        },

        NoIntent() {
            this.followUpState(null)
                .ask("That's alright! Please go to the Campus Service Center to obtain your Transcripts. Anything else we can help you with?");
        },

        CredentialConfirmationState: {
            YesIntent() {
                let tr_name = this.$session.$data.tr_name
                let tr_id = this.$session.$data.tr_id

                const transcriptCollection = db.collection(collection_transcript_req);
                transcriptCollection.doc("" + tr_id).set({
                    name: tr_name,
                    id: tr_id
                })

                this.$session.$data.tr_name = null
                this.$session.$data.tr_id = null

                this.followUpState(null)
                    .ask(`Sounds great, ${tr_name}! Please go to the Campus Service Center to get your transcripts.`)
            },

            NoIntent() {
                this.$session.$data.tr_name = null
                this.$session.$data.tr_id = null

                this.$speech.addText('Please tell us your name and id number');
                this.$reprompt.addText('Your name and matriculation number, please');

                this.followUpState("TranscriptTypeState.TranscriptCredentialState")
                    .ask(this.$speech, this.$reprompt);
            }
        }
    },

    DigitalIntent() {
        this.ask('To get the digital transcripts, please go to LSF');
    }

}
