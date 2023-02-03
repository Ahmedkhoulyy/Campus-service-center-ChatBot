'use strict';

// ------------------------------------------------------------------
// APP Initialization
// ------------------------------------------------------------------

const collection_transcript_req = "Transcript Requests";

const {App} = require('jovo-framework');
const {GoogleAssistant} = require('jovo-platform-googleassistant');
const {Dialogflow, FacebookMessenger, Slack,  } = require('jovo-platform-dialogflow');
const {JovoDebugger} = require('jovo-plugin-debugger');
const {Firestore} = require('jovo-db-firestore');
const admin = require('firebase-admin');

admin.initializeApp({credential: admin.credential.cert(require('./credentials/firestore.json'))});

const db = admin.firestore();

const app = new App();
app.use(
  new GoogleAssistant(),
  new JovoDebugger(),
  new Firestore({}, db),
  new Dialogflow()
);

// ------------------------------------------------------------------
// APP Parameters for database
// ------------------------------------------------------------------

const userRef = db.collection('users'); //for database call in LostID-Topic
const ID_status_Ref = db.collection('ID_card_requests') //for database call in ID card status requests
const openhoursRef = db.collection("office_infos")

// ------------------------------------------------------------------
// State LOGIC
// ------------------------------------------------------------------

const EndState = require('./states/End.js');
const IDCardState = require('./states/IDCard.js');
const ID_StatusState = require('./states/ID_Status.js');
const CancelState = require('./states/Cancel.js');
const RemainingTANState = require('./states/RemainingTan.js');
const TranscriptTypeState = require('./states/Transcript.js');
const ThesisSubmissionState = require('./states/ThesisSubmission.js');
const ExamSicknessState = require('./states/ExamSickness.js');

