const axios=require("axios")
const {insertData, selectData, updateData, countData, aggregateData } = require("../services/dbservice");
const {encrypt, generateStrongPassword, comparePassword, manageJwtToken, validateData, sendResponse ,} = require("../helper/comman");
const schedulePostModel = require("../model/schedulePostModel");
const socialAccountModel = require("../model/socialAccountModel");
const postModel = require("../model/postModel");
const scheduleController = {}
const mongoose = require('mongoose');


scheduleController.getPost=async (req, res) => {
    try {
        let {page , limit,keys} =  req?.query || {};  
        let user=req.user
        let valid=validateData( req?.query ?? {}, {
          page : {
            type : "string"
          },
          limit : {
            type : "string"
          },
        })
  
        if(Object.keys(valid).length!=0){
          sendResponse(res,400,valid)
          return
        }
        let where={userId :user._id }
        if(keys)
        {
          where.name= { $regex: keys, $options: "i" } 
        }
        // console.log({where})
         let result=await aggregateData({
              collection: schedulePostModel,
              aggregateCnd : [
                {$match : {userId :user._id }},
                {
                  
                    $lookup: {
                           from: "social_accounts",
                           localField: "accounts",
                           foreignField: "_id",
                           as: "data"
                         }
                },{$skip : ((page*limit)-limit)},
                { $limit : parseInt(limit) }
              ]
          })
          console.log({limit},"oooo",((page*limit)-limit))
          let count=await countData({
          collection: schedulePostModel,
            where,
        })
        let data ={
          data : result,
          count : count
        }
        console.log({data})
          sendResponse(res,200,"",data)
      } catch (e) {
        console.log({e})
        sendResponse(res,500, "Something went wrong.");
      }

  }
scheduleController.multipost=async (req, res) => {
    try {
        let {page , limit,keys,target} =  req?.query || {};  
        let user=req.user
        let valid=validateData( req?.query ?? {}, {
          target : {
            type : "string"
          },
          page : {
            type : "string"
          },
          limit : {
            type : "string"
          },
        })
  
        if(Object.keys(valid).length!=0){
          sendResponse(res,400,valid)
          return
        }
        
        let where = { userId: user._id,  scheduleId:new mongoose.Types.ObjectId(target) };
        if(keys)
        {
          where.name= { $regex: keys, $options: "i" } 
        }
        console.log({where})
         let result=await selectData({
              collection: postModel,
              where ,
              limit, page
          })
          let count=await countData({
          collection: postModel,
            where,
            
        })
        let data ={
          data : result,
          count : count
        }
          sendResponse(res,200,"",data)
      } catch (e) {
        console.log({e})
        sendResponse(res,500, "Something went wrong.");
      }

  }
scheduleController.createPost=async (req, res) => {
    try {
        let {caption, mediaUrl = [], scheduleDate, accounts, timeZone,type,postDate,offset} = req.body;
        let valid=validateData( req?.body ?? {}, {
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
            offset : {
                type : "number"
            },
            type:{
                type : "string"
            },
         
          })
          let userTimer={}
          if(Object.keys(valid).length!=0){
            sendResponse(res,400,valid)
            return
          }
            let userId=req.user._id
            let sd

            let userlist= await selectData({
              collection: socialAccountModel,
              data: {
                  _id : {$in : accounts}
              }
          })
          console.log({userlist})
            if(type!="postnow")
            {
             
              for(let user of userlist)
              {
                const d = new Date();
                let sd = new Date(scheduleDate)
                let timezoneOffset = new Date().getTimezoneOffset()
              // if(timezoneOffset>0)
              // {
              //   sd.setMinutes(sd.getMinutes() - (timezoneOffset))
              // }else{
              //   sd.setMinutes(sd.getMinutes() - (timezoneOffset *-1))
              // }
              sd.setMinutes(sd.getMinutes() +(timezoneOffset))
              sd.setMinutes(sd.getMinutes() + (user.TimeZone.offset * 60))
              // if(user.TimeZone.offset>0)
              //   {
              //     sd.setMinutes(sd.getMinutes() - (user.TimeZone.offset * 60))
              //   }else{
              //     sd.setMinutes(sd.getMinutes() - (user.TimeZone.offset * 60 *-1))
              //   }
             
              console.log(new Date() ,sd ,"pppppppppppppppp",user.TimeZone.offset)
                if (new Date() > sd) {
                    sendResponse(res,401,"Please choose future date and time as per selected timezone.");
                    return
                }else{
                  userTimer[user._id]=sd
                }
              }
                
            }
            const dat = new Date();
            accounts=accounts.map((ele)=>  new mongoose.Types.ObjectId(ele))
          let d1= await insertData({
                req, res,
                collection: schedulePostModel,
                data: {
                    type ,
                    userId,
                    caption,
                    mediaUrl,
                    scheduleDate :dat ,
                    accounts,
                    timeZone,
                    postDate :dat,
                }
            })
            let arr=[]
            accounts.map((ele)=>{
                let obj={
                    userId,
                    scheduleId :d1._id,
                    accountId : ele,
                    caption ,
                    mediaUrl ,
                    type ,
                    scheduleDate  :userTimer[ele],
                    postDate :userTimer[ele],
                }

                arr.push(obj)
                console.log({obj})
            })
            let post= await insertData({
                req, res,
                collection: postModel,
                data:arr
            })
            sendResponse(res,201,"Post Created Successfully.")

          
          
        
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
                        scheduleDate :sd,
                        accounts,
                        timeZone,
                         postDate :sd,
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
