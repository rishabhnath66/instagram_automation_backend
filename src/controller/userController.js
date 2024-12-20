const { insertData, selectData, updateData, deleteData, countData } = require("../services/dbService");
const { encrypt, generateStrongPassword, comparePassword, manageJwtToken, validateData, sendResponse, } = require("../helper/comman");
const userModel = require("../model/usersModel")
const multer = require('multer');
const AWSHelper = require("../services/awsService");
const upload = multer().any()
const path = require('path');
const assetsModel = require("../model/assetsModel");

const userController = {}

userController.addUser = async (req, res) => {
  try {
    let { name, email, password, conectedAccount } = req?.body || {};
    let user = req.user
    let valid = validateData(req?.body ?? {}, {
      name: {
        type: "string"
      },
      email: {
        type: "string"
      },
      password: {
        type: "string"
      },
      conectedAccount: {
        type: "array"
      }
    })

    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    email = email.toLowerCase();
    let result = await selectData({
      req, res,
      collection: userModel,
      findOne: true,
      where: { email },
    })
    if (result) {
      sendResponse(res, 409, "User already Exists.")
    } else {
      await insertData({
        req, res,
        collection: userModel,
        data: {
          name,
          email,
          password: await encrypt(password),
          status: 1,
          accounts: conectedAccount,
          parentId: user._id,
          role: user.role == "admin" ? "subadmin" : "user"
        }
      })
      sendResponse(res, 201, "User Added Succesfully.")

    }
  } catch (e) {
    sendResponse(res, 500, "Something went wrong.");
  }
}


userController.getUserList = async (req, res) => {
  try {
    let { page, limit, keys } = req?.query || {};
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

    let where = { parentId: user._id }
    if (keys) {
      where.name = { $regex: keys, $options: "i" }
    }
    console.log({ where })
    let result = await selectData({
      collection: userModel,
      where,
      limit: limit,
      page: page,
    })
    let count = await countData({
      collection: userModel,
      where,
    })
    console.log({ result }, { count })
    let data = {
      data: result,
      count: count
    }
    sendResponse(res, 200, "", data)
  } catch (e) {
    sendResponse(res, 500, "Something went wrong.");
  }
}


userController.updateUser = async (req, res) => {
  try {
    let { name, email, password, conectedAccount, target } = req?.body || {};
    let user = req.user
    let valid = validateData(req?.body ?? {}, {
      name: {
        type: "string"
      },
      email: {
        type: "string"
      },
      conectedAccount: {
        type: "array"
      },
      target: {
        type: "string"
      }
    })

    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let result = await selectData({
      req, res,
      collection: userModel,
      findOne: true,
      where: { _id: target, parentId: user._id, },
    })
    if (!result) {
      sendResponse(res, 409, "User not exits.")
    } else {
      let data = {
        name,
        status: 1,
        accounts: conectedAccount,
      }
      if (password) {
        data.password = await encrypt(password)
      }
      console.log({ data })
      await updateData({
        req, res,
        collection: userModel,
        where: { _id: target },
        data,
        limit: 1
      })
      sendResponse(res, 200, "User Updated Succesfully.")

    }
  } catch (e) {
    sendResponse(res, 500, "Something went wrong.");
  }
}


userController.deleteUser = async (req, res) => {
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
      collection: userModel,
      limit: 1,
      where: { _id: target, parentId: user._id, },
    })
    console.log({ result }, result.deletedCount, "pppp")
    if (result?.deletedCount == 0) {
      sendResponse(res, 400, "User not exits.")
    } else {
      sendResponse(res, 200, "User Deleted Succesfully.")
    }
  } catch (e) {
    console.log({ e })
    sendResponse(res, 500, "Something went wrong.");
  }
}

