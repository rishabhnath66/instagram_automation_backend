const mongoose = require('mongoose');

module.exports = mongoose.model('users', new mongoose.Schema({
    name : { type: String},
    email : { type: String},
    password : { type: String},
    tempPassword : { type: String},
    profilePic : { type: String},
    role : { type: String, default : 'user'},
    accessLevel : {type:Array},
    scope : {type:Object},
    status : { type: Number, default:0},
    parentId : { type: mongoose.Types.ObjectId, ref: "users" },
    lastLogin : {type: Date},
    createdAt : {type: Date, default: Date.now},
    updatedAt : {type: Date, default: Date.now},
    isDeleted  : {type : Boolean , default : false}
}));