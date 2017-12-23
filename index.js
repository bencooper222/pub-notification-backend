const restler = require("restler");
const twilio = require("twilio");
const intersect = require("array-intersection");
const firebase = require("firebase");
require("dotenv").config();

const server = require("./server"); // use server(handlingMethod)

firebase.initializeApp({
  apiKey: process.env.firebaseApi,
  databaseURL: process.env.firebaseDatabase
});
const database = firebase.database();

let numberPairs = {};

function handleUserRequest(data) {
  return new Promise(function(resolve, reject) {
    let databaseEntry = {};
    databaseEntry[data.order] = data.phone;
    console.log("runs");
    let newPushRef = database
      .ref("vals")
      .update(databaseEntry)
      .then(function() {
        updateDatabaseOrders(); // rerequesting is just a more surefire way to make sure things don't go badly
        resolve(true);
      });
  });
}
server(handleUserRequest);

function errData(data) {
  console.log(data);
}

function updateDatabaseOrders() {
  let userDataPairs = database.ref("vals");
  userDataPairs.on(
    "value",
    function(data) {
      numberPairs = data.val();
      //console.log(numberPairs);
    },
    errData
  );
}

/*
 * Gets information from the pub on the orders that are up
 */
function requestPub(processNumbers) {
  restler.get(process.env.api).on("success", function(result, response) {
    //console.log(result);
    let orders = JSON.parse(result);
    let orderNumbers = [];

    for (let i = 0; i < orders.length; i++) {
      orderNumbers.push(orders[i]["order_id"]);
    }

    processNumbers(orderNumbers, handleMatchedNumbers);
  });
}

/*
 * Checks all numbers that are part of the numbers that should be searched for
 */
function checkNumbers(allNumbers, handleMatchedNumbers) {
  if (numberPairs == undefined || numberPairs == null) {
    return;
  }

  const searchNumbers = Object.keys(numberPairs);

  const foundOrderNumbers = intersect(allNumbers, searchNumbers);

  handleMatchedNumbers(foundOrderNumbers);
}

function textOrder(orderNumber) {
  const client = new twilio(process.env.twilioUid, process.env.twilioAuth);

  client.messages
    .create({
      body: "Your order, #" + orderNumber + ". is up!",
      to: numberPairs[orderNumber], // Text this number
      from: process.env.twilioPhone // From a valid Twilio number
    })
    .then(message => console.log(message.sid));
}

/*
 * Iterates through matched numbers to text them about their order
 */
function handleMatchedNumbers(orderNumbers) {
  for (let i = 0; i < orderNumbers.length; i++) {
    textOrder(orderNumbers[i]);
    //console.log(orderNumbers[i]);

    database
      .ref("vals/" + orderNumbers[i])
      .remove() // finished with order, get rid of it in database
      .then(function() {
        console.log("Remove succeeded.");
      });
  }
}

//requestPub(checkNumbers)
//handleMatchedNumbers([201]);
/*
updateDatabaseOrders();
requestPub(checkNumbers);
setInterval(function() {
    updateDatabaseOrders();
    console.log('database');
}, 300000);
*/

setInterval(function() {
  requestPub(checkNumbers);
  console.log("pub");
}, 20000); // every 20 seconds, checkin with the pub