app.setHandler({
  // ------------------------------------------------------------------
  // External states
  // ------------------------------------------------------------------
  EndState,
  ID_StatusState,
  IDCardState,
  CancelState,
  RemainingTANState,
  TranscriptTypeState,
  ThesisSubmissionState,
  ExamSicknessState,
  
  // ------------------------------------------------------------------
  // Initial Topics
  // ------------------------------------------------------------------

  Unhandled() {
    return this.ask("Sorry i did not understand you. Can you please rephrase your question? ",
      "I don't know what to do. Please rephrase your question");
  },

  async NEW_SESSION() {
    try {
      this.$session.$data.id = this.$request.originalDetectIntentRequest.payload.data.from.id
      this.$session.$data.cred_name = this.$request.originalDetectIntentRequest.payload.data.from.first_name
      if (this.$request.originalDetectIntentRequest.payload.data.from.last_name) {
        this.$session.$data.cred_name += " " + this.$request.originalDetectIntentRequest.payload.data.from.last_name
      }
    } catch (error) {
      this.$session.$data.id = this.$request.originalDetectIntentRequest.payload.data.callback_query.from.id
      this.$session.$data.cred_name = this.$request.originalDetectIntentRequest.payload.data.callback_query.from.first_name
      if (this.$request.originalDetectIntentRequest.payload.data.callback_query.from.last_name) {
        this.$session.$data.cred_name += " " + this.$request.originalDetectIntentRequest.payload.data.callback_query.from.last_name
      }
    }

    try {
      const doc = await userRef.doc("" + this.$session.$data.id).get();
      var dict_user = Object();
      if (!doc.exists) {
          console.log('No such document!');
          userRef.doc("" + this.$session.$data.id).set({
            name: this.$session.$data.cred_name,  
            matr_num: "",
            mail: "",
            city: "",
            address: "",
            zipcode: ""
          })
      } else {
          console.log('Document data:', doc.data());
          dict_user = doc.data()
          if (dict_user["name"]) {
            this.$session.$data.cred_name = dict_user["name"]
          }
          if (dict_user["matr_num"]) {
            this.$session.$data.cred_matr_num = dict_user["matr_num"]
          }
          if (dict_user["mail"]) {
            this.$session.$data.cred_mail = dict_user["mail"]
          }
          if (dict_user["city"]) {
            this.$session.$data.cred_city = dict_user["city"]
          }
          if (dict_user["address"]) {
            this.$session.$data.cred_street = dict_user["address"]
          }
          if (dict_user["zipcode"]) {
            this.$session.$data.cred_zipcode = dict_user["zipcode"]
          }
      }
    } catch (e) {
      userRef.doc("" + this.$session.$data.id).set({
        name: this.$session.$data.cred_name,
      })
    }
  },

  async InitialIntent() {
    this.removeState();
    this.$session.$data._JOVO_STATE_= null
    this.$session.$data.id = this.$request.originalDetectIntentRequest.payload.data.from.id
    this.$session.$data.cred_name = this.$request.originalDetectIntentRequest.payload.data.from.first_name
    if (this.$request.originalDetectIntentRequest.payload.data.from.last_name) {
      this.$session.$data.cred_name += " " + this.$request.originalDetectIntentRequest.payload.data.from.last_name
    }
    try {
      const doc = await userRef.doc("" + this.$session.$data.id).get();
      var dict_user = Object();
      if (!doc.exists) {
          console.log('No such document!');
          userRef.doc("" + this.$session.$data.id).set({
            name: this.$session.$data.cred_name,  
            matr_num: "",
            mail: "",
            city: "",
            address: "",
            zipcode: ""
          })
          this.followUpState(null)
          .ask("Hello " + this.$session.$data.cred_name + ". Welcome to the Chatbot for the Campus-Service-Center. I am looking forward to answering your questions related to the CSC. " +
          "If you need an overview over the available topics, just type in help. " );
      } else {
          console.log('Document data:', doc.data());
          dict_user = doc.data()
          if (dict_user["name"]) {
            this.$session.$data.cred_name = dict_user["name"]
          }
          if (dict_user["matr_num"]) {
            this.$session.$data.cred_matr_num = dict_user["matr_num"]
          }
          if (dict_user["mail"]) {
            this.$session.$data.cred_mail = dict_user["mail"]
          }
          if (dict_user["city"]) {
            this.$session.$data.cred_city = dict_user["city"]
          }
          if (dict_user["address"]) {
            this.$session.$data.cred_street = dict_user["address"]
          }
          if (dict_user["zipcode"]) {
            this.$session.$data.cred_zipcode = dict_user["zipcode"]
          }
          this.followUpState(null)
          .ask("Hello " + this.$session.$data.cred_name + ". Welcome back to the Chatbot for the Campus-Service-Center. " + "What can I help you with this time? " +
          "If you need an overview over the available topics, just type in help. " );

      }
    } catch (e) {
      userRef.doc("" + this.$session.$data.id).set({
        name: this.$session.$data.cred_name,
      })
      this.followUpState(null)
        .ask("Hello " + this.$session.$data.cred_name + ". Welcome to the Chatbot for the Campus-Service-Center. I am looking forward to answer your questions related to the CSC. " +
        "If you need an overview over the available topics, just type in help. " );
      }
  },


  // ------------------------------------------------------------------
  // General questions
  // ------------------------------------------------------------------

  async ContactIntent() {
    var location = await this.getInput("location").key
    if (location === "examination office") {
      this.ask("Here is the contact for the FIN examination office:" + " \n" +
      "Otto-von-Guericke-Universität Magdeburg" + " \n" +
      "Gebäude 29, Raum 101/102" + " \n" +
      "Fax: +49 391 6711249" + " \n" +
      "E-mail: pa@cs.uni-magdeburg.de")
    }
    else {
      this.ask("Here is the contact for the CSC:" + " \n" +
      "Otto-von-Guericke-Universität Magdeburg" + " \n" +
      "Universitätspl. 2, 39106 Magdeburg" + " \n" +
      "Telefon: 0391 6750000" + " \n" +
      "E-mail: servicecenter@ovgu.de " + " \n" +
      "Post office box: Postfach 4120.")
    }
  },

  StudyProgramIntent() {
    this.ask("You are in luck. There is another chatbot specifically made for the topic of study programs." +
      "You can find it here: ") //Link to Matthias chatbot
  },

  async HelpIntent() {
    var problem = await this.getInput("ProblemEntity").key
    console.log(problem)
    if (problem === "personal data") {   
      this.showSimpleCard('Jovo', 'https://myovgu.ovgu.de/qisserver/pages/cs/sys/portal/hisinoneStartPage.faces?chco=y')
      .ask("You can make changes to your personal data under the following link: " + "\n"+
      "https://myovgu.ovgu.de/qisserver/pages/cs/sys/portal/hisinoneStartPage.faces?chco=y")

    }
    else {
      this.ask("You can typically get help from us at the CSC or from your examination office.")
    }
  },

  async OpenTimingsIntent() {
    //Get the inputs that were present in the previous request.
    //Used for contextual requests.
    var prevInputs = this.$session.$data;
    var prevLoc = prevInputs.prev_loc;
    var prevDay = prevInputs.prev_dt;

    var givenLoc = this.$inputs.location.key ? this.$inputs.location.key : prevLoc;
    //If the location is not given in the request and not present in the previous ones too
    //Ask for location explicitly
    if (!givenLoc) {
      givenLoc = "campus service center"
    }
    // Referencing the database opening hours
    const locationRef = db.collection("office_infos").doc("" + givenLoc);
    const doc = await locationRef.get();
    if (!doc.exists) {
      console.log('No such document!');
    } else {
      console.log('Document data:', doc.data());
    }
    var givenDay = this.$inputs.datetime.key ? this.$inputs.datetime.key : prevDay;
    if (typeof givenDay === 'object' && givenDay !== null) {
      givenDay = this.$inputs.datetime.key.date_time;
    }
    
    var giventime = this.getInput('datetime').value
    console.log(giventime)

    if (!givenDay) {
      //String for general opening hours
      var speech = "The general opening hours are:".concat("  \n")
      var dict_open_hours = Object();

      dict_open_hours = doc.data()
      console.log(dict_open_hours);
      for (const [key, value] of Object.entries(dict_open_hours)) {
        var timings = value;
        timings = timings.split(",").join(" and ").split("-").join(" to ");
        console.log(key, timings);
        speech = speech.concat(`On ${getDayName(key)}: ${timings} o'clock.`).concat("  \n");
      }
      console.log(speech)
      this.ask(speech);
    } else {
      var givenDate = givenDay;
      givenDay = new Date(givenDate).getDay();

      //Save the current location and date so that next requests can use this info
      this.$session.$data.prev_loc = givenLoc;
      this.$session.$data.prev_dt = givenDate;

      var response = await getTimings(givenLoc, givenDate);

      var timings = response[0];
      var exception = response[1];

      if (exception) {
        var exceptionDates = exception.dates.split(",")
        if (exceptionDates.length == 2) {
          this.ask([
            `Unfortunately the ${toTitleCase(givenLoc)} is closed from ${exceptionDates[0]} to ${exceptionDates[1]} due to ${exception.reason}`
          ])
        } else {
          this.ask([
            `Unfortunately the ${toTitleCase(givenLoc)} is closed on ${exceptionDates[0]} due to ${exception.reason}`
          ])
        }
        return;
      }

      if (!timings) {
        this.ask([
          `The ${toTitleCase(givenLoc)} is closed on ${getDayName(givenDay)}`,
          `On ${getDayName(givenDay)}, the ${toTitleCase(givenLoc)} will remain closed`
        ])
        return;
      }

      timings = timings.split(",").join(" and ").split("-").join(" to ");

      this.ask([
        `The ${toTitleCase(givenLoc)} on ${getDayName(givenDay)} will be open from ${timings} o' clock.`,
        `On ${getDayName(givenDay)}, the ${toTitleCase(givenLoc)} will operate from ${timings} o' clock.`,
        `Yes, from ${timings}`
      ]);
    }
  },

  // ------------------------------------------------------------------
  // Credential queries
  // ------------------------------------------------------------------

  async CredentialIntent() {
    var prevname = this.$session.$data.cred_name
    var prevmatr_num = this.$session.$data.cred_matr_num;
    var prevmail = this.$session.$data.cred_mail;

    var name = await this.getInput('name').value ? this.getInput('name').value : prevname;
    if (typeof name === 'object' && name !== null) {
        name = this.getInput('name').value.name;
    }

    var matr_num = this.getInput('matric').value ? this.getInput('matric').value : prevmatr_num;
    var mail = this.getInput('mail').value ? this.getInput('mail').value : prevmail;

    if (name.includes("@")) {
      mail = name
      name = prevname
    }

    if (!name && !matr_num && !mail) {
      this.ask("Please provide your name and student number." +
        "For the authentication we also need your student mail.")
    }
    console.log(name)
    //check name
    if (name && name != "undefined") { //Name split for email address
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

    this.$session.$data.cred_name = name;

    //check matriculation number
    if (matr_num && matr_num != "undefined") {
      if (matr_num.toString().length != 6) {
          this.ask("Please re-check the matriculation number you've entered");
      } else {
          this.$session.$data.cred_matr_num = matr_num;
      }
    }
    else {
        this.ask("You can also provide your student number. This speeds up later inquiries. ");
        return;
    }

    this.$session.$data.cred_matr_num = matr_num;

    //Email validation process - OvGU mail contains first and surname
    if (mail && mail != "undefined") {
      var strMail = JSON.stringify(mail)
      if (!strMail.includes("st.ovgu.de")) {
        this.ask("The mail you provided is not your uni mail. Please provide your uni mail")
        return;
      } else if (strMail.toLowerCase().includes(firstName.toLowerCase()) && strMail.toLowerCase().includes(surName.toLowerCase())) {
        this.$session.$data.cred_mail = mail;
      } else {
        this.ask("It seems the user mail you provided does not match your credentials. " +
          "Please check again.")
        console.log(surName)
        console.log(firstName)
        console.log(mail)
        return;
      }
    } else {
      this.ask("You can also provide your student mail for authentication reasons.");
      return;
    }

    if (name && matr_num && mail) {
      userRef.doc("" + this.$session.$data.id).update({
        name: this.$session.$data.cred_name,
        matr_num: this.$session.$data.cred_matr_num,
        mail: this.$session.$data.cred_mail,
      })
    }
    this.ask(
      "Thanks for your information. I will save the following credentials:" + "\n" +
      "name: " + this.$session.$data.cred_name + "\n" +
      "student number: " + this.$session.$data.cred_matr_num + "\n" +
      "E-mail: " + this.$session.$data.cred_mail + "\n")
  },

  //Intent to check what data is stored about the user
  CredentialControlIntent() {
    var name = "" + this.$session.$data.cred_name
    var matr_num = this.$session.$data.cred_matr_num
    var mail = "" + this.$session.$data.cred_mail
    var city = "" + this.$session.$data.cred_city
    var address = "" + this.$session.$data.cred_street
    var zipcode = this.$session.$data.cred_zipcode

    var speech = ""
    if (name && name != "undefined") {
      speech += "Your name is " + name + "\n" 
    }
    if (matr_num && matr_num != "undefined") {
      speech +=  "Your student number is " + matr_num + "\n" 
    }
    if (mail && mail != "undefined" ) {
      speech += "Your mail is " + mail + "\n" 
    }
    if ((address && address != "undefined") || (zipcode && zipcode !="undefined") || (city && city != "undefined")) {
      console.log(city + "  " + address + "  "+ zipcode)
      speech += "Your address is:" + "\n" 
      if (address && address != "undefined") {
        speech += address + "\n" 
      }
      if (zipcode && zipcode !="undefined") {
        speech += zipcode + "\n" 
      }
      if (city && city != "undefined") {
        speech += city + "\n" 
      }
    }
    if (speech == "") {
      this.ask("Sorry we dont have any information about you. Feel free to input your credentials.")
    }
    else {
      this.ask(speech)
    }
  },

  async UserDataIntent() { //work in progress
    var save_or_del = await this.getInput('UserDataEntity').key;
    if (save_or_del === "save") {
      this.ask("Ok we will save your user data")
      //General Information
      if (this.$session.$data.cred_name && this.$session.$data.cred_matr_num) {
        userRef.doc("" + this.$session.$data.id).update({
          name: this.$session.$data.cred_name,
          matr_num: this.$session.$data.cred_matr_num,
        });
      }
      //Address credentials
      if (city && zipcode && address) {
        userRef.doc("" + this.$session.$data.id).update({
          city: this.$session.$data.cred_city,
          zipcode: this.$session.$data.cred_zipcode,
          address: this.$session.$data.cred_street,
        });
      }
    } else if (save_or_del === "delete") {
      this.ask("Ok we will delete your user data.")
      const doc = await userRef.doc("" + this.$session.$data.id).get();
      if (doc.exists) {
        const res = await userRef.doc("" + this.$session.$data.id).delete()
      }
      this.$session.$data.cred_matr_num = ""
      this.$session.$data.cred_name = ""
      this.$session.$data.cred_mail = ""
      this.$session.$data.cred_city = ""
      this.$session.$data.cred_zipcode = ""
      this.$session.$data.cred_street = ""
    }
  },
  
  // ------------------------------------------------------------------
  // Another Question Intents
  // ------------------------------------------------------------------
  YesIntent() {
    this.followUpState(null)
      .ask("Please ask away. If you want to see an overview of the available topics type in help.")
  },
  NoIntent() {
    this.followUpState("CancelState.UserDataState").ask("Ok. Should we delete your user data before you go?")
  },


  // ------------------------------------------------------------------
  // Cancel Configuration
  // ------------------------------------------------------------------

  async CancelIntent() {
    var CancelOrEnd = await this.getInput('CancelEndEntity').key;
    this.$session.$data.prevstate = this.getState()
    if (!this.$session.$data.delete_reached || !this.$session.$data.delete_reached) {
      if (CancelOrEnd == "cancel") {
        this.followUpState("CancelState").ask("The current inquiry will be canceled. Is this ok for you?")
      } else if (CancelOrEnd == "end") {
        this.followUpState("CancelState").ask("The current inquiry will be canceled and the conversation will end. Is this ok for you?")
      }
      else {
        this.followUpState("CancelState").ask("Are you sure that you want to cancel your current inquiry?")
      }
    }
    else {
      this.tell("Thanks for talking with me. Goodbye.")
    }
   
  },


  // ------------------------------------------------------------------
  // Status questions
  // ------------------------------------------------------------------

  async StatusIntent() {

    var status_problem = await this.getInput('ProblemEntity').key;
    var prevname = this.$session.$data.cred_name
    var prevmatr_num = this.$session.$data.cred_matr_num;

    var name = await this.getInput('name').value ? this.getInput('name').value : prevname;
    var matr_num = await this.getInput('matric').value ? this.getInput('matric').value : prevmatr_num;

    //idea: depending on the given problem, the bot responds with an info about the current status
    if (status_problem === "id card") {
      if (name && matr_num) {
        try {
          const doc = await ID_status_Ref.doc("" + matr_num).get();
          console.log(doc.data())
          if (!doc.exists) {
            console.log('No such document!');
            this.ask("Thanks for your information. Unfortunately we have no information on the status of your card.")
          } else {
            console.log('Document data:', doc.data())
            var user = doc.data()
            console.log("success")

            if ((user["status"]) === 1) { // missing confirmation
              this.followUpState("IDCardState.NewIDCardState.CredentialState.ConfirmationState")
                .ask("You did not confirm the ID-card inquiry yet. This involves confirming the handling fee. Would you like to confirm now?" +
                  "(This is only a test version, so no strings attached)") //call to confirmation state
            } else if ((user["status"]) === 2) { //confirmed inquiry //manual increase - CSC interaction necessary
              this.ask("We have received your inquiry about your id card and are currently in the process of making you a new one. Please wait a while longer.")
              ID_status_Ref.doc("" + this.$session.$data.cred_matr_num).update({
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
      } else {
        this.followUpState("ID_StatusState")
          .ask("Please input your name and student number so that we can check on your cards status.")
      }
    }
  },

  // ------------------------------------------------------------------
  // Form questions
  // ------------------------------------------------------------------

  async FormIntent() {
    console.log('Platform Type:', this.getPlatformType());
    var form = await this.getInput('FormEntity').key;
    if (form) {
      const FormRef = db.collection('Forms').doc('FIN');
      const doc = await FormRef.get();
      if (!doc.exists) {
        console.log('No such document!');
        this.ask("No forms available.")
      } else {
        var dict_forms = Object()
        dict_forms = doc.data()
        for (const [key, value] of Object.entries(dict_forms)) {
          var FormName = ("" + key)
          if (FormName.includes(form)) {
            var link = ("" + value);
          }
        }
        this.ask("The link to " + form + " is: " + "\n" + link)
      }
    } else {
      //this.ask("Here you can find an overview of the available forms: " + '\n' +
      //"https://www.inf.ovgu.de/Studium/W%C3%A4hrend+des+Studiums/Pr%C3%BCfungsamt/Formulare.html")
      
    } 
  },
  // ------------------------------------------------------------------
  // Transcript questions
  // ------------------------------------------------------------------

  GetTranscriptsIntent() {
    let tr_type = this.$inputs.transcript_type.key

    if (tr_type === "physical") {
      this.toStateIntent("TranscriptTypeState", 'PhysicalIntent');
      return;
    } else if (tr_type === "digital") {
      this.toStateIntent('TranscriptTypeState', "DigitalIntent");
      return;
    }

    this.$speech.addText('Do you want physical transcript documents or digital ones?');
    this.$reprompt.addText('Please answer with either Physical or Digital');

    if (this.isGoogleAction()) {
      this.$googleAction.showSuggestionChips(['Physical', 'Digital']);
    }
    this.followUpState('TranscriptTypeState')
      .ask(this.$speech, this.$reprompt);
  },



  // ------------------------------------------------------------------
  // TAN questions
  // ------------------------------------------------------------------

  GenerateTANIntent() {
    this.$speech.addText('Do you have at least 2 TANs with you?');
    this.$reprompt.addText('Please answer with either yes or no');

    if (this.isGoogleAction()) {
      this.$googleAction.showSuggestionChips(['Yes', 'No']);
    }
    this.followUpState('RemainingTANState')
      .ask(this.$speech, this.$reprompt);
  },

  

  // ------------------------------------------------------------------
  // ID questions
  // ------------------------------------------------------------------

  async LostNewIDIntent() {
    var problem = await this.getInput('ProblemEntity').key;
    var state = await this.getInput('LostNewEntity').key;
    var name = await this.$session.$data.cred_name
    var matr_num = await this.$session.$data.cred_matr_num
    var mail = await this.$session.$data.cred_mail
    //Credentials already there
    if (problem === "id card" && state === "new" && name && name != "undefined" && matr_num && matr_num != "undefined" && mail && mail != "undefined") {
      var speech = "Ok. Lets make you a new id card. "
      speech +=  
        "First we have to check your credentials again. Are the following credentials correct?" + "\n" +
        "Name: " + this.$session.$data.cred_name + "\n" +
        "Student number: " + this.$session.$data.cred_matr_num + "\n" +
        "E-mail: " + this.$session.$data.cred_mail + "\n" +
        "Is this correct?"
        this.followUpState("IDCardState.NewIDCardState.CredentialState").ask(speech)      
    }
    //No credentials and new card
    else if (problem === "id card" && state === "new") {
      this.followUpState("IDCardState.NewIDCardState.CredentialState")
        .ask("In order to make a new card for you, please provide your name and student number. We also need your mail for verification purposes.",
        "We can help you make a new id card. Please provide your name and student number. We also need your mail for verification purposes.");
    }
    else if (problem === "id card" && state === "lost") {
      this.followUpState("IDCardState")
      .ask("You have come to the right place. Do you want us to make a new card directly or should we first check the Lost and Found Box, in case someone found your old card? ")
    }
    //New credentials and check for lost things
    else if (problem === "id card") {
      this.followUpState("IDCardState")
        .ask("We can help you if you lost your id card or need a new one. Making a new card will cost 10 Euros. " + "\n" + 
        "Are you interested in doing that? ")
    } else {
      this.ask("Please repeat your question")
    }
  },

  CostIDCardIntent() {
    this.ask("A new ID card costs 10 Euros")
  },


  // ------------------------------------------------------------------
  // Exam Sickness questions
  // ------------------------------------------------------------------

  ExamSicknessIntent() {
    this.followUpState("ExamSicknessState")
    /*  .ask("Immediately visit a doctor that will verify your sickness on the necessary medical certificate." +
        'Filling out the form "Request to withdraw from examination" is mandatory in order to withdraw from examinations.' +
        "Did you already go to the doctor and got your medical certificate?") */
  },

  //Better as part of ExamSicknessIntent
  /*ThesisSicknessIntent() {
    this.ask("Immediately submit a medical certificate to your faculty’s examination office (please also refer to the information:" +
    "inability to write my seminar paper/dissertation/thesis). Please note that your examination regulations are always prevailing."+
    "The writing period will be extended according to your proved sickness absence. The adapted submission date will be displayed on LSF/HisQis.")
  },*/


  FilledOutFormIntent() {
    this.followUpState("ExamSicknessState")
      .ask("Just confirming: You have both the medical certificate and the withdrawal request filled out?")
  },


  // ------------------------------------------------------------------
  // Location Questions
  // ------------------------------------------------------------------
  LocationIntent() {
    var givenLoc = this.$inputs.location.key;

    if (!givenLoc) {
      this.ask("Please provide a location to check - For example, Mensa, or any of the halls");
      return;
    }

    if (givenLoc === 'hall') {
      var hall_id = this.$inputs.hall_id.key;
      console.log('hall id is ', hall_id);
      if (!hall_id) {
        this.ask("Please give a hall/Hörsaal number to check");
        return;
      }

      let msg = ({
        1: "Hörsaal 1 is located in Gebäude 26, beside mensa.",
        2: "Hörsaal 2 is in Gebäude 22",
        3: 'Gebäude 50',
        4: 'Hörsaal 4 is in Gebäude 05, beside the Campus Service Center',
        5: "Hörsaal 5 is located in Gebäude 16",
        6: "Hörsaal 6 is in Gebäude 44"
      })[hall_id];

      //Horsaal doesn't exist
      if (msg == null) {
        msg = "That lecture hall doesn't exist. Halls are numbered from 1 to 6";
      }

      msg += ". Here's the campus map " + "https://www.ovgu.de/unimagdeburg_media/Universit%C3%A4t/Dokumente+und+Formulare/CampusFINDER-p-32092.pdf";
      this.ask(msg);
    } else if (givenLoc === 'mensa') {
      this.ask([
        `You can find mensa in Gebäude 26.1.`,
        `Mensa is in Building 26.1`
      ]);
    } else {
      //this.ask([
      //  "You can find the entire campus map here. " + "\n" +
      //  "https://www.ovgu.de/unimagdeburg_media/Universit%C3%A4t/Dokumente+und+Formulare/CampusFINDER-p-32092.pdf"]);
    }
  },

  RepeatIntent() {
    this.repeat();
  },

  // ------------------------------------------------------------------
  // Thesis and Document submission
  // ------------------------------------------------------------------
  async ThesisSubmissionIntent() {
    var handinmethod = this.getInput("" + 'PickUpMethodEntity').key
    const exceptionsDoc = await db.collection("office_infos").doc("exceptions").get();

    var exception = exceptionsDoc.data()
    var lockdown = exception['Lockdown_state']
    if (handinmethod === "physical") {
      if (lockdown === "true") {
        this.followUpState("ThesisSubmissionState")
        this.ask("The thesis submission is currently not available in person." +
          "Would you like to submit it per post instead?")
      } else {
        this.followUpState("ThesisSubmissionState.PhysicalState")
          .ask("Alright. Your thesis can be handed in at the examination offices, " +
            "in the Campus Service Center or to the information and security service office of the Otto-von-Guericke-University Magdeburg (in building 09). " +
            "Do you want to bring it to us here in the CSC?")
      }

    }
    if (handinmethod === "digital") {
      this.followUpState("ThesisSubmissionState")
        .ask("I am sorry, your thesis has to be handed in as a physical copy. Please choose if you want to hand it in personally or send it postally.")
    }
    if (handinmethod === "post") {
      this.followUpState("ThesisSubmissionState.PostState")
        .ask("Alright. Do you want to send it to the CSC or to your faculty's examination office?")
    }
    if (handinmethod === "") {
      this.followUpState("ThesisSubmissionState")
    //    .ask("We can help you with this. Would you like to hand it in personally or per post?")
    }
    console.log(this.$response)
  },



});
async function getTimings(location, date) {
  const timingsDoc = await db.collection("office_infos").doc("" + location).get();
  const exceptionsDoc = await db.collection("office_infos").doc("exceptions").get();

  let givenDate = new Date(date);
  let day = givenDate.getDay();

  var timings = await timingsDoc.data()[day];

  //Timings don't exist for the given location for the given day
  //Usually means the office is closed on that day
  if (!timings) {
    return [timings, null];
  }

  //Exceptions can be ranged (e.g. lockdown) or single day (e.g. holidays)
  //Check if the offices are closed on the given day
  var exceptions = await exceptionsDoc.data();
  exceptions = Object.keys(exceptions).map(function (key, index) {
    return {
      "reason": key,
      "dates": exceptions[key]
    };
  });

  for (let i = 0; i < exceptions.length; i++) {
    let dates = exceptions[i].dates.split(",");
    //TODO: Maybe a generalised way to check ranged and singular exceptions can be found
    if (dates.length == 2) {
      let fromDate = new Date(dates[0]);
      let toDate = new Date(dates[1]);

      if (givenDate.getTime() >= fromDate.getTime() && givenDate.getTime() <= toDate.getTime()) {
        //Offices are closed and the exception is a ranged one
        return [timings, exceptions[i]];
      }
    } else {
      let exDate = new Date(dates[0]);

      if (exDate.toISOString().slice(0, 10) === givenDate.toISOString().slice(0, 10)) {
        //Offices are closed and the exception is a singular one
        return [timings, exceptions[i]];
      }
    }
  }

  //The given dates are not exempt, the offices will open as usual
  return [timings, null];
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

function getDayName(day) {
  console.log(day)
  switch (day) {
    case 0:
      return "Sunday";
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    default:
      return "Saturday";
    case "0":
      return "Sunday";
    case "1":
      return "Monday";
    case "2":
      return "Tuesday";
    case "3":
      return "Wednesday";
    case "4":
      return "Thursday";
    case "5":
      return "Friday";
  }
}

module.exports = {
  app
};