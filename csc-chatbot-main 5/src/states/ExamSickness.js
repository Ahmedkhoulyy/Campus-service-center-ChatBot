const admin = require('firebase-admin');


const db = admin.firestore();
const ID_status_Ref = db.collection('ID_card_requests') //for database call in ID card status requests
const userRef = db.collection('users'); //for database call in LostID-Topic



module.exports = {

    FormIntent() {
        this.ask("You can get the medical certificate here: https://www.servicecenter.ovgu.de/csc_media/Dokumente+Download/%C3%A4rztliches+Attest_Version2017_2_formular-p-692.pdf" +
            "\n" + "The withdrawal certificate can be found here: https://www.fww.ovgu.de/fww_media/Pruefungsamt/Dokumente/Antr%C3%A4ge+und+Formulare/R%C3%BCcktritt+von+angemeldeten+Pr%C3%BCfungsleistunge/Antrag+auf+R%C3%BCcktritt+von+Pr%C3%BCfungen_Dt_Engl-p-6004.pdf ")
    },

    YesIntent() {
        this.followUpState("ExamSicknessState.SubmitState")
            .ask("Great. You can submit it to us here at the CSC. We will forward it to your examination office. Do you prefer to hand it in personally or postally?")
    },

    NoIntent() {
        this.followUpState(null)
            .ask("No problem. Please come back when you have the filled out documents. Anything else we can help you with?")
    },

    SubmitState: {
        PhysicalIntent() {
            this.followUpState("ExamSicknessState.SubmitState.PhysicalState")
                .ask("So you want to come by yourself. Could you already tell us at what day you want to come by?",
                "Ok, great. Could you tell us when you want to come by?")
        },

        PhysicalState: {
          async OpenTimingsIntent() {
            var givenLoc = "exam office" //location is logged

            //Database reference
            const locationRef = db.collection("office_infos").doc("" + givenLoc);
            const doc = await locationRef.get();

            var givenDay = this.getInput('datetime').key
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
                this.$session.$data.idpickup_date = givenDate;
                givenDay = new Date(givenDate).getDay();

                //Save the current location and date so that next requests can use this info

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
                        `The ${toTitleCase(givenLoc)} is closed on ${formatDate(new Date(givenDate))}. Please come by another time.`,
                        `On ${formatDate(new Date(givenDate))}, the ${toTitleCase(givenLoc)} will remain closed. Please come by another time.`
                    ])
                    return;
                }

                timings = timings.split(",").join(" and ").split("-").join(" to ");

                this.ask([
                    `The ${toTitleCase(givenLoc)} on ${formatDate(new Date(givenDate))} will be open from ${timings} o' clock. Is this ok for you?`,
                    `On ${formatDate(new Date(givenDate))}, The ${toTitleCase(givenLoc)} will operate from ${timings} o' clock. Is this ok for you?`
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

        DigitalIntent() {
            this.followUpState(null)
                .ask("I am sorry, you cant send it digitally. We need the original documents." + "\n" + "\n" +
                    "We hope this was helpful. Do you have another question?")
        },

        PostIntent() {
            this.followUpState(null)
                .ask("Alright. Please send it to" + "\n" +
                    "Otto-von-Guericke-Universität" + "\n" +
                    "Campus Service Center" + "\n" +
                    "Postfach 4120" + "\n" +
                    "39106 Magdeburg" + "\n" + "\n" +
                    "We will deal with your documents once they arive and hope we were able to help you. Do you have another question?")
        },
    }

}

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

function formatDate(date) {
  return date.toDateString();
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