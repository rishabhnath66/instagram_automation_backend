const express = require('express');
const router = express.Router();
const postController = require("../controller/postController");
const middlewareModule = require('../middleware/middleware');

let requests = {
  get: {
    "/getPost": postController.getPost,
    "/multipost": postController.multipost,
  },
  post: {
    "/createPost": postController.createPost,
    "/updatePost": postController.updatePost,
    "/multiCreatePost": postController.multiCreatePost,
    "/generateVariation": postController.generateVariation
  },
  delete: {

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
