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
    let where = { userId: user._id, isDeleted: { $ne: true } }
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
      { $match: where },
      {

        $lookup: {
          from: "social_accounts",
          localField: "accountId",
          foreignField: "_id",
          as: "data"
        }


      }]
    cond.push({ $sort: { _id: -1 } })
    if (!(startDate && endDate && startDate.trim() != '' && endDate.trim() != '')) {
      cond.push({ $skip: ((page * limit) - limit) })
      cond.push({ $limit: parseInt(limit) })
    }
    let result = await aggregateData({
      collection: postModel,
      aggregateCnd: cond
    })
    // let result = await selectData({
    //   collection: postModel,
    //   where: where
    // })
    let count = await countData({
      collection: postModel,
      where
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

function getStatusCondition(keys) {
  let regexPattern;

  if (keys == 2) {
    regexPattern = 'completed';
  } else if (keys == 4) {
    regexPattern = 'initialize';
  } else if (keys == 5) {
    regexPattern = 'Failed';
  } else {
    regexPattern = null;
  }

  return regexPattern
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

    console.log('keys', keys);

    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let where = { userId: user._id }
    // if (keys && keys != 1) {
    //   if (keys == 2) where.status = { $regex: "completed", $options: "i" }
    //   if (keys == 4) where.status = { $regex: "initialize", $options: "i" }
    //   if (keys == 5) where.status = { $regex: "Failed", $options: "i" }
    // }

    if (startDate && endDate && startDate.trim() != '' && endDate.trim() != '') {
      where.postDate = {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
      };
    }


    let matchCondition;
    let regextcontent = "";

    if (keys && keys != 1) {
      regextcontent = getStatusCondition(keys);
      matchCondition = {
        $match: {
          "filteredPostData.0": { $exists: true }
        }
      };
    } else {
      matchCondition = {
        $match: {
          $expr: { $gt: [{ $size: "$postdata" }, 0] }
        }
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
          $expr: { $gt: [{ $size: "$postdata" }, 0] }
        }
      },
      {
        $project: {
          scheduleDate: -1,
          caption: -1,
          mediaUrl: -1,
          data: -1,
          postdata: 1,
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
          },
          filteredPostData: {
            $cond: {
              if: { $and: [{ $ne: [keys, undefined] }, { $ne: [keys, 1] }] },
              then: {
                $filter: {
                  input: "$postdata",
                  as: "item",
                  cond: { $eq: ["$$item.status", regextcontent] }
                }
              },
              else: "$postdata"
            }
          }
        }
      },
      matchCondition

    ];


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

// scheduleController.multiCreatePostefe = async (req, res) => {
//   try {
//     let { caption, mediaUrl = [], scheduleDate, accounts, timeZone, type, postDate, offset } = req.body;

//     let valid = validateData(req?.body ?? {}, {
//       caption: {
//         type: "string"
//       },
//       mediaUrl: {
//         type: "array"
//       },
//       scheduleDate: {
//         type: "string"
//       },
//       accounts: {
//         type: "array"
//       },
//       offset: {
//         type: "number"
//       },
//       type: {
//         type: "string"
//       },
//     })
//     let userTimer = {}
//     // if (Object.keys(valid).length != 0) {
//     //   sendResponse(res, 400, valid)
//     //   return
//     // }
//     let userId = req.user._id


//     let userlist = await selectData({
//       collection: socialAccountModel,
//       where: {
//         _id: { $in: accounts }
//       }
//     })
//     let sd = new Date(scheduleDate)
//     let cd = new Date()
//     if (type != "postnow") {
//       for (let user of userlist) {

//         let timezoneOffset = (new Date().getTimezoneOffset() / 60) * -1
//         let dif = TimeDiffrence(timezoneOffset, user.TimeZone.offset)
//         let date = new Date(scheduleDate)
//         if (user.TimeZone.offset > timezoneOffset) {
//           date.setMinutes(date.getMinutes() + dif)
//         } else {
//           date.setMinutes(date.getMinutes() - dif)
//         }

//         if (cd.getTime() > date.getTime()) {
//           sendResponse(res, 401, "Please choose future date and time as per selected timezone.");
//           return
//         } else {
//           userTimer[user._id] = date
//         }
//       }
//     }


//     const dat = new Date();
//     accounts = accounts.map((ele) => new mongoose.Types.ObjectId(ele))
//     let d1 = await insertData({
//       req, res,
//       collection: schedulePostModel,
//       data: {
//         type,
//         userId,
//         caption,
//         mediaUrl,
//         scheduleDate: sd,
//         accounts,
//         timeZone,
//         postDate: sd,
//       }
//     })
//     let arr = []

//     accounts.map((ele) => {
//       console.log({ type }, userTimer, userTimer[ele], (type != "postnow" ? new Date(userTimer[ele]) : sd))
//       let obj = {
//         userId,
//         scheduleId: d1._id,
//         accountId: new mongoose.Types.ObjectId(ele),
//         caption,
//         mediaUrl,
//         type,
//         scheduleDate: sd,
//         postDate: (type != "postnow" ? new Date(userTimer[ele]) : sd),
//       }

//       arr.push(obj)
//     })
//     let post = await insertData({
//       collection: postModel,
//       data: arr
//     })
//     if (post) {
//       sendResponse(res, 201, "Post Created Successfully.")
//     }

//   } catch (error) {
//     console.log({ error })
//     sendResponse(res, 500, "Someting went wrong", error)
//   }

// }

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


scheduleController.updatePostData = async (req, res) => {
  try {
    let { title, scheduleId, caption, mediaUrl = [], scheduleDate, accounts, timeZone, postDate, target } = req.body;

    // let userId=req.user._id

    const d = new Date();
    let sd = postDate ? new Date(postDate) : new Date();
    if (new Date() > sd) {
      sendResponse(res, 401, "Please choose future date and time as per selected timezone.");
      return
    }
    let id
    if (target) {
      let d1 = await selectData({
        collection: postModel,
        where: { _id: target }
      })
      if (d1) {
        let data = {}
        if (caption) { data.caption = caption }
        if (mediaUrl.length > 0) { data.mediaUrl = mediaUrl }
        if (scheduleDate) { data.scheduleDate = new Date(scheduleDate) }

        console.log('data', data);

        let update = await updateData({
          collection: postModel,
          where: { _id: target },
          data: data
        })
        if (update) {
          sendResponse(res, 200, "Post updated Sucessfully.", update);
          return
        }
      }
    }
    else if (scheduleId) {
      let d1 = await selectData({
        collection: schedulePostModel,
        where: { _id: scheduleId }
      })
      if (d1) {
        let data = {}
        if (caption) { data.caption = caption }
        if (mediaUrl.length > 0) { data.mediaUrl = mediaUrl }

        console.log('data', data);

        let update = await updateData({
          collection: schedulePostModel,
          where: { _id: scheduleId },
          data: data
        })
        if (update) {
          sendResponse(res, 200, "Post updated Sucessfully.", update);
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

    let userId = req.user._id
    let userTimer = {}
    let postData = []
    let sd = new Date(scheduleDate)

    console.log('postList', postList);

    let mainCaption = postList[0].text
    let mainMedia = [{ mediaType: 'image', mediaUrl: postList[0].image }]


    for (let i = 0; i < postList.length; i++) {
      let { title, text, image = [], accId } = postList[i];

      let caption, mediaUrl = []
      caption = text
      mediaUrl = [{ mediaType: 'image', mediaUrl: image }]
      let accounts = []
      accounts.push(accId)

      let userlist = await selectData({
        collection: socialAccountModel,
        data: {
          _id: { $in: accounts }
        }
      })

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

    }

    sendResponse(res, 201, "Posts Created Successfully.")

  } catch (error) {
    console.log({ error })
    sendResponse(res, 500, "Someting went wrong", error)
  }

}

scheduleController.deletePost = async (req, res) => {
  try {
    let { target, scheduleId, type } = req?.body || {};
    let user = req.user


    console.log(target, scheduleId)
    let where = {}
    let result
    if (target) {
      where = {
        _id: target, userId: user._id
      }
      let selecteddata = await selectData({
        collection: postModel,
        where: where
      })
      if (selecteddata) {
        let sp = await selectData({
          collection: schedulePostModel,
          where: { _id: selecteddata[0].scheduleId, userId: user._id }
        })
        if (sp.length) {
          let dacc = sp[0].accounts.filter(item => !item.equals(selecteddata[0].accountId));
          let update = await updateData({
            collection: schedulePostModel,
            where: { _id: sp[0]._id },
            data: {
              accounts: dacc,
            }
          })
        }
        result = await deleteData({
          collection: postModel,
          limit: 1,
          where: where
        })
      }
    }

    if (scheduleId) {
      result = await deleteData({
        collection: schedulePostModel,
        where: { _id: scheduleId, userId: user._id },
      })
      result = await deleteData({
        collection: postModel,
        limit: 1,
        where: { scheduleId: scheduleId, userId: user._id }
      })
    }

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




scheduleController.deleteSinglePost = async (req, res) => {
  try {
    let { target, scheduleId, type } = req?.body || {};
    let user = req.user;
    console.log("Request body:", req.body);

    if (!target && type == "single") {
      return sendResponse(res, 400, "Target ID is required for single deletion.");
    }

    let where = { userId: user._id, target };
    console.log("User ID:", user._id);
    console.log("Where condition:", where);

    if (type === "single") {
      where._id = target;
      let sp = await selectData({
        collection: postModel,
        where
      });
      console.log("Selected Posts:", sp);

      if (sp.length) {
        let result = await deleteData({
          collection: postModel,
          limit: 1,
          where
        });

        if (result.deletedCount > 0) {
          await handleScheduleUpdate(target, user._id);
          return sendResponse(res, 200, "Single post deleted successfully.");
        }
      }
    } else if (type === "schedule") {
      where.scheduleId = scheduleId;
      let sp = await selectData({
        collection: postModel,
        where,
        findOne: true
      });

      if (sp) {
        await deleteData({ collection: postModel, where });


        await deleteData({ collection: postModel, where: { scheduleId: sp._id } });
        await handleScheduleUpdate(scheduleId, user._id, true);
        return sendResponse(res, 200, "Scheduled posts deleted successfully.");
      }
    }


    sendResponse(res, 400, "Failed to delete post.");
  } catch (e) {
    console.error("Error deleting post:", e);
    sendResponse(res, 500, "Something went wrong.");
  }
};







const handleScheduleUpdate = async (id, userId, isSchedule = false) => {
  let sp = await selectData({
    collection: schedulePostModel,
    where: { _id: id, userId }
  });

  if (sp && sp.length > 0) {
    let updatedAccounts = sp[0].accounts.filter(item => item !== id);

    if (updatedAccounts.length === 0) {
      await deleteData({
        collection: schedulePostModel,
        where: { _id: sp[0]._id, userId }
      });
    } else {
      await updateData({
        collection: schedulePostModel,
        where: { _id: sp[0]._id },
        data: { accounts: updatedAccounts }
      });
    }
  }
};

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
