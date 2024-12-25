const axios = require("axios")
const { insertData, selectData, updateData, countData, aggregateData, deleteData } = require("../services/dbService");
const { encrypt, generateStrongPassword, comparePassword, manageJwtToken, validateData, sendResponse, } = require("../helper/comman");
const schedulePostModel = require("../model/schedulePostModel");
const socialAccountModel = require("../model/socialAccountModel");
const postModel = require("../model/postModel");
const scheduleController = {}
const mongoose = require('mongoose');

const TimeDiffrence = (offset1, offset2) => {
  const diff = offset1 - offset2;
  const min = diff * 60
  return min;
}
scheduleController.getCalenderPost = async (req, res) => {
  try {
    let { page, limit, keys, startDate, endDate } = req?.query || {};
    let user = req.user
    let valid = validateData(req?.query ?? {}, {
      page: {
        type: "string"
      },
      limit: {
        type: "string"
      },
    })

    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let where = { userId: user._id }
    if (keys) {
      where.name = { $regex: keys, $options: "i" }
    }

    if (startDate && endDate && startDate.trim() != '' && endDate.trim() != '') {
      where.postDate = {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
      };
    }
    //  let cond=[
    //   {$match : where},
    //   {

    //       $lookup: {
    //              from: "social_accounts",
    //              localField: "accounts",
    //              foreignField: "_id",
    //              as: "data"
    //            }
    //   }]
    //   if (!(startDate && endDate && startDate.trim() != '' && endDate.trim() != '')) {
    //     cond.push({$skip : ((page*limit)-limit)})
    //     cond.push({ $limit : parseInt(limit) })
    // }

    let result = await selectData({
      collection: postModel,
      where: where
    })
    let count = await countData({
      collection: postModel,
      where,
    })
    let data = {
      data: result,
      count: count
    }
    sendResponse(res, 200, "", data)
  } catch (e) {
    console.log({ e })
    sendResponse(res, 500, "Something went wrong.");
  }

}
scheduleController.getPost = async (req, res) => {
  try {
    let { page, limit, keys, startDate, endDate } = req?.query || {};
    let user = req.user
    let valid = validateData(req?.query ?? {}, {
      page: {
        type: "string"
      },
      limit: {
        type: "string"
      },
    })

    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let where = { userId: user._id }
    if (keys) {
      where.name = { $regex: keys, $options: "i" }
    }

    if (startDate && endDate && startDate.trim() != '' && endDate.trim() != '') {
      where.postDate = {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
      };
    }
    let cond = [
      {
        $match: where
      },
      {
        $lookup: {
          from: "social_accounts",
          localField: "accounts",
          foreignField: "_id",
          as: "data"
        }
      },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "scheduleId",
          as: "postdata"
        }
      },
      {
        $match: {
          "postdata.0": { $exists: true }
        }
      },
      {
        $project: {
          scheduleDate: -1,
          caption: -1,
          mediaUrl: -1,
          data: -1,
          _id: 1,
          status: {
            $cond: {
              if: {
                $eq: [
                  {
                    $size: {
                      $filter: {
                        input: "$postdata",
                        as: "item",
                        cond: { $eq: ["$$item.status", "completed"] }
                      }
                    }
                  },
                  { $size: "$postdata" }
                ]
              },
              then: "completed",
              else: {
                $cond: {
                  if: {
                    $eq: [
                      {
                        $size: {
                          $filter: {
                            input: "$postdata",
                            as: "item",
                            cond: { $eq: ["$$item.status", "initialize"] }
                          }
                        }
                      },
                      { $size: "$postdata" }
                    ]
                  },
                  then: "pending",
                  else: {
                    $cond: {
                      if: {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: "$postdata",
                                as: "item",
                                cond: { $eq: ["$$item.status", "Failed"] }
                              }
                            }
                          },
                          0
                        ]
                      },
                      then: "Partial Published",
                      else: "In Process"
                    }
                  }
                }
              }
            }
          },
          post: {
            $cond: {
              if: { $eq: [1, { $size: "$postdata" }] },
              then: "$postdata",
              else: []
            }
          }
        }
      }
    ]

    cond.push({ $sort: { _id: -1 } })
    if (!(startDate && endDate && startDate.trim() != '' && endDate.trim() != '')) {
      cond.push({ $skip: ((page * limit) - limit) })
      cond.push({ $limit: parseInt(limit) })
    }
    let result = await aggregateData({
      collection: schedulePostModel,
      aggregateCnd: cond
    })
    let count = await countData({
      collection: schedulePostModel,
      where,
    })
    let data = {
      data: result,
      count: count
    }
    sendResponse(res, 200, "", data)
  } catch (e) {
    console.log({ e })
    sendResponse(res, 500, "Something went wrong.");
  }

}

