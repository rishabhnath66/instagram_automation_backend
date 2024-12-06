const express = require('express');
const router = express.Router();
const authController= require("../controller/authController");
const socialController = require('../controller/socialController');
let requests = {};

requests={
get : {
  '/addSocialAccount': socialController.addAccount,
},
post :{
  '/register': authController.register,
  '/uploadMedia': authController.uploadMedia,
  '/login': authController.login,
 
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
