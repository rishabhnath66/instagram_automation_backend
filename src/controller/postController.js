const axios=require("axios")
const {insertData, selectData, updateData } = require("../services/dbservice");
const {encrypt, generateStrongPassword, comparePassword, manageJwtToken, validateData, sendResponse ,} = require("../helper/comman");
const schedulePostModel = require("../model/schedulePostModel");
const { where } = require("../model/socialAccountModel");
const scheduleController = {}



scheduleController.createPost=async (req, res) => {
    try {
        let { title, caption, mediaUrl = [], scheduleDate, accounts, timeZone, postDate,type} = req.body;

        let valid=validateData( req?.body ?? {}, {
            title : {
              type : "string"
            },
            caption : {
              type : "string"
            },
            mediaUrl : {
                type : "array"
            },
            scheduleDate : {
                type : "string"
            },
            accounts : {
                type : "array"
            },
            timeZone : {
                type : "object"
            },
            postDate : {
                type : "string"
            },
            type : {
                type : "string"
            }
          })
          if(Object.keys(valid).length!=0){
            sendResponse(res,400,valid)
            return
          }
        // let userId=req.user._id
      
            const d = new Date();
            let sd = postDate ? new Date(postDate) : new Date();
            if (new Date() > sd) {
                sendResponse(res,401,"Please choose future date and time as per selected timezone.");
                return
            }
           await insertData({
                req, res,
                collection: schedulePostModel,
                findOne: true,
                data: {
                    title,
                    // userId,
                    caption,
                    mediaUrl,
                    // scheduleDate,
                    accounts,
                    timeZone,
                    // postDate,
                }
            })
                res.status(200).json({
                    status: true,
                    message: "Post scheduled successfully.",
                });
          
          
        
    } catch (error) {
        console.log({error})
      sendResponse(res,500,"Someting went wrong",error)
    }

  }

  scheduleController.updatePost=async (req, res) => {
    try {
        let { title, caption, mediaUrl = [], scheduleDate, accounts, timeZone, postDate,target} = req.body;

        let valid=validateData( req?.body ?? {}, {
            title : {
              type : "string"
            },
            caption : {
              type : "string"
            },
            mediaUrl : {
                type : "array"
            },
            scheduleDate : {
                type : "string"
            },
            accounts : {
                type : "array"
            },
            timeZone : {
                type : "object"
            },
            postDate : {
                type : "string"
                
            },
            type : {
                type : "string"
            },
            target : {
                type : "string"
            }
          })
        if(Object.keys(valid).length!=0){
            sendResponse(res,400,valid)
            return
          }
        // let userId=req.user._id
    
            const d = new Date();
            let sd = postDate ? new Date(postDate) : new Date();
            if (new Date() > sd) {
                sendResponse(res,401,"Please choose future date and time as per selected timezone.");
                return
            }
            if(target)
            {
             let d1=await selectData({
                collection : schedulePostModel,
                where : {_id : target}
             })
             if(d1)
             {
                let update= await updateData({
                    collection : schedulePostModel,
                    where : {_id : target},
                    data :  {
                        title,
                        caption,
                        mediaUrl,
                        // scheduleDate,
                        accounts,
                        // postOn,
                        timeZone,
                        // postDate,
                    }
                 })
                 if(update){
                    sendResponse(res,200,"Post updated Sucessfully.");
                    return
                 }
             }
            }else{
                sendResponse(res,204,"Post Not Found");
                return
            }
          
          
        
    } catch (error) {
        console.log({error})
      sendResponse(res,500,"Someting went wrong",error)
    }

  }


  scheduleController.multiCreatePost=async (req, res) => {
    try {
        let { scheduleDate, timeZone, postDate,type ,postList} = req.body;

        let valid=validateData( req?.body ?? {}, {
            scheduleDate : {
                type : "string"
            },
            timeZone : {
                type : "object"
            },
            postDate : {
                type : "string"
            },
            type : {
                type : "string"
            },
            postList : {
                type : "array",
                require : [ "title", "caption", "mediaUrl" ,"accounts"]
            }
          })
          if(Object.keys(valid).length!=0){
            sendResponse(res,400,valid)
            return
          }
        // let userId=req.user._id
        
            const d = new Date();
            let sd = postDate ? new Date(postDate) : new Date();
            if (new Date() > sd) {
                sendResponse(res,401,"Please choose future date and time as per selected timezone.")
                return
            }
            let insPostList = [],
            draftIdAry = [];

        for (let postData of postList) {
            
            let { title, caption, mediaUrl ,accounts} = postData;
          
            if (caption.trim() != '' || mediaUrl.length) {
                insPostList.push({
                    title,
                    // userId,
                    caption,
                    mediaUrl,
                    // scheduleDate: scheduleDate,
                    accounts,
                    timeZone,
                    // postDate: postDate,
                });

            }
        }

        if (insPostList.length) {
           await insertData({
                req, res,
                collection: schedulePostModel,
                findOne: true,
                data: insPostList
            })
        sendResponse(res,201,"Post scheduled successfully.")
        } else {
            sendResponse(res,204,"No any post to schedule.")
      
        }
            
          
        
    } catch (error) {
        console.log({error})
      sendResponse(res,500,"Someting went wrong",error)
    }

  }


  module.exports = scheduleController
