/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/


///////// Time Module ///////////////////////
var moment = require('moment');
var DateFormat = "DD-MM-YYYY HH:mm:ss";
var LogTimeStame = moment().format(DateFormat); 


///////// DB Module ///////////////////////
var mongo = require('mongodb');
var connString = 'mongodb://shagrir:shagrir@ds119151.mlab.com:19151/shagrir';
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var dbm;
var colUserData;
var colEntities;
var colLog;
var colUserTicket;
var colCustomerData;


// Initialize DB connection once
 
mongo.MongoClient.connect(connString, function(err, database) {
  if(err) throw err;
  
  dbm = database;
  colUserData = dbm.collection('UserData'); 
  colEntities = dbm.collection('Entities');
  colLog = dbm.collection('Log'); 
  colUserTicket = dbm.collection('UserTicket');
  colCustomerData = dbm.collection('CustomerData');
  
});



"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);


///////// Bing Geo Module ///////////////////////

var locationDialog = require('botbuilder-location');
bot.library(locationDialog.createLibrary("BING_MAPS_API_KEY"));
bot.library(locationDialog.createLibrary(process.env.BING_MAPS_API_KEY));


bot.dialog('/', [
    function (session) {

        session.sendTyping();

        if (session.userData.authanticated != 'true') {

            session.beginDialog("/Login");

        } else {

            session.send("שלום " + session.userData.CustomerName + ", כיף לדעת שזכרת אותי!");

            session.beginDialog("/homeMenu");
        }

        
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.number(session, "Hi " + results.response + ", How many years have you been coding?"); 
    },
    function (session, results) {
        session.userData.coding = results.response;
        builder.Prompts.choice(session, "What language do you code Node using?", ["JavaScript", "CoffeeScript", "TypeScript"]);
    },
    function (session, results) {
        session.userData.language = results.response.entity;
        session.send("Got it... " + session.userData.name + 
                    " you've been programming for " + session.userData.coding + 
                    " years and use " + session.userData.language + ".");
    }
]);









bot.dialog('/Login', [
    function (session) {
        builder.Prompts.number(session, "שלום לך, כדי שאוכל לעזור אז אשמח לדעת מה מספר הרכב שלך (#######):"); 
    },
    function (session, results) {
        session.userData.CarLicenseNum = results.response;
        
        function SearchCustomerByCarLicenseNum() {

                        var cursor = colCustomerData.find({ 'CarLicenseNum': session.userData.CarLicenseNum });
                        
                        var result = [];
                        cursor.each(function(err, doc) {
                            if(err)
                                throw err;
                            if (doc === null) {
                                // doc is null when the last document has been processed


                                if (result.length>0) {
                                    
                                    session.userData.authanticated = 'true';

                                    session.userData.customerid = result[0]._id;

                                    UpdateAddressForCustomer();

                                    function UpdateAddressForCustomer() {

                                        var o_ID = new mongo.ObjectID(session.userData.customerid);


                                        if (session.message.address.channelId == 'facebook') {

                                                colCustomerData.update (
                                                  { "_id": o_ID },
                                                  { $set: { 'facebook_address': session.message.address } }
                                                ); 

                                        } else if (session.message.address.channelId == 'telegram') {

                                                colCustomerData.update (
                                                  { "_id": o_ID },
                                                  { $set: { 'telegram_address': session.message.address } }
                                                ); 

                                        } else if (session.message.address.channelId == 'skype') {

                                                colCustomerData.update (
                                                  { "_id": o_ID },
                                                  { $set: { 'skype_address': session.message.address } }
                                                ); 

                                        } else {

                                                colCustomerData.update (
                                                  { "_id": o_ID },
                                                  { $set: { 'gen_address': session.message.address } }
                                                ); 

                                        }






                                    };

                                    session.send("שלום " + result[0].CustomerName + " עם רכב מסוג " + result[0].carType +  " של יצרן " + result[0].CarManufacture + " משנת " + result[0].CarManuYear);

                                    session.beginDialog("/homeMenu");


                                } else {

                                    session.userData.authanticated = 'false';

                                    session.sendTyping();

                                    session.send("לא הצלחתי למצוא את מספר הרכב הזה ברשימה שלי. רוצה לנסות שוב?");

                                    session.beginDialog("/Login");

                                }


                                return;
                            }
                            // do something with each doc, like push Email into a results array
                            result.push(doc);
                        }); 
                        
        }

        SearchCustomerByCarLicenseNum();

        

    }
]);






var menuData = {
    "חילוץ": {
        units: 200,
        total: "$6,000"
    },
    "בהרשמה לשירות חדש": {
        units: 100,
        total: "$3,000"
    },
    " בייעוץ": {
        units: 300,
        total: "$9,000"
    }
};