// scheduleController.getPost=async (req, res) => {
//     try {
//         let {page , limit,keys,startDate,endDate} =  req?.query || {};  
//         let user=req.user
//         let valid=validateData( req?.query ?? {}, {
//           page : {
//             type : "string"
//           },
//           limit : {
//             type : "string"
//           },
//         })

//         if(Object.keys(valid).length!=0){
//           sendResponse(res,400,valid)
//           return
//         }
//         let where={userId :user._id }
//         if(keys)
//         {
//           where.name= { $regex: keys, $options: "i" } 
//         }

//         if (startDate && endDate && startDate.trim() != '' && endDate.trim() != '') {
//           where.postDate = {
//               $gte: new Date(startDate),
//               $lt: new Date(endDate)
//           };
//       }
//        let cond=[
//         {$match : where},
//         {

//             $lookup: {
//                    from: "social_accounts",
//                    localField: "accounts",
//                    foreignField: "_id",
//                    as: "data"
//                  }
//         }]
//         if (!(startDate && endDate && startDate.trim() != '' && endDate.trim() != '')) {
//           cond.push({$skip : ((page*limit)-limit)})
//           cond.push({ $limit : parseInt(limit) })
//       }
//          let result=await aggregateData({
//               collection: schedulePostModel,
//               aggregateCnd : cond
//           })
//           let count=await countData({
//           collection: schedulePostModel,
//             where,
//         })
//         let data ={
//           data : result,
//           count : count
//         }
//         console.log({data})
//           sendResponse(res,200,"",data)
//       } catch (e) {
//         console.log({e})
//         sendResponse(res,500, "Something went wrong.");
//       }

//   }
scheduleController.multipost = async (req, res) => {
  try {
    let { page, limit, keys, target, sort = "" } = req?.query || {};
    let user = req.user
    let valid = validateData(req?.query ?? {}, {
      target: {
        type: "string"
      },
      // page : {
      //   type : "string"
      // },
      // limit : {
      //   type : "string"
      // },
    })
    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }

    let where = { userId: user._id, scheduleId: new mongoose.Types.ObjectId(target) };
    if (keys) {
      where.name = { $regex: keys, $options: "i" }
    }
    let cond = [
      { $match: where },
      {

        $lookup: {
          from: "social_accounts",
          localField: "accountId",
          foreignField: "_id",
          as: "data"
        }
      },
      // {$skip : ((page*limit)-limit)},
      // { $limit : parseInt(limit) },
    ]
    if (sort) {
      let s1 = sort.split("=")
      if (s1.length > 0) {

        cond.push({ $sort: { [s1[0]]: parseInt(s1[1]) } })
        // cond.push({$sort : {_id :-1}})
      }

    }
    let result = await aggregateData({
      collection: postModel,
      aggregateCnd: cond
    })
    let count = await countData({
      collection: postModel,
      where,

    })
    let data = {
      data: result,
      count: count
    }
    sendResponse(res, 200, "", data)
  } catch (e) {
    console.log({ e })
    sendResponse(res, 500, "Something went wrong.");
  }

}
scheduleController.createPost = async (req, res) => {
  try {
    let { caption, mediaUrl = [], scheduleDate, accounts, timeZone, type, postDate, offset } = req.body;

    let valid = validateData(req?.body ?? {}, {
      caption: {
        type: "string"
      },
      mediaUrl: {
        type: "array"
      },
      scheduleDate: {
        type: "string"
      },
      accounts: {
        type: "array"
      },
      offset: {
        type: "number"
      },
      type: {
        type: "string"
      },
    })
    let userTimer = {}
    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let userId = req.user._id


    let userlist = await selectData({
      collection: socialAccountModel,
      where: {
        _id: { $in: accounts }
      }
    })
    let sd = new Date(scheduleDate)
    let cd = new Date()
    if (type != "postnow") {
      for (let user of userlist) {

        let timezoneOffset = (new Date().getTimezoneOffset() / 60) * -1
        let dif = TimeDiffrence(timezoneOffset, user.TimeZone.offset)
        let date = new Date(scheduleDate)
        if (user.TimeZone.offset > timezoneOffset) {
          date.setMinutes(date.getMinutes() + dif)
        } else {
          date.setMinutes(date.getMinutes() - dif)
        }

        if (cd.getTime() > date.getTime()) {
          sendResponse(res, 401, "Please choose future date and time as per selected timezone.");
          return
        } else {
          userTimer[user._id] = date
        }
      }
    }


    const dat = new Date();
    accounts = accounts.map((ele) => new mongoose.Types.ObjectId(ele))
    let d1 = await insertData({
      req, res,
      collection: schedulePostModel,
      data: {
        type,
        userId,
        caption,
        mediaUrl,
        scheduleDate: sd,
        accounts,
        timeZone,
        postDate: sd,
      }
    })
    let arr = []

    accounts.map((ele) => {
      console.log({ type }, userTimer, userTimer[ele], (type != "postnow" ? new Date(userTimer[ele]) : sd))
      let obj = {
        userId,
        scheduleId: d1._id,
        accountId: new mongoose.Types.ObjectId(ele),
        caption,
        mediaUrl,
        type,
        scheduleDate: sd,
        postDate: (type != "postnow" ? new Date(userTimer[ele]) : sd),
      }

      arr.push(obj)
    })
    let post = await insertData({
      collection: postModel,
      data: arr
    })
    if (post) {
      sendResponse(res, 201, "Post Created Successfully.")
    }

  } catch (error) {
    console.log({ error })
    sendResponse(res, 500, "Someting went wrong", error)
  }

}

