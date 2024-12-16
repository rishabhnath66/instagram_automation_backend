const axios = require("axios")
const { insertData, selectData, updateData, countData, aggregateData } = require("../services/dbService");
const { encrypt, generateStrongPassword, comparePassword, manageJwtToken, validateData, sendResponse, } = require("../helper/comman");
const schedulePostModel = require("../model/schedulePostModel");
const socialAccountModel = require("../model/socialAccountModel");
const postModel = require("../model/postModel");
const openaiController = {}
const mongoose = require('mongoose');
const comman = require("../helper/comman");
const multer = require("multer");
const upload = multer().any()
const OpenAI = require('../helper/openai')

openaiController.generateVariation = async (req, res) => {
    try {

        let postData = req.body;
        let data = {}
        if (parseInt(postData.type) == 1) {
            data.text = postData.text,
                data.image = postData.image
        }
        if (parseInt(postData.type) == 2) {
            data.text = postData.text
        }
        if (parseInt(postData.type) == 3) {
            data.image = postData.image
        }

        let variation = await comman.generatePostVariation(data)
        console.log('variation', variation);
        sendResponse(res, 201, "variation created successfully.", variation)

    }
    catch (error) {
        console.log({ error })
        sendResponse(res, 500, "Someting went wrong", error)
    }
}

openaiController.generateTextUsingOpenAI = async (req, res) => {
    try {
        let postData = req.body
        console.log('postd', postData);
        return

        let result = await OpenAI.generateDataUsingOpenAI(postData);
        sendResponse(res, 201, "Text generated successfully.", result)
    }
    catch (error) {
        console.log({ error })
        sendResponse(res, 500, "Someting went wrong", error)
    }
}

openaiController.generateImageUsingPrompt = async (req, res) => {
    try {
        let postData = req.body
        let generated
        if (postData.type === 'image') {
            if (req.file) {
                generated = await OpenAI.generateImageUsingPrompt(postData.type, postData.prompt, req.file)
            }
        }
        else {
            generated = await OpenAI.generateImageUsingPrompt(postData.type, postData.prompt,)
        }
        sendResponse(res, 201, "Text generated successfully.", generated)
    }
    catch (error) {
        console.log({ error })
        sendResponse(res, 500, "Someting went wrong", error)
    }
}


module.exports = openaiController