var helpData = {
    "הרכב לא מניע": {
        units: 200,
        total: "$6,000"
    },
    "יש לי תקר": {
        units: 100,
        total: "$3,000"
    },
    "יש לי רעשים מוזרים בזמן נסיעה": {
        units: 300,
        total: "$9,000"
    }
};





bot.dialog('/homeMenu', [
    function (session) {

        session.sendTyping();

        if (session.userData.ticketopened != 'true') {

            builder.Prompts.choice(session, "אז היום אני עוזר לך ב: ", menuData);

        } else {

            builder.Prompts.choice(session, "בזמן ההמתנה, האם אני יכול לסייע במשהו נוסף? אם כן אז ב:", menuData);

        }

        
         
    },
    function (session, results) {
        session.userData.menuChoise = results.response.entity;
        session.userData.dddd = 'cccc';

        if (session.userData.menuChoise == 'חילוץ') {

            if (session.message.address.channelId == 'facebook') {

                var options = {
                    prompt: "מה המיקום המדויק שלך? במידה ואצטרך לשלוח חילוץ",
                    useNativeControl: true,
                    reverseGeocode: true,
                    requiredFields:
                        locationDialog.LocationRequiredFields.region |
                        locationDialog.LocationRequiredFields.country
                };

                locationDialog.getLocation(session, options);


            } else {

                locationDialog.getLocation(session,
                { prompt: "מה המיקום המדויק שלך? במידה ואצטרך לשלוח חילוץ" });

/*
                var options = {
                    prompt: "מה המיקום המדויק שלך? במידה ואצטרך לשלוח חילוץ",
                    useNativeControl: true,
                    reverseGeocode: true,
                    requiredFields:
                        locationDialog.LocationRequiredFields.streetAddress |
                        locationDialog.LocationRequiredFields.locality |
                        locationDialog.LocationRequiredFields.region |
                        locationDialog.LocationRequiredFields.postalCode |
                        locationDialog.LocationRequiredFields.country
                };

                locationDialog.getLocation(session, options);

                */


            }

        } else if (session.userData.menuChoise == 'בהרשמה לשירות חדש') {

            session.beginDialog("/createLead");

        } else {


        }
        
    },
    function (session, results) {

        if (results.response) {

            session.sendTyping();

            var place = results.response;
            session.userData.place = results.response; 

            session.send("אחלה, אני בודק אם יש לי רכבי חילוץ ב:" + locationDialog.getFormattedAddressFromPlace(place, ", "));

            builder.Prompts.choice(session, "אז עכשיו כשאני יודע את המיקום שלך, אני אשמח לדעת מה הבעיה: ", helpData); 
        }        

    },
    function (session, results) {

        session.userData.helpSubject = results.response.entity;

        session.send("מעולה! עכשיו אני יכול לעזור לך. אגב כבר איתרתי את מספר הפוליסה שלך בחברת הביטוח כך שהכל מטופל. אני חוזר לעדכן עוד כמצה דקות..");

        var LogTimeStamp = moment().format(DateFormat);

        var newRecord = {
            'CreatedTime': LogTimeStamp,
            'PhoneNumber': session.userData.PhoneNumber,
            'CustomerName' : session.userData.CustomerName,
            'bituhCompany' : session.userData.bituhCompany,
            'carType' : session.userData.carType,
            'carYear' : session.userData.carYear,
            'userid': session.message.user.id,
            'address': session.message.address,
            'location': session.userData.place,
            'menuChoice': session.userData.menuChoise,
            'helpSubject': session.userData.helpSubject,
            'channelId': session.message.address.channelId,
            'RecordType': 'ticket',
            'status': 'new'
        };

        colUserTicket.insert(newRecord, function(err, result){}); 

        session.userData.ticketopened = 'true';

        session.beginDialog("/homeMenu");

    }
]);


var servicesData = {
    "מנוי לשירותי דרך וגרירה": {
        units: 200,
        total: "$6,000"
    },
    "שירותי דרך ועדיף": {
        units: 100,
        total: "$3,000"
    },
    "משולב אוטומטי": {
        units: 300,
        total: "$9,000"
    },
    "משולב אוטומטי + עדיף": {
        units: 300,
        total: "$9,000"
    },
    " מונית פרטי": {
        units: 300,
        total: "$9,000"
    }
};







bot.dialog('/createLead', [
    function (session) {
        builder.Prompts.choice(session, "מעולה! באיזה שירות היית רוצה להתעניין?", servicesData); 
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.number(session, "Hi " + results.response + ", How many years have you been coding?"); 
    },
    function (session, results) {
        session.userData.coding = results.response;
        builder.Prompts.choice(session, "What language do you code Node using?", ["JavaScript", "CoffeeScript", "TypeScript"]);
    },
    function (session, results) {
        session.userData.language = results.response.entity;
        session.send("Got it... " + session.userData.name + 
                    " you've been programming for " + session.userData.coding + 
                    " years and use " + session.userData.language + ".");
    }
]);



