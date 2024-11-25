const {insertData, selectData, updateData } = require("../services/dbservice");
const {encrypt, generateStrongPassword, comparePassword, manageJwtToken, validateData, sendResponse ,} = require("../helper/comman");
const userModel = require("../model/usersModel")
const authController = {}

authController.login=async (req, res) => {
    try {
      let {email, password } = req.body
      let valid=validateData( req.body, {
        email : {
          type : "string"
        },
        password : {
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
        where: { email },
    })
        if (checkUser) {
         if(checkUser.isDeleted){
                sendResponse(res,422 ,valid)
            }else if(!checkUser.status){
               sendResponse(res,403, "Your account is in-active, please contact to admin.");
            }else{
                comparePassword( password, checkUser.password, (err, isMatch) => {//login with real password
                    if (isMatch) {
                        manageLoginToken({req, res, email, password, rememberMe : false, checkUser});
                    }else{
                       sendResponse(res,401, "Invalid credentials.");
                    }
                });
            }
            
        } else {
           sendResponse(res,401, "Invalid credentials.");
        }
 
  
  }catch(e){
     sendResponse(res,500, "Something went wrong.");
  }}

authController.register=async (req, res) => {
    try {
      let {name, email, password } = {
        name : "SuperAdmin", 
        email : "superadmin@gmail.com",
        password : "123",
        role : "superadmin"
      }
      let valid=validateData( req.body, {
        name : {
          type : "string"
        },
        email : {
          type : "string"
        },
        password : {
            type : "string"
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
               
            } else {
                let verificationToken = generateStrongPassword(10, false);
                await insertData({
                        req, res,
                        collection: userModel,
                        data : {
                            name,
                            email,
                            verificationToken,
                            password : await encrypt(password),
                            status : 1
                        } 
                    })
                    sendResponse(res,201,"Registration completed successfully.")
                    
            }
    } catch (e) {
       sendResponse(res,500, "Something went wrong.");
    }
  }


  authController.authLink=async (req, res) => {
    try {
        const redirectUri = encodeURIComponent("https://app.pixalab.ai/dashboard");
        const clientId = "3874145586148497";
        const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${redirectUri}?state=instragram&response_type=code&scope=business_basic%2Cbusiness_manage_messages%2Cbusiness_manage_comments%2Cbusiness_content_publish&state=instragram`;
        sendResponse(res, 200, "", {
          url: authUrl,
        });
    } catch (e) {
      sendResponse(res,500, "Something went wrong.");
    }
  }

let manageLoginToken = ({req, res, email, password, rememberMe=false, checkUser}) => {
    updateData({
        req, res,
        collection: userModel,
        limit: 1,
        where: { email },
        data : {
            $set: { lastLogin: new Date() },
            $unset: { tempPassword : 1 },
        }
    }).then(async upd => {
        if (rememberMe){
            res.cookie("email", email);
            res.cookie("password", password);
        }

        var token = await manageJwtToken(checkUser);

        let isCamp = true;
        if(checkUser.role == 'user'){
            isCamp = false;
        }

        let authData = {
            data: {
                token: token,
                userId: checkUser._id,
                role: checkUser.role,
                email,
                name: checkUser.name,
                profilePic: checkUser.profilePic,
            },
            isCamp, 
            status: true,
            message: "You are successfully logged in.",
        };

            res.status(200).json(authData);  
        

        
    });
}



  module.exports = authController
