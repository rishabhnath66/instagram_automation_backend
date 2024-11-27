
const mongoose = require('mongoose'); 
module.exports = mongoose.model('assets', new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: "users" },
    title : { type: String},
    mediaType : { type: String},
    mimeType : { type: String}, //use for upload in S3
    files : { type: Object, default: undefined}, //{file, thumb}
    status : { type: Number, default: 1},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
}));