var bituhData = {
    "איילון": {
        units: 200,
        total: "$6,000"
    },
    "כלל": {
        units: 100,
        total: "$3,000"
    },
    "מגדל": {
        units: 300,
        total: "$9,000"
    }
};


var carsData = {
    "מיצובישי": {
        units: 200,
        total: "$6,000"
    },
    "סובארו": {
        units: 100,
        total: "$3,000"
    },
    "פזו": {
        units: 300,
        total: "$9,000"
    }
};

var carYearData = {
    "2000": {
        units: 200,
        total: "$6,000"
    },
    "2001": {
        units: 100,
        total: "$3,000"
    },
    "2002": {
        units: 300,
        total: "$9,000"
    }
};




bot.dialog('/createUser', [
    function (session) {

        session.sendTyping();

        builder.Prompts.text(session, "שלום לך, אני שגרירבוט נעים מאוד. מה שמך?");
        
    },
    function (session, results) {
        session.sendTyping();
        session.userData.CustomerName = results.response;
        builder.Prompts.number(session, "ומספר הטלפון? במידה וארצה לשוחח איתך טלפונית"); 
    },    
    function (session, results) {
        session.sendTyping();
        session.userData.PhoneNumber = results.response;
        builder.Prompts.choice(session, "באיזו חברת ביטוח הרכב שלך מבוטח?", bituhData); 
    },
    function (session, results) {
        session.sendTyping();
        session.userData.bituhCompany = results.response.entity;
        builder.Prompts.choice(session, "איזה רכב יש לך? ", carsData); 
    },
    function (session, results) {
        session.sendTyping();
        session.userData.carType = results.response.entity;
        builder.Prompts.choice(session, "שנת ייצור? ", carYearData); 
    },    
    function (session, results) {

        session.userData.carYear = results.response.entity;

        var LogTimeStamp = moment().format(DateFormat);

        var newRecord = {
            'CreatedTime': LogTimeStamp,
            'PhoneNumber': session.userData.PhoneNumber,
            'CustomerName' : session.userData.CustomerName,
            'bituhCompany' : session.userData.bituhCompany,
            'carType' : session.userData.carType,
            'carYear' : session.userData.carYear,
            'userid': session.message.user.id,
            'address': session.message.address,
            'RecordType': 'customer',
            'Status': 'active'
        };

        colUserData.insert(newRecord, function(err, result){}); 

        session.userData.authanticated = 'true';

        session.send("תודה " + session.userData.CustomerName + "רשמתי לעצמי כך שלא תצטרך להזכיר לי שוב פרטים טכניים כאלה.");

        session.beginDialog("/homeMenu");

    }
]);






var AdminMenuData = {
    "יצירת רשומת לקוח": {
        units: 200,
        total: "$6,000"
    },
    "חזרה לתפריט": {
        units: 300,
        total: "$9,000"
    }
};





bot.dialog('/AdminMenu', [
    function (session) {
        builder.Prompts.choice(session, "נא לבחור פעולה: ", AdminMenuData); 
    },
    function (session, results) {
        session.userData.name = results.response.entity;

        if (results.response.entity == 'יצירת רשומת לקוח') {

            session.beginDialog("/AdminCreateUser");

        } else {

            session.beginDialog("/homeMenu");

        }
 
    }
]);





var carTypeData = {
    "פרטי": {
        units: 200,
        total: "$6,000"
    },
    "מסחרי": {
        units: 100,
        total: "$3,000"
    },
    "מונית": {
        units: 300,
        total: "$9,000"
    },
    "עבודה": {
        units: 300,
        total: "$9,000"
    },
    "עבודה-מסע": {
        units: 300,
        total: "$9,000"
    }
};





