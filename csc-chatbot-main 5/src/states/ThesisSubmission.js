const admin = require('firebase-admin');

const db = admin.firestore();
const ID_status_Ref = db.collection('ID_card_requests') //for database call in ID card status requests
const userRef = db.collection('users'); //for database call in LostID-Topic


module.exports = {

    async PhysicalIntent() {
        const exceptionsDoc = await db.collection("office_infos").doc("exceptions").get();
        var exception = exceptionsDoc.data()
        var lockdown = exception['Lockdown_state']
        console.log(lockdown)
        if (lockdown === "true") {
            this.followUpState("ThesisSubmissionState")
            this.ask("The thesis submission is currently not available in person. " +
                "Would you like to submit it per post instead?")
        } else {
            this.followUpState("ThesisSubmissionState.PhysicalState")
                .ask("Alright. Your thesis can be handed in at the examination offices, " +
                    "in the Campus Service Center or to the information and security service office of the Otto-von-Guericke-University Magdeburg (in building 09). " +
                    "Do you want to bring it to us here in the CSC?")
        }

    },
    DigitalIntent() {
        this.followUpState("ThesisSubmissionState")
            .ask("I am sorry, your thesis has to be handed in as a physical copy. Please choose if you want to hand it in personally or send it postally.")
    },
    
    PostIntent() {
        this.followUpState("ThesisSubmissionState.PostState")
            .ask("Alright. Do you want to send it to the CSC or to your faculty's examination office?")
    },


    //For Lockdown case - if submission per post is also fine
    YesIntent() {
        this.followUpState("ThesisSubmissionState.PostState")
            .ask("Ok. Would you like to send to the campus service center or your examination office?")
    },

    NoIntent() {
        this.followUpState(null)
            .ask("In this case your only choice would be to submit your documents in the red post box in front of building 09. " +
                "All documents will be forwarded to the relevant department by internal post. " +
                "Is there anything else we can help you with?")
    },

    PhysicalState: {
        YesIntent() {
            this.followUpState("ExamSicknessState.SubmitState.PhysicalState.CSCState")
                .ask("Great. Could you already tell us at what day you want to come by?")
        },

        NoIntent() {
            this.followUpState(null)
                .ask("Please reach out to your examination office in this case. Anything else you want to ask us?")
        },

        CSCState: {
            async OpenTimingsIntent() {
                //Get the inputs that were present in the previous request.
                //Used for contextual requests.

                var prevInputs = this.$session.$data;
                var prevDay = prevInputs.prev_dt;

                var givenLoc = "exam office" //location is logged in for exam sickness

                //Database reference
                const locationRef = db.collection("office_infos").doc("" + givenLoc);
                const doc = await locationRef.get();
                if (!doc.exists) {
                    console.log('No such document!');
                } else {
                    console.log('Document data:', doc.data());
                }

                var givenDay = this.getInput('datetime').key ? this.getInput('datetime').key : prevDay;
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
                    this.ask(speech.concat("Could you further clarify when you want to come by?"));
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
                                `Unfortunately the ${toTitleCase(givenLoc)} is closed from ${exceptionDates[0]} to ${exceptionDates[1]} due to ${exception.reason}. Please choose another time.`
                            ])
                        } else {
                            this.ask([
                                `Unfortunately the ${toTitleCase(givenLoc)} is closed on ${exceptionDates[0]} due to ${exception.reason}. Please choose another time.`
                            ])
                        }
                        return;
                    }

                    if (!timings) {
                        this.ask([
                            `the ${toTitleCase(givenLoc)} is closed on ${getDayName(givenDay)}. Please come by another time.`,
                            `On ${getDayName(givenDay)}, the ${toTitleCase(givenLoc)} will remain closed. Please come by another time.`
                        ])
                        return;
                    }

                    timings = timings.split(",").join(" and ").split("-").join(" to ");

                    this.ask([
                        `the ${toTitleCase(givenLoc)} on ${getDayName(givenDay)} will be open from ${timings} o' clock. Is this ok for you?`,
                        `On ${getDayName(givenDay)}, the ${toTitleCase(givenLoc)} will operate from ${timings} o' clock. Is this ok for you?`,
                        `Yes, from ${timings}. Does this work with your schedule?`
                    ]);
                }
            },

            YesIntent() {
                this.followUpState("ExamSicknessState.SubmitState.PhysicalState.AppointmentState")
                    .ask("Great. Should we save your request and date for when you come by?")
            },

            NoIntent() {
                this.ask("No problem. Please tell us when you would rather come by. If you have all the info you need, you can also cancel this request or end the chat.")
            },

            AppointmentState: {
                YesIntent() {
                    this.followUpState(null)
                        .ask("Great we look forward to meeting you on " + this.$session.$data.prev_dt +
                            ". The date is not binding, so no worries if you can't make it. Is there anything else we can help you with?")
                },
                NoIntent() {
                    this.followUpState(null)
                        .ask("Ok no problem, we won't save your info. Do you want to ask another question?")
                }
            }
        },
    },

    PostState: {    
        async OpenTimingsIntent() {
            var location = await this.getInput("location").key
            if (location === "examination office") {
              this.followUpState(null)
                .ask("Here is the contact information for the FIN examination office:" + " \n" +
              "Otto-von-Guericke-Universität Magdeburg" + " \n" +
              "Gebäude 29, Raum 101/102" + " \n" +
              "Fax: +49 391 6711249" + " \n" +
              "E-mail: pa@cs.uni-magdeburg.de")
            }
            else {
              this.followUpState(null)
              .ask("Here is the contact information for the CSC:" + " \n" +
              "Otto-von-Guericke-Universität Magdeburg" + " \n" +
              "Universitätspl. 2, 39106 Magdeburg" + " \n" +
              "Telefon: 0391 6750000" + " \n" +
              "E-mail: servicecenter@ovgu.de " + " \n" +
              "Post office box: Postfach 4120.")
            }
        },
    },

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