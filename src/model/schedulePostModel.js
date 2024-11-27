
const mongoose = require('mongoose'); 
module.exports = mongoose.model('schedule_post_test', new mongoose.Schema({
    userId : { type: mongoose.Types.ObjectId , ref: "users" },
    updateByUser : { type: mongoose.Types.ObjectId , ref: "users" }, // team member or user who updated this post other than userId
    title : { type: String},
    caption : { type: String},
    mediaUrl : { type: Object, default : undefined},
    scheduleDate : { type: Date},
    postId : {type : String ,default : undefined},
    status : {type : String ,default : "initialize"},
    accounts : {type : Object},
    postOn : {type : Array},
    timeZone : { type: Object },
    postDate : { type: Date},
    errorData : { type: Object},
    successData : { type: Object},
    supportSocialAccount : {type : Array},
    createdAt : {type: Date, default: Date.now},
    updatedAt : {type: Date, default: Date.now} 
}));