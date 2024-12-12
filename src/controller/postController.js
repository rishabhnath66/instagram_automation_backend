const axios=require("axios")
const {insertData, selectData, updateData, countData, aggregateData } = require("../services/dbService");
const {encrypt, generateStrongPassword, comparePassword, manageJwtToken, validateData, sendResponse ,} = require("../helper/comman");
const schedulePostModel = require("../model/schedulePostModel");
const socialAccountModel = require("../model/socialAccountModel");
const postModel = require("../model/postModel");
const scheduleController = {}
const mongoose = require('mongoose');

const TimeDiffrence=(offset1,offset2)=>{
  const diff = offset1 - offset2;
  const min =diff * 60
  return min;
}

scheduleController.getPost=async (req, res) => {
    try {
        let {page , limit,keys,startDate,endDate} =  req?.query || {};  
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

        if (startDate && endDate && startDate.trim() != '' && endDate.trim() != '') {
          where.postDate = {
              $gte: new Date(startDate),
              $lt: new Date(endDate)
          };
      }
       let cond=[
        {$match : where},
        {
          
            $lookup: {
                   from: "social_accounts",
                   localField: "accounts",
                   foreignField: "_id",
                   as: "data"
                 }
        }]
        if (!(startDate && endDate && startDate.trim() != '' && endDate.trim() != '')) {
          cond.push({$skip : ((page*limit)-limit)})
          cond.push({ $limit : parseInt(limit) })
      }
         let result=await aggregateData({
              collection: schedulePostModel,
              aggregateCnd : cond
          })
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
        let cond=[
          {$match : where},
          {
            
              $lookup: {
                     from: "social_accounts",
                     localField: "accountId",
                     foreignField: "_id",
                     as: "data"
                   }
          },
          {$skip : ((page*limit)-limit)},
          { $limit : parseInt(limit) }
        ]
         let result=await aggregateData({
              collection: postModel,
              aggregateCnd : cond
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
          

            let userlist= await selectData({
              collection: socialAccountModel,
              data: {
                  _id : {$in : accounts}
              }
          })
          let sd = new Date(scheduleDate)
          let cd = new Date()
            if(type!="postnow")
            {
              for(let user of userlist)
              {
              
                let timezoneOffset = (new Date().getTimezoneOffset()/60)*-1
                let dif=TimeDiffrence(timezoneOffset,user.TimeZone.offset)
                let date=new Date(scheduleDate)
                if(user.TimeZone.offset>timezoneOffset)
                {
                  date.setMinutes(date.getMinutes() + dif)
                }else{
                  date.setMinutes(date.getMinutes() -dif)
                }
                
                 if (cd.getTime() > date.getTime()) {
                    sendResponse(res,401,"Please choose future date and time as per selected timezone.");
                    return
                }else{
                  userTimer[user._id]=date
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
                    scheduleDate :sd ,
                    accounts,
                    timeZone,
                    postDate :sd,
                }
            })
            let arr=[]
            accounts.map((ele)=>{
                let obj={
                    userId,
                    scheduleId :d1._id,
                    accountId : new mongoose.Types.ObjectId(ele),
                    caption ,
                    mediaUrl ,
                    type ,
                    scheduleDate  :sd,
                    postDate :type!="postnow" ? new Date(userTimer[ele]) : sd,
                }

                arr.push(obj)
                console.log({obj})
            })
            let post= await insertData({
                collection: postModel,
                data:arr
            })
            if(post){
              sendResponse(res,201,"Post Created Successfully.")
            }

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
      let { postList,scheduleDate,timeZone,type} = req.body;

      let valid=validateData( req?.body ?? {}, {
          postList : {
              type : "array"
          },
          scheduleDate : {
              type : "string"
          },
          timeZone : {
            type : "object"
          },
          
        })
        let userTimer={}
     let postData=[]
      for(let i=0;i<postList.length;i++)
      {
        let { title, caption, mediaUrl = [], accounts}=postList[i];
      
        let userlist= await selectData({
          collection: socialAccountModel,
          data: {
              _id : {$in : accounts}
          }
      })
      let sd = new Date(scheduleDate)
      let cd = new Date()
        if(type!="postnow")
        {
          for(let user of userlist)
          {
            let timezoneOffset = (new Date().getTimezoneOffset()/60)*-1
            let dif=TimeDiffrence(timezoneOffset,user.TimeZone.offset)
            let date=new Date(scheduleDate)
            if(user.TimeZone.offset>timezoneOffset)
            {
              date.setMinutes(date.getMinutes() + dif)
            }else{
              date.setMinutes(date.getMinutes() -dif)
            }
             if (cd.getTime() > date.getTime()) {
                sendResponse(res,401,"Please choose future date and time as per selected timezone.");
                return
            }else{
              userTimer[user._id]=date
            }
          }
        }

          let data ={
            type ,
            userId,
            caption,
            mediaUrl,
            scheduleDate :sd ,
            accounts,
            timeZone,
            postDate :sd,
          }
          postData.push(data)
      }
      for(let i =0 ; i<postData.length;i++){
        let {
          type ,
          userId,
          caption,
          mediaUrl,
          scheduleDate ,
          accounts,
          timeZone,
          postDate ,
        }=postData[i]

        let d1= await insertData({
          req, res,
          collection: schedulePostModel,
          data: {
              type ,
              userId,
              caption,
              mediaUrl,
              scheduleDate ,
              accounts,
              timeZone,
              postDate :sd,
          }
      })
      let arr=[]
      accounts.map((ele)=>{
          let obj={
              userId,
              scheduleId :d1._id,
              accountId : new mongoose.Types.ObjectId(ele),
              caption ,
              mediaUrl ,
              type ,
              scheduleDate  :sd,
              postDate :new Date(userTimer[ele]),
          }

          arr.push(obj)
      })
      let post= await insertData({
          req, res,
          collection: postModel,
          data:arr
      })

      }
       sendResponse(res,201,"Posts Created Successfully.")
        
    } catch (error) {
        console.log({error})
      sendResponse(res,500,"Someting went wrong",error)
    }

  }



  



  module.exports = scheduleController
