
const mongoose = require('mongoose'); 
module.exports = mongoose.model('schedule_post_test', new mongoose.Schema({
    userId : { type: mongoose.Types.ObjectId , ref: "users" },
    updateByUser : { type: mongoose.Types.ObjectId , ref: "users" }, // team member or user who updated this post other than userId
    posttype : {type : String},
    post : {type : String},
    title : { type: String},
    caption : { type: String},
    mediaUrl : { type: Array, default : undefined},
    scheduleDate : { type: Date},
    postId : {type : String ,default : undefined},
    status : {type : String ,default : "initialize"},
    accounts : {type : Object},
    timeZone : { type: Object },
    postDate : { type: Date},
    errorData : { type: Object},
    successData : { type: Object},
    createdAt : {type: Date, default: Date.now},
    updatedAt : {type: Date, default: Date.now} 
}));