const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
const cors = require('cors');

const jsonParser = bodyParser.json();
const urlParser = bodyParser.urlencoded({ extended: false })
const port = process.env.PORT || 80;


const heroku = require('is-heroku');
if(!heroku){ // if running locally 
    require('dotenv').config()
}




app.use(cors({ origin: ['https://benc.io','https://pub.benc.io' ]}));



var exports = {};

exports = function launchServer(dataHandler){
    app.post('/',urlParser, function(req, res){
        //console.log('POST /');  
        //console.log(req.body);
        
        
        bcrypt.compare(req.body.passcode,process.env.verification, function(err, verified) {
            // res == true
            if(verified){
                var userData = req.body;
                delete userData['passcode']; // no need to propogate this
                
                dataHandler(userData).then(function(){
                    res.sendStatus(200);
                })
                
                //res.end();
            }
            else{
                res.sendStatus(401); //unauthorized
            }
        });
       
         // handle query and return status message
        
          
        
        
    });
    
    app.get('/', function (req, res) { // just for checking
        res.redirect('https://benc.io/pub');
      })
    app.listen(port);
}


module.exports = exports;