const axios=require("axios")
const {insertData, selectData, updateData } = require("../services/dbservice");
const {encrypt, generateStrongPassword, comparePassword, manageJwtToken, validateData, sendResponse ,} = require("../helper/comman");
const socialAccountModel = require("../model/socialAccountModel")
const socialController = {}



socialController.addAccount=async (req, res) => {
    try {
        let userId=req.query.state
        let reqobj = req.query;
        let response;
         response = await instragramAccAdd(reqobj.code, reqobj.redirect_uri)
        if (response?.status) {
            let id = response.data.id;

            let useraccount = await selectData({
                collection: socialAccountModel,
                findOne: true,
                where: {
                    userId,
                    accountId: id,
                },
                req, res
            });

            if (useraccount) {
                let updateAcc = await updateData({
                    collection: socialAccountModel,
                    limit: 1,
                    where: {
                            userId,
                            accountId: id,
                                         
                    },
                    data: {
                        $set: { data: response.data , status: true  }
                    },
                    req, res,
                });

                res.json({ status: true, message: "Account Updated Succesfully." });
            }
            else {
                let updateAcc = await insertData({
                    collection: socialAccountModel,
                    data: {
                        userId,
                        accountId: id,
                        data: response.data
                    },
                    req, res,
                });

                sendResponse(res,200, "Account successfully connected.");
            }
        }else {
          // sendResponse(res,201,"account successfully connected.")

        }

    } catch (error) {
      console.log({error})

      sendResponse(res,500,"Someting went wrong",error)
    }

  }



  const instragramAccAdd= async (code, redirect_uri) => {
    return new Promise(async(resolve,reject)=>{
      try{
      const url = `https://api.instagram.com/oauth/access_token`;
      let data = {
          client_id: "3874145586148497",
              grant_type: 'authorization_code',
              client_secret: "63bd7ccb9064cb48221acd67664983dc",
              code: code,
              redirect_uri : "https://localhost:3001/auth/addSocialAccount"
        };
        
        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://api.instagram.com/oauth/access_token',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded', 
          },
          data : data
        };
        
       let data1= await axios.request(config)
       console.log(data1)
        data1=data1.data
       let details=await axios.get(`https://graph.instagram.com/me?fields=id,username&access_token=${data1.access_token}`)
       let longtoken=await axios.get(`https://graph.instagram.com/access_token/?grant_type=ig_exchange_token&client_secret=63bd7ccb9064cb48221acd67664983dc&access_token=${data1.access_token}`)
        let dat={
          ...details.data,
          ...longtoken.data,
        }
        console.log({dat})
        resolve({ status: true,data: dat });
    }
    catch(e){
      reject({ status: false,error : e })

    }
    })
    
  }

  module.exports = socialController