scheduleController.multiCreatePost = async (req, res) => {
  try {
    let { caption, mediaUrl = [], scheduleDate, accounts, timeZone, type, postDate, offset } = req.body;

    let valid = validateData(req?.body ?? {}, {
      caption: {
        type: "string"
      },
      mediaUrl: {
        type: "array"
      },
      scheduleDate: {
        type: "string"
      },
      accounts: {
        type: "array"
      },
      offset: {
        type: "number"
      },
      type: {
        type: "string"
      },
    })
    let userTimer = {}
    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let userId = req.user._id


    let userlist = await selectData({
      collection: socialAccountModel,
      where: {
        _id: { $in: accounts }
      }
    })
    let sd = new Date(scheduleDate)
    let cd = new Date()
    if (type != "postnow") {
      for (let user of userlist) {

        let timezoneOffset = (new Date().getTimezoneOffset() / 60) * -1
        let dif = TimeDiffrence(timezoneOffset, user.TimeZone.offset)
        let date = new Date(scheduleDate)
        if (user.TimeZone.offset > timezoneOffset) {
          date.setMinutes(date.getMinutes() + dif)
        } else {
          date.setMinutes(date.getMinutes() - dif)
        }

        if (cd.getTime() > date.getTime()) {
          sendResponse(res, 401, "Please choose future date and time as per selected timezone.");
          return
        } else {
          userTimer[user._id] = date
        }
      }
    }


    const dat = new Date();
    accounts = accounts.map((ele) => new mongoose.Types.ObjectId(ele))
    let d1 = await insertData({
      req, res,
      collection: schedulePostModel,
      data: {
        type,
        userId,
        caption,
        mediaUrl,
        scheduleDate: sd,
        accounts,
        timeZone,
        postDate: sd,
      }
    })
    let arr = []

    accounts.map((ele) => {
      console.log({ type }, userTimer, userTimer[ele], (type != "postnow" ? new Date(userTimer[ele]) : sd))
      let obj = {
        userId,
        scheduleId: d1._id,
        accountId: new mongoose.Types.ObjectId(ele),
        caption,
        mediaUrl,
        type,
        scheduleDate: sd,
        postDate: (type != "postnow" ? new Date(userTimer[ele]) : sd),
      }

      arr.push(obj)
    })
    let post = await insertData({
      collection: postModel,
      data: arr
    })
    if (post) {
      sendResponse(res, 201, "Post Created Successfully.")
    }

  } catch (error) {
    console.log({ error })
    sendResponse(res, 500, "Someting went wrong", error)
  }

}

scheduleController.updatePost = async (req, res) => {
  try {
    let { title, caption, mediaUrl = [], scheduleDate, accounts, timeZone, postDate, target } = req.body;

    let valid = validateData(req?.body ?? {}, {
      title: {
        type: "string"
      },
      caption: {
        type: "string"
      },
      mediaUrl: {
        type: "array"
      },
      scheduleDate: {
        type: "string"
      },
      accounts: {
        type: "array"
      },
      timeZone: {
        type: "object"
      },
      postDate: {
        type: "string"

      },
      type: {
        type: "string"
      },
      target: {
        type: "string"
      }
    })
    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    // let userId=req.user._id

    const d = new Date();
    let sd = postDate ? new Date(postDate) : new Date();
    if (new Date() > sd) {
      sendResponse(res, 401, "Please choose future date and time as per selected timezone.");
      return
    }
    if (target) {
      let d1 = await selectData({
        collection: schedulePostModel,
        where: { _id: target }
      })
      if (d1) {
        let update = await updateData({
          collection: schedulePostModel,
          where: { _id: target },
          data: {
            title,
            caption,
            mediaUrl,
            scheduleDate: sd,
            accounts,
            timeZone,
            postDate: sd,
          }
        })
        if (update) {
          sendResponse(res, 200, "Post updated Sucessfully.");
          return
        }
      }
    } else {
      sendResponse(res, 204, "Post Not Found");
      return
    }



  } catch (error) {
    console.log({ error })
    sendResponse(res, 500, "Someting went wrong", error)
  }

}


