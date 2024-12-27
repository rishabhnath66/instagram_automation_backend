const express = require('express');
const router = express.Router();
const postController = require("../controller/postController");
const middlewareModule = require('../middleware/middleware');
const openaiController = require('../controller/openaiController');
let requests = {
  get: {
    "/getPost": postController.getPost,
    "/getCalenderPost": postController.getCalenderPost,
    "/multipost": postController.multipost,
  },
  post: {
    "/createPost": postController.createPost,
    "/updatePost": postController.updatePost,
    "/updatePostData": postController.updatePostData,
    "/multiCreatePost": postController.multiCreatePost,
    "/textVariation": postController.textVariation,
    "/generateVariation": openaiController.generateVariation,
    "/generatetext": openaiController.generateTextUsingOpenAI,
    "/generateImage": openaiController.generateImageUsingPrompt
  },
  delete: {
    '/deletePost': postController.deletePost,
  },

}
let allowrequest = {
}

let list = Object.keys(allowrequest)
for (let req in requests) {
  for (let reqsub in requests[req]) {
    if (list.includes(reqsub)) {
      router[req](reqsub, (rq, rs, next) => {
        middlewareModule.allowuser(allowrequest[reqsub], rq, rs, next)
      }, requests[req][reqsub]);
    } else {
      router[req](reqsub, requests[req][reqsub]);
    }
  }
}
module.exports = router
