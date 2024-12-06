const schedulePostModel = require('../model/schedulePostModel');
const socialAccountModel = require('../model/socialAccountModel');
const postModel= require('../model/postModel');
const { objectToQuery } = require('../helper/comman');
const { selectData, updateData, insertData} =require('../services/dbservice');
const { findOne } = require('../model/usersModel');

let funObj = {
    initPostEngagement : () => {
        funObj.getSheduleList();
    },
    getSheduleList : () => {
        let from = new Date(Date.now() - 1000 * 60 * 10), //10 minutes
        to = new Date(),
        checkPostCond = {
            status : "completed",
        };
        selectData({
            collection: postModel,
            where: {...checkPostCond},
        }).then(postList => {
                for(let postD of postList){
                    funObj.checkPostDetails(postD);
                }
        });
    },
    manageError : ({target, error, type = 'err' , isFinished = false,id}) => {
        selectData({
            collection: postModel,
            where: { _id : target},
            findOne :1,
            limit : 1,
            key : 'errorData'
        }).then(chkData => {
            if(chkData){
                let errorData = chkData?.errorData || {};
                if(errorData[type] !== undefined){
                    errorData = {
                        ...errorData,
                        [type] : [
                            ...errorData[type],
                            error
                        ]
                    }
                }else {
                    errorData = {
                        [type] : [error]
                    };
                }
                let updData = {errorData};
                if(isFinished){
                    updData.status = "completed"
                }
                if(id){
                    updateData({
                        collection: socialAccountModel,
                        where: { _id : id},
                        data : {status : false},
                        limit : 1
                    });
                }
                updateData({
                    collection: schedulePostModel,
                    where: { _id : target},
                    data : updData,
                    limit : 1
                });
            }
        });

    },
    manageSuccess : ({target, data, type, isFinished = false}) => {     
        selectData({
            collection: postModel,
            where: { _id : target},
            findOne :1,
            limit : 1,
        }).then(chkData => {
            if(chkData){
                updateData({
                    collection: postModel,
                    where: { _id : target},
                    data : {
                        Likes : data.like_count,
                        Comments :  data.comments_count,
                    },
                    limit : 1
                });

            }
        });   

    }, 
    manageFetchRequest : ({method , url, params, data , headers = {}}) => {
        return new Promise((res , rej) => {
            try {
                url += params && Object.keys(params).length ? `?${objectToQuery(params)}` : '';
                
                let options = {
                    method,
                    body : data,
                    headers
                };
                fetch(url , options).then((res2) => {
                    return res2.json();
                }).then((resp) => {
                    let { error , status , message} = resp;
                    if(error || status >= 400 ){
                        let msg = error?.message || message;
                        rej(msg);
                    }else{
                        res(resp);
                    }
                }).catch(e => {
                    rej(e.message);
                });
            } catch (e) {
                rej(e.message);
            }

        });
    },
    checkPostDetails : (postData) => {
        let { userId, accountId , postId,scheduleId,_id} = postData;
        try {

            let acList = [],
            manageResp = {
                target : _id,
            };
                
                selectData({
                    collection: socialAccountModel,
                    where: { 
                        accountId,
                    },
                    findOne : true
                }).then(async accountData => {
                    if(accountData){
                     
                       let {  accountId, data,userId ,_id} = accountData,
                                { access_token } = data,
                                details = {
                                    accountId,
                                    accessToken:access_token,
                                    postId,
                                };
                                manageResp.id=_id

                                    funObj.instagramAction.getPostEngagement(details).then(resp => {
                                        funObj.manageSuccess({
                                            ...manageResp, 
                                            data : resp,
                                            type : 'instagram'
                                        });
                                    }).catch(error => {
                                        funObj.manageError({
                                            ...manageResp, 
                                            error : error?.message || error,
                                            type : 'instagram'
                                        });
                                    });
                                    
                                
    
                               
                
                        return;

                    }else{
                        funObj.manageError({
                            ...manageResp, 
                            error : 'Account now found.'
                        });
                    }
                }).catch (e => {
                    funObj.manageError({
                        ...manageResp, 
                        error : 'Account now found.'
                    });
                });
           
            
        } catch (e) {
            // funObj.manageError({
            //     ...manageResp, 
            //     error : e.message
            // });
        }

    },
    updateEngagement : ()=>{

    },
    instagramAction : {
        getPostEngagement : (postDetails) => {
            return new Promise(async (resolve , reject) => {
                try { 
                 
                    let {accountId, accessToken,postId } = postDetails;

                        funObj.manageFetchRequest({
                            method : "GET",
                            url : `https://graph.instagram.com/${postId}`,
                            params: {
                                fields :"like_count,comments_count",
                                access_token : accessToken
                            }
                        }).then(result => {
                            console.log({result})
                          
                            if(result){
                                resolve(result)
                            }else{
                                reject("Unable to upload media on Instagram.");
                            }
                        }).catch(e => {
                            reject(e?.message || e);
                        });
    
                 
                } catch (e) {
                    reject(e.message)
                }
    
            });
        },
    },
    
 
}

module.exports = {
    ...funObj
};