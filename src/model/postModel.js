
const mongoose = require('mongoose'); 
module.exports = mongoose.model('post', new mongoose.Schema({
    userId : { type: mongoose.Types.ObjectId , ref: "users" },
    scheduleId : { type: mongoose.Types.ObjectId , ref: "schedule_post_test" },
    postId : {type : String ,default : undefined},
    accountId :  {type : String ,default : undefined},
    Likes :  {type : Number ,default : undefined},
    Comments :  {type : Number ,default : undefined},
    createdAt : {type: Date, default: Date.now},
}));