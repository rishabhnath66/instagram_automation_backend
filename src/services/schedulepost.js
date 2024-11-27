const schedulePostModel = require('../model/schedulePostModel');
const socialAccountModel = require('../model/socialAccountModel');
const postModel= require('../model/postModel');
const { objectToQuery } = require('../helper/comman');
const { selectData, updateData, insertData} =require('./dbservice');

let funObj = {
    initSchedule : () => {
        funObj.getSheduleList();
    },
    getSheduleList : () => {
        console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)
        let from = new Date(Date.now() - 1000 * 60 * 10), //10 minutes
        to = new Date(),
        checkPostCond = {
            // postDate: {
            //     $gte: from,
            //     $lte: to,
            // },
            status : "completed1",
        };
        selectData({
            collection: schedulePostModel,
            where: {...checkPostCond},
        }).then(postList => {
            console.log({postList})
            if(postList.length){
                updateData({
                    collection: schedulePostModel,
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
            collection: schedulePostModel,
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
                updateData({
                    collection: schedulePostModel,
                    where: { _id : target},
                    data : updData,
                    limit : 1
                });

                if(id){
                    updateData({
                        collection: socialAccountModel,
                        where: { _id : id},
                        data : {status : false},
                        limit : 1
                    });
                }
            }
        });

    },
    manageSuccess : ({target, data, type, isFinished = false}) => {     
        selectData({
            collection: schedulePostModel,
            where: { _id : target},
            findOne :1,
            limit : 1,
            key : 'successData'
        }).then(chkData => {
            if(chkData){
                let successData = chkData?.successData || {};
                if(successData[type] !== undefined){
                    successData = {
                        ...successData,
                        [type] : [
                            ...successData[type],
                            data
                        ]
                    }
                }else {
                    successData = {
                        [type] : [data]
                    };
                }
                
                let updData = {successData};
                if(isFinished){
                    updData.status = "completed"
                }
                insertData({
                    collection : postModel,
                    data : {
                        accountId : data.accountId,
                        scheduleId : target,
                        userId : data.userId,
                        postId : data.id,
                    }
                })
                updateData({
                    collection: schedulePostModel,
                    where: { _id : target},
                    data : updData,
                    limit : 1
                });

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
        let {_id, caption, userId, mediaUrl , accounts} = postData;
        try {

            let acList = [],
            manageResp = {
                target : _id,
                type : "main"
            };
            for(let acsId of accounts){
                acList.push(acsId);
            }
                console.log({acList})
            if(acList.length){
                selectData({
                    collection: socialAccountModel,
                    where: { 
                        _id : { 
                            $in : acList
                        }
                    }
                }).then(async accountList => {
                    if(accountList.length){
                        let isDownload = false
                        console.log({isDownload},mediaUrl)
                        let mediaList=[]
                        for(let mediaData of mediaUrl){
                            mediaList.push({
                                    mediaUrl : mediaData.path,
                                    mediaType : mediaData.mediaType
                                });
                           
                        }
                       
                            let checkAccountCnt = 1;
                            console.log({accountList})
                            for(let accountData of accountList){
                                manageResp.isFinished = checkAccountCnt == accountList.length;
                                let {  accountId, data,userId ,_id} = accountData,
                                { access_token, refreshToken } = data,
                                //
                               
                                //
                                details = {
                                    mediaList,
                                    caption,
                                    accountId,
                                    accessToken:access_token,
                                    thumb : mediaUrl?.[0]?.thumb
                                };
                                //
                                manageResp.id=_id 
                                //
                                console.log({mediaUrl});

    
                                    funObj.instagramAction.manageInstaPost(details).then(resp => {
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
                                    
                                
    
                                checkAccountCnt++;
                            }
                       

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
            }else{
                funObj.manageError({
                    ...manageResp, 
                    error : 'Account now found.'
                });
            }
            
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