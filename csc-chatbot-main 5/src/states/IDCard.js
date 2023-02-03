const admin = require('firebase-admin');


const db = admin.firestore();
const ID_status_Ref = db.collection('ID_card_requests') //for database call in ID card status requests
const userRef = db.collection('users'); //for database call in LostID-Topic


module.exports = {

    async LostNewIDIntent() {
        var state = await this.getInput('LostNewEntity').key;
        if (state === "lost") {
            this.followUpState("IDCardState.LostIDCardState")
                .ask("In order to check for your card, please provide your full name, your student number, and your university email");
        } else if (state === "new") {
            this.followUpState("IDCardState.NewIDCardState.CredentialState")
                .ask("In order to make a new card for you, please provide your full name and student number. " +
                    "We also need your student mail for verification purposes.");
        } else {
            this.ask("Please decide if you want a new card or if we should check the lost and found box.")
        }
    },

    YesIntent() {
        this.ask("Great. Do you want us to make a new card directly or should we first check the Lost and Found Box?")
    },

    NoIntent() {
        this.followUpState(null)
            .ask("No problem. Anything else we can help you with?")
    },

    ////////// Lost ID State //////////
    LostIDCardState: {
        async CredentialIntent() {
            var prevname = this.$session.$data.cred_name
            var prevmatr_num = this.$session.$data.cred_matr_num;

            var name = await this.getInput('name').value ? this.getInput('name').value : prevname;
            if (typeof name === 'object' && name !== null) {
                name = this.getInput('name').value.name;
            }
            var matr_num = this.getInput('matric').value ? this.getInput('matric').value : prevmatr_num;

            if (!name && !matr_num) {
                this.ask("In order to check for your card, please provide your fullname and student number.")
            }

            //check name
            if (name) { //Name split for email address
                var nameArray = JSON.stringify(name).split(" ");
                if (nameArray.length < 2) {
                    this.ask("Please provide your firstname and surname.")
                    return
                } else {
                    var firstName = nameArray[0].replace('"', "")
                    var surName = nameArray[1].replace('"', "")
                    this.$session.$data.cred_name = name;
                }
            } else {
                this.ask("Please tell me your name.");
                return;
            }

            if (matr_num) {
                if (matr_num.toString().length != 6) {
                    this.ask("Please re-check the matriculation number you've entered.");
                } else {
                    this.$session.$data.cred_matr_num = matr_num;
                }
            } else {
                this.ask("We also need your student number to proceed.");
                return;
            }

            //Lost and Found Search
            const lostboxRef = db.collection("Lost_Found_Box");
            try {
                const doc = await lostboxRef.doc("" + this.$session.$data.cred_name).get();
                var dict_lostthings = Object();
                if (!doc.exists) {
                    console.log('No such document!');
                    this.ask("Thanks for your information. Unfortunately we were not able to find your card. Would you like us to make you a new one?")
                } else {
                    console.log('Document data:', doc.data());
                    dict_lostthings = doc.data()

                    if ((dict_lostthings["item"]) === "id card" && dict_lostthings["id number"] === matr_num) {
                        this.followUpState(null)
                            .ask("Hurray, we actually found your id card. Please contact the lost and found office under +49 391 67-54444")
                    } else {
                        this.ask("Thanks for your information. Unfortunately we were not able to find your card. Would you like us to make you a new one?")
                    }
                }
            } catch (e) {
                console.error("test", e.message);
                this.ask("Thanks for your information. Unfortunately we were not able to find your card. Would you like us to make you a new one?")
            }
        },

        YesIntent() {
            this.followUpState("IDCardState.NewIDCardState.CredentialState.ConfirmationState")
                .ask("Great. In order for you to receive the new card a handling fee of 10 Euros must be submitted." +
                    "Please confirm that this is ok for you. (As this is only the test version of the bot, no costs are incurred.) ")
        },

        NoIntent() {
            this.followUpState(null)
                .ask("Ok, is there anything else we can help you with?")
        },
    },

    ////////// New ID State //////////
    NewIDCardState: {

        ////////// Getting the credentials of the user //////////
        CredentialState: {
            async CredentialIntent() {
                var prevname = this.$session.$data.cred_name
                var prevmatr_num = this.$session.$data.cred_matr_num;
                var prevmail = this.$session.$data.cred_mail;

                var name = await this.getInput('name').value ? this.getInput('name').value : prevname;
                if (typeof name === 'object' && name !== null) {
                    name = this.getInput('name').value.name;
                }
                if (!name && prevname) {
                    name = prevname
                }

                var matr_num = this.getInput('matric').value ? this.getInput('matric').value : prevmatr_num;
                if (!matr_num && prevmatr_num) {
                    matr_num = prevmatr_num
                }

                var mail = this.getInput('mail').value ? this.getInput('mail').value : prevmail;
                if (!mail && prevmail) {
                    mail = prevmail
                }


                if (name.includes("@")) {
                    mail = name
                    name = prevname
                }

                if (!name && !matr_num && !mail) {
                    this.followUpState("IDCardState.NewIDCardState.CredentialState").ask("In order to make you a new card, please provide your name and student number." +
                        "For the authentication we also need your student mail.")
                }

                //check name
                if (name) { //Name split for email address
                    var nameArray = JSON.stringify(name).split(" ");
                    if (nameArray.length < 2) {
                        this.followUpState("IDCardState.NewIDCardState.CredentialState").ask("Please provide your firstname and surname.")
                        return
                    } else {
                        var firstName = nameArray[0].replace('"', "")
                        var surName = nameArray[1].replace('"', "")
                        this.$session.$data.cred_name = name;
                    }
                } else {
                    this.followUpState("IDCardState.NewIDCardState.CredentialState").ask("Please tell me your full name.");
                    return;
                }

                //check matriculation number
                if (matr_num) {
                    if (matr_num.toString().length != 6) {
                        this.followUpState("IDCardState.NewIDCardState.CredentialState").ask("Please re-check the matriculation number you've entered.");
                    } else {
                        this.$session.$data.cred_matr_num = matr_num;
                    }
                } else {
                    this.followUpState("IDCardState.NewIDCardState.CredentialState").ask("We also need your student number to proceed.");
                    return;
                }

                this.$session.$data.cred_matr_num = matr_num;

                //Email validation process - OvGU mail contains first and surname
                if (mail) {
                    var strMail = JSON.stringify(mail)
                    if (!strMail.includes("st.ovgu.de")) {
                        this.followUpState("IDCardState.NewIDCardState.CredentialState").ask("The mail you provided is not your uni mail. Please provide your uni mail.")
                        return;
                    } else if (strMail.toLowerCase().includes(firstName.toLowerCase()) && strMail.toLowerCase().includes(surName.toLowerCase())) {
                        this.$session.$data.cred_mail = mail;
                    } else {
                        this.followUpState("IDCardState.NewIDCardState.CredentialState").ask("It seems the user mail you provided does not match your credentials. " +
                            "Please check again.")
                        console.log(surName)
                        console.log(firstName)
                        console.log(mail)
                        return;
                    }
                } else {
                    this.followUpState("IDCardState.NewIDCardState.CredentialState").ask("Additionally, please provide your student mail for verification purposes.");
                    return;
                }

                if (name && matr_num && mail) {
                    userRef.doc("" + this.$session.$data.id).update({
                        name: this.$session.$data.cred_name,
                        matr_num: this.$session.$data.cred_matr_num,
                        mail: this.$session.$data.cred_mail,
                    })
                }
                this.followUpState("IDCardState.NewIDCardState.CredentialState").ask(
                    "Thanks for your information. So your credentials are:" + "\n" +
                    "Name: " + this.$session.$data.cred_name + "\n" +
                    "Student number: " + this.$session.$data.cred_matr_num + "\n" +
                    "E-mail: " + this.$session.$data.cred_mail + "\n" +
                    "Is this correct?"
                )
            },

            YesIntent() {
                userRef.doc("" + this.$session.$data.id).update({
                    name: this.$session.$data.cred_name,
                    matr_num: this.$session.$data.cred_matr_num,
                    mail: this.$session.$data.cred_mail,
                })
                
                ID_status_Ref.doc("" + this.$session.$data.cred_matr_num).set({
                    name: this.$session.$data.cred_name,
                    number: this.$session.$data.cred_matr_num,
                    status: 1
                });

                this.followUpState("IDCardState.NewIDCardState.CredentialState.ConfirmationState")
                    .ask("Great. In order for you to receive the new card a handling fee of 10 Euros must be submitted." +
                        "Please confirm that this is ok for you. (As this is only the test version of the bot, no costs are incurred.) ")
            },

            NoIntent() {
                this.ask("Please tell us what is incorrect.")
            },

            //The confirmation should have an actual way of proving the identity of the person. There would be multiple ways to do this like email and two factor authentification
            //These methods will not be part of the scope of this project 
            ConfirmationState: {
                YesIntent() {
                    ID_status_Ref.doc("" + this.$session.$data.cred_matr_num).set({
                        name: this.$session.$data.cred_name,
                        number: this.$session.$data.cred_matr_num,
                        status: 2
                    });

                    this.followUpState(null)
                        .ask("Great. We will check if your Credentials are correct and prepare your new card. " +
                            "You can check your current status of your new id card by asking me. I will tell you the latest information. " + 
                            "Is there something else I can help you with?")
                },

                NoIntent() {
                    this.followUpState(null)
                        .ask("Ok. In this case we have to cancel your inquiry here. Would you like to ask another question?")
                },
            }

        },

        ///Only available over the id card status ///
        PickUpState: {

            PhysicalIntent() {
                this.followUpState("IDCardState.NewIDCardState.PickUpState.PhysicalState")
                    .ask("So you want to come by yourself. Could you already tell us at what day you want to come by?")
            },

            DigitalIntent() {
                this.ask("I am sorry, you cant pick up your card digitally. Please pick another method")
            },

            PostIntent() {
                this.followUpState("IDCardState.NewIDCardState.PickUpState.PostState")
                    .ask("Alright. We will need your address to send it to you. Could you please provide your post credentials?")
            },

            Unhandled() {
                this.ask("Please choose how you want to pick up the id card")
            },

            CancelIntent() {
                prevState = this.getState()
                this.followUpState("CancelState")
                    .ask("Do you want to cancel your current inquiry?")
            },

            PostState: {
                async PostCredentialIntent() {
                    var prevcity = this.$session.$data.cred_city;
                    var prevzipcode = this.$session.$data.cred_zipcode;
                    var prevaddress = this.$session.$data.cred_street;

                    var city = await this.getInput('location').key.city ? this.getInput('location').key.city : prevcity;
                    var zipcode = await this.getInput('location').key['zip-code'] ? this.getInput('location').key["zip-code"] : prevzipcode;
                    var address = await this.getInput('location').key['street-address'] ? this.getInput('location').key["street-address"]: prevaddress;

                    console.log (city + "  " + zipcode + "  "+ address )
                    if (!city && !zipcode && !address) {
                        this.ask("Please provide the city, zipcode and streetname + number.")
                    }

                    if (city) {
                        this.$session.$data.cred_city = city;
                    } else {
                        this.ask("Please tell us the name of the city you are living in.");
                        return;
                    }

                    if (zipcode) {
                        console.log(zipcode)
                        this.$session.$data.cred_zipcode = zipcode;
                        console.log(this.$session.$data.cred_zipcode)
                    } else {
                        this.ask("We also need the zipcode of your city");
                        return;
                    }

                    if (address) {
                        console.log("address")
                        this.$session.$data.cred_street = address;
                    } else {
                        this.ask("We also need your address in the city");
                        return;
                    }

                    this.ask(
                        "Thanks for your information. So you are living in: " + "\n" + 
                        this.$session.$data.cred_street + "\n" + 
                        this.$session.$data.cred_zipcode + "\n" + 
                        this.$session.$data.cred_city + "\n" + 
                        "Is this correct?")
                },

                YesIntent() {
                    this.followUpState(null)
                        .ask("Great. We will send it to you as soon as possible. Is there anything else we can help you with?")
                        userRef.doc("" + this.$session.$data.id).update({
                            city: ""+this.$session.$data.cred_city,
                            zipcode: ""+this.$session.$data.cred_zipcode,
                            address: ""+this.$session.$data.cred_street,
                        });
                },

                NoIntent() {
                    this.ask("Please tell us what is wrong so that we can correct it")
                },

            },

            PhysicalState: {
                async OpenTimingsIntent() {
                    //Get the inputs that were present in the previous request.
                    //Used for contextual requests.

                    var givenLoc = "campus service center" //location is logged in for the LostID

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
                    this.followUpState("IDCardState.NewIDCardState.PickUpState.PhysicalState.AppointmentState")
                        .ask("Great. Should we save your request and date for when you come by?")
                },

                NoIntent() {
                    this.ask("No problem. Please tell us when you would rather come by. If you have all the info you need, you can also cancel this request or end the chat.")
                },

                AppointmentState: {
                    YesIntent() {
                        this.followUpState(null)
                            .ask("Great we look forward to meeting you on " + formatDate(new Date(this.$session.$data.idpickup_date)) +
                                ". The date is not binding, so no worries if you can't make it. Is there anything else we can help you with?")
                    },
                    NoIntent() {
                        this.followUpState(null)
                            .ask("Ok no problem, we won't save your info. Do you want to ask another question?")
                    }
                }
            }
        }
    },
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