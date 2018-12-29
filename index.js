'use strict';

if (!require('is-heroku')) {
  require('dotenv').config();
}
const restler = require('restler'),
  twilioClient = require('twilio')(
    process.env.TWILIO_UID,
    process.env.TWILIO_AUTH,
  ),
  intersect = require('array-intersection'),
  firebase = require('firebase');

firebase.initializeApp({
  apiKey: process.env.FIREBASE_API,
  databaseURL: process.env.FIREBASE_DATABASE,
});
const database = firebase.database();

let numberPairs = {};

require('./server')(
  data =>
    new Promise((resolve, reject) => {
      const databaseEntry = {};

      databaseEntry[data.order] = data.phone;

      database
        .ref('vals')
        .update(databaseEntry)
        .then(() => {
          console.log('updated database');

          try {
            updateDatabaseOrders(); // Rerequesting is just a more surefire way to make sure things don't go badly
            console.log('successfully downloaded updated database');
          } catch (err) {
            /*
             * For debugging enable
             * console.log(err);
             * probably should make a better dev process lel
             */
          }
          resolve(true);
        });
    }),
);

const updateDatabaseOrders = () => {
    const userDataPairs = database.ref('vals');

    userDataPairs.on(
      'value',
      data => {
        numberPairs = data.val();
        // Console.log(numberPairs);
      },
      console.error,
    );
  },
  /*
   * Gets information from the pub on the orders that are up
   */
  requestPub = processNumbers => {
    restler.get(process.env.API).on('success', (result, response) => {
      // Console.log(result);
      const orders = typeof result === 'object' ? result : JSON.parse(result),
        orderNumbers = orders.map(el => el.order_id);

      processNumbers(orderNumbers, orderNumbers => {
        for (let i = 0; i < orderNumbers.length; i++) {
          textOrder(orderNumbers[i]);
          // Console.log(orderNumbers[i]);

          database
            .ref(`vals/${orderNumbers[i]}`)
            .remove() // Finished with order, get rid of it in database
            .then(() => {
              console.log('Remove succeeded.');
            });
        }
      });
    });
  },
  /*
   * Checks all numbers that are part of the numbers that should be searched for
   */
  checkNumbers = (allNumbers, handleMatchedNumbers) => {
    if (numberPairs == null) {
      return;
    }

    const searchNumbers = Object.keys(numberPairs),
      foundOrderNumbers = intersect(allNumbers, searchNumbers);

    handleMatchedNumbers(foundOrderNumbers);
  },
  textOrder = orderNumber => {
    // Const client = new twilio(process.env.TWILIO_UID, process.env.TWILIO_AUTH);

    twilioClient.messages
      .create({
        body: `Your order, #${orderNumber}. is up!`,
        to: numberPairs[orderNumber], // Text this number
        from: process.env.TWILIO_PHONE, // From a valid Twilio number
      })
      .then(message => console.log(message.sid));
  };

/*
 *
 *
 * /*
 *RequestPub(checkNumbers)
 *handleMatchedNumbers([201]);
 */
/*
 * UpdateDatabaseOrders();
 * requestPub(checkNumbers);
 * setInterval(function() {
 * updateDatabaseOrders();
 * console.log('database');
 * }, 300000);
 */
requestPub(checkNumbers);
console.log('Pub Check');

setInterval(() => {
  requestPub(checkNumbers);
  console.log('Pub Check');
}, 15000); // Every 15 seconds, checkin with the pub
