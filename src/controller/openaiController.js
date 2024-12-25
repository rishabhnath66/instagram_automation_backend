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
const OpenAI = require('../helper/openai');
const path = require("path");
const fs = require('fs');
const sharp = require("sharp");
const AWSHelper = require("../services/awsService");

openaiController.generateVariation = async (req, res) => {
    try {

        upload(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                sendResponse(res, 500, "Something went wrong.", err);
            } else if (err) {
                sendResponse(res, 500, "Something went wrong.", err);
            } else {
                let postData = req.body;
                let user = req.user
                let acc = postData.accounts
                console.log('postd', postData);

                // if (req.files) {
                //     let file = req.files[0]
                //     let imagePath = "public/uploads/image/" + `${Date.now()}`
                //     resizedImagePath = "public/uploads/image/resized-" + `${Date.now()}`;
                //     try {
                //         await sharp(imagePath)
                //             .resize({ width: 1024, height: 1024 })
                //             .toFormat('png')
                //             .ensureAlpha()
                //             .toFile(resizedImagePath);

                //         // console.log('Image resized successfully:', resizedImagePath);
                //     } catch (error) {
                //         console.error('Error resizing image:', error);
                //         return;
                //     }
                // }

                let newarr = []

                let error = false, msg, output

                if (postData.image) {
                    output = `public/images/${Date.now()}.png`
                    try {
                        await downloadImage(postData.image, output)
                    }
                    catch (err) {
                        console.log(err);
                    }
                }

                let data = {}
                if (postData.type == '1') {
                    data.image = output
                }
                if (postData.type == '2') {
                    data.text = postData.text
                }
                if (postData.type == '3') {
                    data.text = postData.text,
                        data.image = output
                }

                for (let i = 0; i < acc.length; i++) {
                    await OpenAI.generatePostVariation(data).then(async result => {

                        if (result?.image) {
                            let newpath = `public/images/${Date.now()}.png`
                            try {
                                await downloadImage(result.image, newpath)
                            } catch (err) { }
                            let img = fs.createReadStream(newpath);
                            let name = "File_" + Date.now() + '.png'
                            let remotepath = `instragram/user/${user._id}/` + name
                            let f1 = await AWSHelper.uploadS3(img, remotepath, {})
                            console.log('f1', f1);

                            result.image = f1.key
                        }

                        newarr.push(result);
                    }).catch(err => {
                        console.log('err', err);

                        error = true
                        msg = err
                    })
                }
                // fs.unlinkSync(output)
                if (error) {
                    sendResponse(res, 500, "Someting went wrong", msg)
                }
                else {
                    sendResponse(res, 201, "variation created successfully.", newarr)
                }
            }
        })

    }
    catch (error) {
        console.log(error)
        sendResponse(res, 500, "Someting went wrong", error)
    }
}

openaiController.generateTextUsingOpenAI = async (req, res) => {
    try {
        let postData = req.body
        console.log('postd', postData);


        let result = await OpenAI.generateDataUsingOpenAI(postData);
        console.log('result', result);

        sendResponse(res, 201, "Text generated successfully.", result)
    }
    catch (error) {
        console.log({ error })
        sendResponse(res, 500, "Someting went wrong", error)
    }
}

openaiController.generateImageUsingPrompt = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                sendResponse(res, 500, "Something went wrong.", err);
            } else if (err) {
                sendResponse(res, 500, "Something went wrong.", err);
            } else {
                let postData = req.body
                console.log('postda', req.body, '\n', req.files);


                let file = req.files[0]

                let tempFilePath = path.join('public/images/', `${Date.now()}.png`);

                fs.mkdir(path.dirname(tempFilePath), { recursive: true }, (err) => {
                    if (err) {
                        console.error('Error creating directory:', err);
                        return;
                    }

                    fs.writeFile(tempFilePath, file.buffer, async (err) => {
                        if (err) {
                            console.error('Error writing file:', err);
                            return;
                        }
                        let generated
                        if (postData.type === 'image') {
                            if (req.file) {
                                generated = await OpenAI.generateImageUsingPrompt(postData.type, postData.prompt, tempFilePath)
                            }
                        }
                        else {
                            generated = await OpenAI.generateImageUsingPrompt(postData.type, postData.prompt, tempFilePath, file.originalname)
                        }
                        sendResponse(res, 201, "Image generated successfully.", generated)
                    })
                });


            }
        })
    }
    catch (error) {
        console.log({ error })
        sendResponse(res, 500, "Someting went wrong", error)
    }
}


async function downloadImage(imageUrl, outputPath) {
    try {
        return new Promise(async (resolve, reject) => {
            if (imageUrl) {
                const response = await axios({
                    url: imageUrl,
                    method: 'GET',
                    responseType: 'arraybuffer',
                });

                const imageBuffer = Buffer.from(response.data);
                const resizedImageBuffer = await sharp(imageBuffer)
                    .resize({ width: 1024, height: 1024 })
                    .toFormat('png')
                    .ensureAlpha()
                    .toBuffer();
                if (resizedImageBuffer) {
                    fs.writeFile(outputPath, resizedImageBuffer, (err) => {
                        if (err) {
                            console.error('Error writing to file:', err);
                            reject(err)
                        } else {
                            resolve()
                        }
                    });
                }
            }
            else { reject() }
        });
    } catch (error) {
        console.error('Error downloading the image.');
    }
}


module.exports = openaiController