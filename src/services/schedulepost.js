const schedulePostModel = require('../model/schedulePostModel');
const socialAccountModel = require('../model/socialAccountModel');
const postModel= require('../model/postModel');
const { objectToQuery } = require('../helper/comman');
const { selectData, updateData, insertData} =require('./dbService');

let funObj = {
    initSchedule : () => {
        funObj.getSheduleList();
    },
    getSheduleList : () => {
        // console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)
        let from = new Date(Date.now() - 1000 * 60 * 10), //10 minutes
        to = new Date(),
        checkPostCond = {
            postDate: {
                $gte: from,
                $lte: to,
            },
            status : "initialize",
        };
        selectData({
            collection: postModel,
            where: {...checkPostCond},
        }).then(postList => {
            if(postList.length){
                updateData({
                    collection: postModel,
                    where: {...checkPostCond},
                    data : {status: "processing"},
                });
                for(let postD of postList){
                    funObj.checkPostDetails(postD);
                }

            }
        });
    },
    manageError : ({target, error, type = 'err' , isFinished = false,id=null}) => {
        selectData({
            collection: postModel,
            where: { _id : target},
            findOne :1,
            limit : 1,
        }).then(chkData => {
            if(chkData){
                    errorData = {
                        [type] : [error]
                    };
                let updData = {errorData};
                    updData.status = "fail"

                if(id){
                    updateData({
                        collection: postModel,
                        where: { _id : id},
                        data : updData,
                        limit : 1
                    });
                }
            }
        });

    },
    manageSuccess : ({target, data, type, isFinished = false}) => {     
        selectData({
            collection: postModel,
            where: { _id : target},
            findOne :1,
            limit : 1,
            key : 'successData'
        }).then(chkData => {
            if(chkData){
                updateData({
                    collection : postModel,
                    where: { _id : target},
                    data : {
                        postId : data.id,
                        status :"completed",
                    }
                })

            }
        });   

    },
    
    manageFetchRequest : ({method , url, params, data , headers = {}}) => {
        return new Promise((res , rej) => {
            try {
                console.log({params})
                url += params && Object.keys(params).length ? `?${objectToQuery(params)}` : '';
                
                let options = {
                    method,
                    body : data,
                    headers
                };
                fetch(url , options).then((res2) => {
                    return res2.json();
                }).then((resp) => {
                    console.log({resp},{url});
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
        console.log({postData})
        let {_id, caption, userId, mediaUrl , accountId} = postData;
        try {

            let acList = [],
            manageResp = {
                target : _id,
                type : "main"
            };
                selectData({
                    collection: socialAccountModel,
                    where: { 
                        _id : accountId
                    },
                    findOne : true
                }).then(async accountList => {
                    console.log({accountList})
                    if(accountList){
                                let {  accountId, data,userId ,_id} = accountList,
                                { access_token } = data,
                               
                                details = {
                                    caption,
                                    accountId,
                                    accessToken:access_token,
                                   mediaList : mediaUrl,
                                };
                                
                                manageResp.id=_id 


                                    console.log({details})

                                    funObj.instagramAction.manageInstaPost(details).then(resp => {
                                        console.log("pass",resp)
                                        let {id} = resp;

                                        funObj.manageSuccess({
                                            ...manageResp, 
                                            data : {id,accountId,userId},
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
                    console.log({e})
                    funObj.manageError({
                        ...manageResp, 
                        error : 'Account now found.'
                    });
                });
           
            
            
        } catch (e) {
            funObj.manageError({
                ...manageResp, 
                error : e.message
            });
        }

    },


    instagramAction : {

        manageInstaPost : (postDetails) => {
            return new Promise(async (resolve , reject) => {
                try { 
                 
                    let {mediaList , caption, accountId, accessToken } = postDetails,
                    params;
                    if(mediaList.length && accessToken){
                        let {mediaType , mediaUrl} = mediaList[0];
    
                        if(mediaType == 'image'){
                            params = {
                                access_token: accessToken,
                                image_url: mediaUrl,
                                media_type: 'IMAGE',
                                caption,
                            }
                        }else if(mediaType == 'video'){
                            params = {
                                access_token: accessToken,
                                video_url: mediaUrl,
                                media_type: "REELS",
                                caption,
                            }
                        }
                    }
    
                    if(Object.keys(params).length){
                        console.log({params})
                        funObj.manageFetchRequest({
                            method : "POST",
                            url : `https://graph.instagram.com/v21.0/${accountId}/media`,
                            params
                        }).then(result => {
                            console.log({result},"ooooooo")
                            if(result.id){
                                funObj.instagramAction.instaVideoPublished(accountId, result.id,  accessToken).then(result1 => {
                                    console.log({result1})
                                            funObj.instagramAction.checkStatus(result.id, accessToken).then(async (status) => {
                                                    resolve(result1);
                                            });
                                        })
                    
                              
                             
                            }else{
                                reject("Unable to upload media on Instagram.");
                            }
                        }).catch(e => {
                            reject(e?.message || e);
                        });
    
                    }else{
                        reject("Only caption is not supported on Instagram.");
                    }
                } catch (e) {
                    reject(e.message)
                }
    
            });
        },
        checkStatus : async (id, token) => {

            try {
                return new Promise((res , rej) => {
                    funObj.manageFetchRequest({
                        method: 'GET',
                        url: `https://graph.instagram.com/${id}/`,
                        params: {
                            access_token: token,
                            fields: 'status_code',
                        },
                    }).then(result => {
                        console.log({result},"maharaj")
                        if (result.status_code === 'PUBLISHED' || result.status_code === 'FINISHED') {
                            res(result);
                        } else if (result.status_code === 'ERROR') {
                            rej(result.message || result);
                        } else {
                            setTimeout(() => {
                                res(funObj.instagramAction.checkStatus(id, token));
                            }, 5*1000);
                        }
                    }).catch(e => {
                        rej(e);
                    });
                });

            } catch (error) {
                rej(error?.message || error);
            }
        },
        instaVideoPublished : (instagramID, media_id, token) => {
            return new Promise(async (resolve, reject) => {
                try {

                    funObj.manageFetchRequest({
                        method: 'POST',
                        url: `https://graph.instagram.com/${instagramID}/media_publish/`,
                        params: {
                            access_token: token,
                            creation_id: media_id,
                        }
                    }).then(result => {
                        console.log({result})
                        resolve(result);
                    }).catch(e => {
                        if(e=="Media ID is not available"){
                            setTimeout(() => {
                                console.log("again",e)
                                resolve(funObj.instagramAction.instaVideoPublished(instagramID, media_id, token));
                            }, 10000);
                        }else{
                            reject(error?.response?.data?.error?.message);
                        }
                    });
                    
                } catch (error) {
                  
                        reject(error?.response?.data?.error?.message);
                    
                   
                }
            });
        }
    },
    
 
}

module.exports = {
    ...funObj
};