bot.dialog('/AdminCreateUser', [
    function (session) {
        session.sendTyping();
        builder.Prompts.text(session, "CustomerName:");  
    },
    function (session, results) {
        session.sendTyping();
        session.userData.CustomerName = results.response;
        builder.Prompts.number(session, "PhoneNumber(for SMS):");  
    }, 
    function (session, results) {
        session.sendTyping();
        session.userData.PhoneNumber = results.response;
        builder.Prompts.number(session, "CarLicenseNum(#######):");  
    },        
    function (session, results) {
        session.sendTyping();
        session.userData.CarLicenseNum = results.response;
        builder.Prompts.choice(session, "carType: ", carTypeData); 
    },
    function (session, results) {
        session.sendTyping();
        session.userData.carType = results.response.entity;
        builder.Prompts.text(session, "CarManufacture:");  
    },
    function (session, results) {
        session.sendTyping();
        session.userData.CarManufacture = results.response;
        builder.Prompts.text(session, "CarModel:"); 
    }, 
    function (session, results) {
        session.sendTyping();
        session.userData.CarModel = results.response;
        builder.Prompts.number(session, "CarSamak:"); 
    },     
    function (session, results) {
        session.sendTyping();
        session.userData.CarSamak = results.response;
        builder.Prompts.number(session, "CarManuYear:"); 
    },        
    function (session, results) {

        session.userData.CarManuYear = results.response;

        var LogTimeStamp = moment().format(DateFormat);

        if (session.message.address.channelId == 'facebook') {

            var newRecord = {
                'CreatedTime': LogTimeStamp,
                'PhoneNumber': session.userData.PhoneNumber,
                'CarLicenseNum': session.userData.CarLicenseNum,
                'CustomerName' : session.userData.CustomerName,
                'CarManufacture' : session.userData.CarManufacture,
                'carType' : session.userData.carType,
                'CarModel' : session.userData.CarModel,
                'CarSamak' : session.userData.CarSamak,
                'CarManuYear' : session.userData.CarManuYear,
                'userid': session.message.user.id,
                'adminfacebookaddress': session.message.address,
                'RecordType': 'customer',
                'Status': 'active'
            };

        } else if (session.message.address.channelId == 'telegram') {

            var newRecord = {
                'CreatedTime': LogTimeStamp,
                'PhoneNumber': session.userData.PhoneNumber,
                'CarLicenseNum': session.userData.CarLicenseNum,
                'CustomerName' : session.userData.CustomerName,
                'CarManufacture' : session.userData.CarManufacture,
                'carType' : session.userData.carType,
                'CarModel' : session.userData.CarModel,
                'CarSamak' : session.userData.CarSamak,
                'CarManuYear' : session.userData.CarManuYear,
                'userid': session.message.user.id,
                'admintelegramaddress': session.message.address,
                'RecordType': 'customer',
                'Status': 'active'
            };

        } else if (session.message.address.channelId == 'skype') {

            var newRecord = {
                'CreatedTime': LogTimeStamp,
                'PhoneNumber': session.userData.PhoneNumber,
                'CarLicenseNum': session.userData.CarLicenseNum,
                'CustomerName' : session.userData.CustomerName,
                'CarManufacture' : session.userData.CarManufacture,
                'carType' : session.userData.carType,
                'CarModel' : session.userData.CarModel,
                'CarSamak' : session.userData.CarSamak,
                'CarManuYear' : session.userData.CarManuYear,
                'userid': session.message.user.id,
                'adminskypeaddress': session.message.address,
                'RecordType': 'customer',
                'Status': 'active'
            };

        } else {

            var newRecord = {
                'CreatedTime': LogTimeStamp,
                'PhoneNumber': session.userData.PhoneNumber,
                'CarLicenseNum': session.userData.CarLicenseNum,
                'CustomerName' : session.userData.CustomerName,
                'CarManufacture' : session.userData.CarManufacture,
                'carType' : session.userData.carType,
                'CarModel' : session.userData.CarModel,
                'CarSamak' : session.userData.CarSamak,
                'CarManuYear' : session.userData.CarManuYear,
                'userid': session.message.user.id,
                'admin  address': session.message.address,
                'RecordType': 'customer',
                'Status': 'active'
            };

        }



        colCustomerData.insert(newRecord, function(err, result){}); 

        session.userData.newCarRecordCreated = 'true';

        session.beginDialog("/AdminMenu");

    }
]);





bot.dialog('triggerDialog', function (session, args) {

    if (args.topic == 'admin') {

        session.endDialog();

        session.beginDialog("/AdminMenu"); 


    } else if (args.topic == 'restart') {

        session.endDialog();

        session.beginDialog("/"); 

    } else if (args.topic == 'logout') {

        session.userData.authanticated = 'false';

        session.userData.ticketopened = 'false';

        session.endDialog();

        session.beginDialog("/"); 

    }



}).triggerAction({ 
    onFindAction: function (context, callback) {
        // Recognize users utterance
        switch (context.message.text.toLowerCase()) {
            case '/restart':
                callback(null, 1.0, { topic: 'restart' });
                break;
            case '//restart':
                callback(null, 1.0, { topic: 'restart' });
                break;                
            case '/admin':
                callback(null, 1.0, { topic: 'admin' });
                break;  
            case '//admin':
                callback(null, 1.0, { topic: 'admin' });
                break;                 
            case '/logout':
                callback(null, 1.0, { topic: 'logout' });
                break;  
            case '//logout':
                callback(null, 1.0, { topic: 'logout' });
                break;                                              
            default:
                callback(null, 0.0);
                break;
        }
    } 
});








if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
