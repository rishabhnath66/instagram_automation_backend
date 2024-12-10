let dbService = {
    manageKeys : (keys = null) => {
        let result = {};
        if(keys && typeof keys == 'string' && keys.split(',').length){
            keys.split(',').map(d => {
                result[d] = 1;
            });
        }
        return result;
    },
    insertData : (p) => {
        try{
        return new Promise(function(resolveAction, rejectAction) {
            let {collection , data} = p;
            if(!Array.isArray(data)){
                var createObj = collection.create(data)
            }else{
                var createObj = collection.insertMany(data)
            }

            createObj.then(result => {
                resolveAction(result);
            }).catch(error => {
                rejectAction(error)
            })    
        });
    }catch(e){
        rejectAction(e)
    }
    },
    updateData : (p) => {
        return new Promise(function(resolveAction, rejectAction) {
            let {collection , data , where , limit} = p;
            if(limit){
                var createObj = collection.updateOne(where ,data);
            }else{
                var createObj = collection.updateMany(where ,data);
            }

            createObj.then(result => {
                if(result){
                    resolveAction(result);
                }else{
                    rejectAction(error)
                }
            }).catch(error => {
                rejectAction(error)
            })    
        });
        
    },
    selectData : (p) => {
        return new Promise(function(resolveAction, rejectAction) {
            let { collection , where , limit , keys , skip , sort ,page , populateAry, findOne = false} = p;
            keys = keys ? dbService.manageKeys(keys):{},
            limit = limit || 10, 
            page = page || 1;
            if(findOne){
                var createObj = collection.findOne(where , keys)
            }else{
                var createObj = collection.find(where, keys)
            }
            if(populateAry){

                if('multiple' in populateAry){
                    populateAry.multiple.map((populateData) =>  {
                        createObj = dbService.manageMyPopulate(populateData , createObj);
                    });
                }else{
                    createObj = dbService.manageMyPopulate(populateAry , createObj);
                }
                
            }

            if(limit && limit != 'all'){
                createObj.limit(limit);
            }

            if(skip){
                createObj.skip(skip);
            }

            if(page && limit != 'all'){
                createObj.skip((page-1)*limit);
            }

            if(sort && sort != ''){
                let shBoj = {},
                chkSort = sort.split(',');
                if(chkSort.length){
                    chkSort.map(sh =>{
                        let chkD = sh.split('=');
                        if(chkD.length > 1){
                            let k = chkD[0].trim(), d = chkD[1].trim();
                            shBoj[[k]] = +d;
                        }
                    });
                }
                createObj.sort(shBoj);
            }else{
                createObj.sort({createdAt : -1});
            }

            createObj.then(result => {
                resolveAction(result);
            }).catch(error => {
                rejectAction(error)
            })    
        });
        
    },
    manageMyPopulate : (populateAry , createObj) => {
        if(populateAry.length){
            if(populateAry.length == 1){
                createObj.populate(populateAry[0]);
            }else{
                createObj.populate(populateAry[0] , populateAry[1]);
            }
        }else{
            createObj.populate(populateAry);
        }
        
        return createObj;
    },
    deleteData : (p) => {
        return new Promise(function(resolveAction, rejectAction) {
            let { collection , where ,limit} = p;
            if(limit == 1){
                var createObj = collection.deleteOne(where);
            }else{
                var createObj = collection.deleteMany(where);
            }

            createObj.then(result => {
                resolveAction(result);
            }).catch(error => {
                rejectAction(error)
            })    
        });
        
    },
    countData : (p) => {
        return new Promise(function(resolveAction, rejectAction) {
            let { collection , where} = p;
            var createObj = collection.countDocuments(where);

            
            createObj.then(result => {
                resolveAction(result);
            }).catch(error => {
                rejectAction(error)
            })    
        });
        
    },
    aggregateData : (p) => {
        return new Promise(function(resolveAction, rejectAction) {
            let { collection , aggregateCnd} = p;
            var createObj = collection.aggregate(aggregateCnd);

            createObj.then(result => {
                resolveAction(result);
            }).catch(error => {
                rejectAction(error)
            })    
        });
    },
    findOneAndUpdate : (p) => {
        return new Promise(function(resolveAction, rejectAction) {
            let { collection , where , data} = p;
            collection.findOneAndUpdate(where, data).then((result) => {
                resolveAction(result);
            }).catch(error => {
                rejectAction(error)
            }) ;
        });
        
    },

}

module.exports = dbService