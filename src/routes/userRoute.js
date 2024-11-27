const express = require('express');
const router = express.Router();
const userController= require("../controller/userController");
const middlewareModule = require('../middleware/middleware');

let requests ={
  get : {
    '/getUserList': userController.getUserList,
    '/getUserLogin': userController.getUserLogin,
  },
  post : {
    '/addUser': userController.addUser,
   
   },
   delete : {
    '/deleteUser': userController.deleteUser,
   }
}
let allowrequest ={
  '/getUserList' : ["admin","subadmin"],
  '/addUser' : ["admin","subadmin"],
  '/deleteUser' : ["admin","subadmin"],
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
