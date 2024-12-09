const mongoose = require('mongoose'); 

module.exports = mongoose.model('social_accounts', new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: "users" },
    accountId: {type: String},
    data : {type : Object},
    status : {type: Boolean,default : true},
    reconnectErr : {type : String},
    expaireIn : {type : Date},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now},
    engament : {type : Object},
    TimeZone :  {type: Object},
}));