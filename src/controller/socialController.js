const axios = require("axios")
const { insertData, selectData, updateData, countData, deleteData } = require("../services/dbService");
const { encrypt, generateStrongPassword, comparePassword, manageJwtToken, validateData, sendResponse, } = require("../helper/comman");
const socialAccountModel = require("../model/socialAccountModel");
const socialController = {}
const TimeZone = require("../data/timeZone");
const { default: mongoose } = require("mongoose");


socialController.addAccount = async (req, res) => {
  try {
    let userdata = req.query.state
    userdata = JSON.parse(userdata)
    let reqobj = req.query;
    let response;
    response = await instragramAccAdd(reqobj.code, reqobj.redirect_uri)
    if (response?.status) {
      let id = response.data.id;
      let where = {
        userId: userdata.id,
        accountId: id,
      };
      if (userdata.target) {
        where._id = userdata.target
      }
      let useraccount = await selectData({
        collection: socialAccountModel,
        findOne: true,
        where,
        req, res
      });
      let t1 = TimeZone.find((s1) => s1.offset == userdata.timeZone)
      if (userdata.target) {
        if (useraccount) {
          let updateAcc = await updateData({
            collection: socialAccountModel,
            limit: 1,
            where,
            data: {
              $set: { data: response.data, status: true, TimeZone: t1 }
            },
            req, res,
          });
          res.json({ status: true, message: "Account Updated Succesfully." });
        } else {
          res.json({ status: true, message: "Please select proper account." });
        }
      } else {
        if (!useraccount) {
          let updateAcc = await insertData({
            collection: socialAccountModel,
            data: {
              userId: userdata.id,
              accountId: id,
              data: response.data,
              TimeZone: t1
            },
            req, res,
          });

          sendResponse(res, 200, "Account successfully connected.");
        } else {
          res.json({ status: true, message: "Account already exits" });
        }
      }
    }

  } catch (error) {
    console.log({ error })

    sendResponse(res, 500, "Someting went wrong", error)
  }

}

socialController.updateAccount = async (req, res) => {
  try {
    let { target, TimeZone } = req?.body || {};
    let user = req.user
    let valid = validateData(req?.body ?? {}, {
      target: {
        type: "string"
      },
      TimeZone: {
        type: "object"
      }
    })
    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let where = { _id: target }
    if (user.role == 'user') {
      where.userId = user._id
    }
    let result = await updateData({
      collection: socialAccountModel,
      limit: 1,
      where,
      data: {
        TimeZone: TimeZone,
      }
    })

    sendResponse(res, 200, "TimeZone Updated Successfully ")
  } catch (e) {
    console.log({ e })
    sendResponse(res, 500, "Something went wrong.");
  }
}


socialController.deleteAccount = async (req, res) => {
  try {
    let { target } = req?.body || {};
    let user = req.user
    let valid = validateData(req?.body ?? {}, {
      target: {
        type: "string"
      }
    })
    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let where = { _id: target }
    if (user.role == 'user') {
      where.userId = user._id
    }
    let result = await deleteData({
      collection: socialAccountModel,
      limit: 1,
      where,
    })
    if (result?.deletedCount == 0) {
      sendResponse(res, 400, "Account not exits.")
    } else {
      sendResponse(res, 200, "Account Deleted Succesfully.")
    }
  } catch (e) {
    console.log({ e })
    sendResponse(res, 500, "Something went wrong.");
  }
}

socialController.getInstragramAccountList = async (req, res) => {
  try {
    let { page, limit, keys, sort = "" } = req?.query || {};
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
    if (user.role == "subadmin") {
      where = { userId: user._id }
    } else {
      if (user.role == "user") {
        where = { _id: { $in: user.accounts } }
      }
    }

    if (keys) {
      where["data.username"] = { $regex: keys, $options: "i" }
    }

    let result = await selectData({
      collection: socialAccountModel,
      where,
      limit: limit,
      page: page,
      sort,
    })
    let count = await countData({
      collection: socialAccountModel,
      where,
    })
    let data = {
      data: result,
      count: count
    }
    sendResponse(res, 200, "", data)
  } catch (e) {
    console.log(e)
    sendResponse(res, 500, "Something went wrong.", e);
  }
}

socialController.getSelectedAccounts = async (req, res) => {
  try {
    let user = req.user
    let postData = req.body.accounts

    let objectIdList = postData.map(id => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ID format: ${id}`);
      }
      return new mongoose.Types.ObjectId(id);
    });

    let where = {
      userId: user._id,
      _id: { $in: postData }
    };

    let data = await socialAccountModel.find(where)
    sendResponse(res, 200, "", data)
  }
  catch (err) {
    console.log(err);

    sendResponse(res, 500, "Something went wrong.", err);
  }
}


socialController.getUserConnectedInstragramAccounts = async (req, res) => {
  try {
    let { ids } = req?.body || {};
    let user = req.user
    let valid = validateData(req?.body ?? {}, {
      ids: {
        type: "array"
      },
    })

    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let result = await selectData({
      collection: socialAccountModel,
      where: { _id: { $in: ids } },

    })
    let count = await countData({
      collection: socialAccountModel,
      where: { _id: { $in: ids } },
    })
    let data = {
      data: result,
      count: count
    }
    sendResponse(res, 200, "", data)
  } catch (e) {
    console.log(e)
    sendResponse(res, 500, "Something went wrong.", e);
  }
}
socialController.authLink = async (req, res) => {
  try {
    let user = req.user
    const redirectUri = `https://localhost:3001/auth/addSocialAccount`
    const clientId = "3874145586148497";
    const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish&state=${user._id}`;
    sendResponse(res, 200, "", {
      url: authUrl,
    });
  } catch (e) {
    sendResponse(res, 500, "Something went wrong.");
  }
}

const instragramAccAdd = async (code, redirect_uri) => {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `https://api.instagram.com/oauth/access_token`;
      let data = {
        client_id: "3874145586148497",
        grant_type: 'authorization_code',
        client_secret: "63bd7ccb9064cb48221acd67664983dc",
        code: code,
        redirect_uri: "https://instaapi.pixelnx.in/auth/addSocialAccount"
      };

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.instagram.com/oauth/access_token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: data
      };

      let data1 = await axios.request(config)
      data1 = data1.data
      let details = await axios.get(`https://graph.instagram.com/me?fields=id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count&access_token=${data1.access_token}`)
      let longtoken = await axios.get(`https://graph.instagram.com/access_token/?grant_type=ig_exchange_token&client_secret=63bd7ccb9064cb48221acd67664983dc&access_token=${data1.access_token}`)
      let dat = {
        ...details.data,
        ...longtoken.data,
      }
      resolve({ status: true, data: dat });
    }
    catch (e) {
      reject({ status: false, error: e })

    }
  })

}

module.exports = socialController
