const { sendResponse } =require("../helper/comman");
const jwt = require("jsonwebtoken");
const {selectData } = require("../services/dbservice");
const usersModel = require("../model/usersModel");

const middlewareModule = {};

middlewareModule.checkAuth = async(req, res, next) => {
  try {
    if( !req.headers || !req.headers.authorization) {
    
      sendResponse(res,401,"",{
        code : "InvalidToken"
      })
      return;
    }

    let token = req.headers.authorization;
    if (token.includes("Bearer ")) {
      token = token.replace("Bearer ", "");
    }
    let decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    let user = await selectData({
      collection : usersModel,
      where : { _id : decoded.userId},
      findOne : true
    })
    if(user)
    {
      req.user = user;
      next();
    }else{
      sendResponse(res,401,"",{
        code : "InvalidToken"
      })
    }
  } catch (error) {

    sendResponse(res,401,"",{
      code : "InvalidToken"
    })
  }
}




middlewareModule.allowuser  = async(role,req, res, next) => {
let user=  req.user
      if(role.includes(user.role))
      {
        next(); 
      }else{
        sendResponse(res,403,"forbidden error")
      }
};

module.exports=middlewareModule