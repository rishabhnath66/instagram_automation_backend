const express = require('express');
const router = express.Router();
const userController= require("../controller/userController");
const middlewareModule = require('../middleware/middleware');
const socialController = require('../controller/socialController');

let requests ={
  get : {
    '/getUserList': userController.getUserList,
    '/getUserLogin': userController.getUserLogin,
    '/instragramlogin' : socialController.authLink,
    '/getinstragramAccountlist' : socialController.getInstragramAccountList,
    '/getDatabyToken':userController.getDatabyToken
  },
  post : {
    '/addUser': userController.addUser,
    '/updateUser': userController.updateUser,
    '/changeStatus': userController.changeStatus,
    '/getUserConnectedInstragramAccounts' : socialController.getUserConnectedInstragramAccounts,
    '/updateTimeZone' : socialController.updateAccount,
    '/uploadMedia': userController.uploadMedia,
   },
   delete : {
    '/deleteUser': userController.deleteUser,
    '/deleteAccount': socialController.deleteAccount,
   }
}
let allowrequest ={
  '/getUserList' : ["admin","subadmin"],
  '/addUser' : ["admin","subadmin"],
  '/deleteUser' : ["admin","subadmin"],
  '/changeStatus' :  ["admin","subadmin"],
}

let list = Object.keys(allowrequest)
for(let req in requests) {
  for(let reqsub in requests[req]){
      if(list.includes(reqsub))
      {
        router[req](reqsub,(rq,rs,next)=>{
          middlewareModule.allowuser(allowrequest[reqsub],rq,rs,next)
        }, requests[req][reqsub]);
      }else{
        router[req](reqsub, requests[req][reqsub]);
      }
  }
}
module.exports = router
