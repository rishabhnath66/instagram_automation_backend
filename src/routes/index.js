const express = require('express');
const router = express.Router();
const authController= require("../controller/authController");
const socialController = require('../controller/socialController');
let requests = {};

requests={
get : {
  '/login': authController.login,
  '/addSocialAccount': socialController.addAccount,
},
post :{
  '/register': authController.register,
  '/uploadMedia': authController.uploadMedia,
 
},
delete : {
 
}
}

for(let req in requests) {
  for(let reqsub in requests[req]){
        router[req](reqsub, requests[req][reqsub]);
  }
}

module.exports = router