userController.getUserLogin = async (req, res) => {
  try {
    let { target } = req?.query || {};
    let user = req.user
    let valid = validateData(req?.query ?? {}, {
      target: {
        type: "string"
      }
    })

    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let checkUser = await selectData({
      req, res,
      collection: userModel,
      findOne: true,
      where: { _id: target, parentId: user._id, },
    })
    if (!checkUser) {
      sendResponse(res, 409, "User not exits.")
    } else {
      var token = await manageJwtToken(checkUser);
      let data = {
        token
      }
      sendResponse(res, 200, "", data)

    }
  } catch (e) {
    console.log({ e })
    sendResponse(res, 500, "Something went wrong.");
  }
}
userController.changeStatus = async (req, res) => {
  try {
    let { status, target } = req?.body || {};
    let user = req.user
    let valid = validateData(req?.body ?? {}, {
      status: {
        type: "boolean"
      },
      target: {
        type: "string"
      },

    })

    if (Object.keys(valid).length != 0) {
      sendResponse(res, 400, valid)
      return
    }
    let result = await selectData({
      req, res,
      collection: userModel,
      findOne: true,
      where: { _id: target, parentId: user._id, },
    })
    if (!result) {
      sendResponse(res, 409, "User not exits.")
    } else {
      let data = {
        status,
      }
      await updateData({
        req, res,
        collection: userModel,
        where: { _id: target },
        data,
        limit: 1
      })
      sendResponse(res, 200, "User Status updated.")

    }
  } catch (e) {
    sendResponse(res, 500, "Something went wrong.");
  }
}

userController.getDatabyToken = async (req, res) => {
  try {
    let user = req.user
    let checkUser = await selectData({
      req, res,
      collection: userModel,
      findOne: true,
      where: { _id: user._id, },
    })
    if (!checkUser) {
      sendResponse(res, 409, "User not exits.")
    } else {
      let authData = {
        userId: checkUser._id,
        role: checkUser.role,
        email: checkUser.email,
        name: checkUser.name,
        profilePic: checkUser.profilePic,
      };
      sendResponse(res, 200, "", authData)

    }
  } catch (e) {
    console.log({ e })
    sendResponse(res, 500, "Something went wrong.", e);
  }
}


userController.uploadMedia = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        sendResponse(res, 500, "Something went wrong.", err);
      } else if (err) {
        sendResponse(res, 500, "Something went wrong.", err);
      } else {

        let user = req.user
        let data = {}
        if (req.files) {
          data.title = req.body.title
          data.mediaType = req.body.mediaType
          for (let file of req.files) {
            let ext = path.extname(file.originalname)
            let name = "File_" + Date.now() + ext
            let remotepath = `instragram/user/${user._id}/` + name
            let f1 = await AWSHelper.uploadS3(file, remotepath, {})
            data.files = {
              ...data?.files,
              [file.fieldname]: f1.Key
            }
          }
          console.log({ data })
          let d2 = await insertData({
            collection: assetsModel,
            data,
          })
          if (d2) {
            sendResponse(res, 201, "file upload successfully.", data)
          }
        }
      }
    })
  } catch (e) {
    console.log({ e })
  }
}


userController.updateUserdata = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        sendResponse(res, 500, "Something went wrong.", err);
      } else if (err) {
        sendResponse(res, 500, "Something went wrong.", err);
      } else {
        console.log("req,", req.body.name)
        let user = req.user;
        let { name, password } = req.body;
        console.log("name, password", name, password)
        let data = {};
        let valid = validateData({ name }, {
          name: {
            type: "string",
          },
        });

        if (Object.keys(valid).length != 0) {
          sendResponse(res, 400, valid);
          return;
        }
        data = { name };
        if (req.files) {
          console.log(req.files)

          for (let file of req.files) {
            let ext = path.extname(file.originalname);
            let name = "File_" + Date.now() + ext;
            let remotepath = `instragram/user/${user._id}/` + name;
            let f1 = await AWSHelper.uploadS3(file, remotepath, {});
            console.log({ f1 })
            data.profilePic = f1?.Key;
          }
        }

        let result = await selectData({
          collection: userModel,
          findOne: true,
          where: { _id: user._id },
        });
        if (!result) {
          sendResponse(res, 409, "User not exits.");
        } else {
          data.name = name
          if (password) {
            data.password = await encrypt(password);
          }
          console.log({ data })
          await updateData({
            req,
            res,
            collection: userModel,
            where: { _id: user._id },
            data,
            limit: 1,
          });
          sendResponse(res, 200, "User Updated Succesfully.");
        }
      }
    });
  } catch (e) {
    console.log({ e });
  }
};

module.exports = userController;