scheduleController.multiCreatePost = async (req, res) => {
  try {
    let { postList, scheduleDate, timeZone, type } = req.body;

    console.log('body data ', req.body);

    let valid = validateData(req?.body ?? {}, {
      postList: {
        type: "array"
      },
      scheduleDate: {
        type: "string"
      },
      timeZone: {
        type: "object"
      },

    })
    let userId = req.user._id
    let userTimer = {}
    let postData = []
    let sd = new Date(scheduleDate)

    console.log('postList', postList);

    for (let i = 0; i < postList.length; i++) {
      let { title, text, image = [], accId } = postList[i];

      let caption, mediaUrl = [], accounts = []
      caption = text
      mediaUrl = [{ mediaType: 'image', mediaUrl: image }]
      accounts.push(accId)
      console.log('accounts', accounts);

      let userlist = await selectData({
        collection: socialAccountModel,
        data: {
          _id: { $in: accounts }
        }
      })
      console.log('userlist', userlist);

      let cd = new Date()
      if (type != "postnow") {
        for (let user of userlist) {
          let timezoneOffset = (new Date().getTimezoneOffset() / 60) * -1
          let dif = TimeDiffrence(timezoneOffset, user.TimeZone.offset)
          let date = new Date(scheduleDate)
          if (user.TimeZone.offset > timezoneOffset) {
            date.setMinutes(date.getMinutes() + dif)
          } else {
            date.setMinutes(date.getMinutes() - dif)
          }
          if (cd.getTime() > date.getTime()) {
            sendResponse(res, 401, "Please choose future date and time as per selected timezone.");
            return
          } else {
            userTimer[user._id] = date
          }
        }
      }

      let data = {
        type,
        userId,
        caption,
        mediaUrl,
        scheduleDate: sd,
        accounts,
        timeZone,
        postDate: sd,
      }
      postData.push(data)
    }
    for (let i = 0; i < postData.length; i++) {
      let {
        type,
        userId,
        caption,
        mediaUrl,
        scheduleDate,
        accounts,
        timeZone,
        postDate: sd,
      } = postData[i]

      let d1 = await insertData({
        req, res,
        collection: schedulePostModel,
        data: {
          type,
          userId,
          caption,
          mediaUrl,
          scheduleDate,
          accounts,
          timeZone,
          postDate: sd,
        }
      })
      let arr = []
      accounts.map((ele) => {
        let obj = {
          userId,
          scheduleId: d1._id,
          accountId: new mongoose.Types.ObjectId(ele),
          caption,
          mediaUrl,
          type,
          scheduleDate: sd,
          postDate: (type != "postnow" ? new Date(userTimer[ele]) : sd),
        }
        arr.push(obj)
      })
      let post = await insertData({
        req, res,
        collection: postModel,
        data: arr
      })

    }
    sendResponse(res, 201, "Posts Created Successfully.")

  } catch (error) {
    console.log({ error })
    sendResponse(res, 500, "Someting went wrong", error)
  }

}

scheduleController.deletePost = async (req, res) => {
  try {
    let { target } = req?.body || {};
    let user = req.user
    let valid = validateData(req?.body ?? {}, {
      target: {
        type: "string"
      }
    })
    console.log({ target })
    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let result = await deleteData({
      collection: postModel,
      limit: 1,
      where: {
        _id: target, userId: user._id
      },
    })
    if (result?.deletedCount == 0) {
      sendResponse(res, 400, "This post not exits.")
    } else {
      sendResponse(res, 200, "Post Deleted Succesfully.")
    }
  } catch (e) {
    console.log({ e })
    sendResponse(res, 500, "Something went wrong.");
  }
}

scheduleController.textVariation = async (req, res) => {
  try {
    let postData = req.body;
    console.log('postData', postData.accounts);

    let data = {
      text: `This is my content for facebook post.`
    }
    // let variation = await comman.generatePostVariation(data)

    let variation = await postDescriptions(postData.accounts)


    console.log('variation', variation);
    sendResponse(res, 201, "variation created successfully.", variation)
  }
  catch (error) {
    console.log({ error })
    sendResponse(res, 500, "Someting went wrong", error)
  }
}

async function postDescriptions(acc) {
  let des = [
    { description: 'This is my description 1' },
    { description: 'This is my description 2' },
    { description: 'This is my description 3' },
    { description: 'This is my description 4' },
    { description: 'This is my description 5' }
  ]

  let newarr = []
  const lengthToCheck = Math.min(acc.length, des.length);
  for (let i = 0; i < lengthToCheck; i++) {
    newarr.push(des[i]);
  }

  return newarr;
}



module.exports = scheduleController
