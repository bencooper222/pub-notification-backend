'use strict';

const app = require('express')(),
  bodyParser = require('body-parser'),
  bcrypt = require('bcrypt'),
  cors = require('cors'),
  urlParser = bodyParser.urlencoded({ extended: false }),
  port = process.env.PORT || 80,
  heroku = require('is-heroku');

app.use(cors());

module.exports = function launchServer(dataHandler) {
  app.post('/', urlParser, (req, res) => {
    /*
     * Console.log('POST /');
     * console.log(req.body);
     */

    bcrypt.compare(
      req.body.passcode,
      process.env.VERIFICATION,
      (err, verified) => {
        // Res == true
        if (verified) {
          console.log('Verified');
          const userData = req.body;

          delete userData.passcode; // No need to propogate this

          dataHandler(userData).then(() => {
            res.sendStatus(200);
          });

          // Res.end();
        } else {
          res.sendStatus(401); // Unauthorized
        }
      },
    );

    // Handle query and return status message
  });

  app.get('/', (req, res) => {
    // Just for checking
    res.redirect('https://pub.benc.io');
  });
  app.listen(port);
};
