const {insertData, selectData, updateData ,deleteData} = require("../services/dbservice");
const {encrypt, generateStrongPassword, comparePassword, manageJwtToken, validateData, sendResponse ,} = require("../helper/comman");
const userModel = require("../model/usersModel")
const userController = {}
  userController.addUser=async (req, res) => {
      try {
        let {name, email, password,conectedAccount } =  req?.body || {};  
        let user=req.user
        let valid=validateData( req?.body ?? {}, {
          name : {
            type : "string"
          },
          email : {
            type : "string"
          },
          password : {
              type : "string"
          },
          conectedAccount : {
              type : "object"
          }
        })

        if(Object.keys(valid).length!=0){
          sendResponse(res,400,valid)
          return
        }
          email = email.toLowerCase();
        let result=await selectData({
              req, res,
              collection: userModel,
              findOne: true,
              where: { email },
          })
              if (result) {
                  sendResponse(res,409,"User already Exists.")
              } else {
                  await insertData({
                          req, res,
                          collection: userModel,
                          data : {
                              name,
                              email,
                              password : await encrypt(password),
                              status : 1,
                              conectedAccount ,
                              parentId : user._id,
                              role : user.role=="admin" ? "subadmin" : "user"
                          } 
                      })
                      sendResponse(res,201,"User Added Succesfully.")
                      
              }
      } catch (e) {
        sendResponse(res,500, "Something went wrong.");
      }
    }


  userController.getUserList=async (req, res) => {
    try {
      let {page , limit} =  req?.body || {};  
      let user=req.user
      let valid=validateData( req?.body ?? {}, {
        page : {
          type : "number"
        },
        limit : {
          type : "number"
        },
      })

      if(Object.keys(valid).length!=0){
        sendResponse(res,400,valid)
        return
      }
      
       let result=await selectData({
            req, res,
            collection: userModel,
            where: {parentId :user._id },
            limit : limit, 
            page : page,
        })
        sendResponse(res,200,"",result)
    } catch (e) {
      sendResponse(res,500, "Something went wrong.");
    }
  }


  userController.updateUser=async (req, res) => {
    try {
      let {name, email, password,conectedAccount,target} =  req?.body || {};  
      let user=req.user
      let valid=validateData( req?.body ?? {}, {
        name : {
          type : "string"
        },
        email : {
          type : "string"
        },
        password : {
            type : "string"
        },
        conectedAccount : {
            type : "object"
        },
        target : {
          type : "string"
        }
      })

      if(Object.keys(valid).length!=0){
        sendResponse(res,400,valid)
        return
      }
       let result=await selectData({
            req, res,
            collection: userModel,
            findOne: true,
            where: { _id : target ,parentId : user._id,},
        })
            if (!result) {
                sendResponse(res,409,"User not exits.")
            } else {
              let data={
                    name,
                    status : 1,
                    conectedAccount ,
               }
               if(password) {
                data.password= await encrypt(password)
               }
                await updateData({
                        req, res,
                        collection: userModel,
                        where : { _id : target },
                        data ,
                        limit : 1
                    })
                    sendResponse(res,200,"User Updated Succesfully.")
                    
            }
    } catch (e) {
      sendResponse(res,500, "Something went wrong.");
    }
  }


  userController.deleteUser=async (req, res) => {
    try {
      let {target} =  req?.body || {};  
      let user=req.user
      let valid=validateData( req?.body ?? {}, {
        target : {
          type : "string"
        }
      })

      if(Object.keys(valid).length!=0){
        sendResponse(res,400,valid)
        return
      }
       let result=await deleteData({
            req, res,
            collection: userModel,
            limit: 1,
            where: { _id : target ,parentId : user._id,},
        })
            if (!result) {
                sendResponse(res,204,"User not exits.")
            } else {
                sendResponse(res,200,"User Deleted Succesfully.")    
            }
    } catch (e) {
      sendResponse(res,500, "Something went wrong.");
    }
  }

  userController.getUserLogin=async (req,res)=>{
    try {
      let {target} =  req?.query || {};  
      let user=req.user
      let valid=validateData( req?.query ?? {}, {
        target : {
          type : "string"
        }
      })

      if(Object.keys(valid).length!=0){
        sendResponse(res,400,valid)
        return
      }
       let checkUser=await selectData({
            req, res,
            collection: userModel,
            findOne: true,
            where: { _id : target ,parentId : user._id,},
        })
            if (!checkUser) {
                sendResponse(res,409,"User not exits.")
            } else {
              var token = await manageJwtToken(checkUser);
              let data ={
                token, 
                userId: checkUser._id,
                role: checkUser.role,
                email : checkUser.role,
                name: checkUser.name,
                profilePic: checkUser.profilePic,
              }
               sendResponse(res,200,"",data)
                    
            }
    } catch (e) {
      console.log({e})
      sendResponse(res,500, "Something went wrong.");
    }
  }
  module.exports = userController
