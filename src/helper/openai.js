const OpenAI = require("openai")
const fs = require('fs')
const sharp = require('sharp')
const axios = require('axios')

const OPEN_AI = {};

let openai
openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

OPEN_AI.generatePostVariation = async (data) => {

    return new Promise(async (resolve, reject) => {

        let response = {}, error
        if (data.text) {
            let txt = `I need to create a variation of my content. 
            content : ${data.text}            
            Generate a variation of my content while maintaining the same word length and appropriate tone. Output will be only generated variation. Make sure to not add any other content.`

            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [{ role: "system", content: `You are an expert in analyzing and generating variation of given content.Generate a relevant variation that align with the context and purpose.` },
                    { role: 'user', content: txt }
                    ],
                }).catch(err => {
                    reject('Failed to generate text. Try again!')
                })

                if (completion) {
                    response.text = completion.choices[0].message.content
                }
                else {
                    error = true
                }
            }
            catch (err) {
                console.log('err text', err);
                error = true
            }
        }
        if (data.image) {

            try {

                const resizedImageBuffer = fs.createReadStream(data.image);
                let img = await openai.images.createVariation({
                    image: resizedImageBuffer,
                    n: 1,
                    size: "1024x1024"
                });

                // let img = await openai.images.edit({
                //     // model: "dall-e-3",
                //     image: resizedImageBuffer,
                //     prompt: 'Generate a variation of this image',
                //     n: 1,
                //     size: "1024x1024"
                // });
                console.log('img', img);

                fs.unlinkSync(data.image);
                if (img.data[0].url) {

                    response.image = img.data[0].url
                }
                else {
                    error = true
                }
            }
            catch (err) {
                console.log('err image', err);
                error = true
                reject(err)
            }
        }
        if (error) {
            reject("Failed to generate variation.")
        }
        else {
            resolve(response)
        }
    })
}

OPEN_AI.generateImageUsingPrompt = async (type, prompt, file) => {
    return new Promise(async (resolve, reject) => {
        try {
            let response
            const resizedImagePath = "public/images/resized-" + `${Date.now()}.png`;
            try {
                await sharp(file)
                    .resize({ width: 1024, height: 1024 })
                    .toFormat('png')
                    .ensureAlpha()
                    .toFile(resizedImagePath);

                // console.log('Image resized successfully:', resizedImagePath);
            } catch (error) {
                console.error('Error resizing image:', error);
                return;
            }

            const resizedImageBuffer = fs.createReadStream(resizedImagePath);

            // response = await openai.images.edit({
            //     // model: "dall-e-2",
            //     image: resizedImageBuffer,
            //     prompt: prompt,
            //     n: 1,
            //     size: "1024x1024"
            // });
            response = await openai.images.createVariation({
                model: "dall-e-2",
                image: resizedImageBuffer,
                n: 1,
                size: "1024x1024"
            });

            if (response) {
                fs.unlinkSync(file);
                fs.unlinkSync(resizedImagePath);
                let image_url = response.data[0].url;
                resolve(image_url)
            }
            else {
                reject('Failed to generate image')
            }
        } catch (error) {
            console.error(`Error generating image: ${error}`);
            reject(error)
        }
    })
}

OPEN_AI.generateDataUsingOpenAI = async (data) => {
    return new Promise(async (resolve, reject) => {
        // if (!keyExists) {
        //     reject('Set up OpenAI keys')
        // }
        let content = `I need to create a variation of my content. 
content : ${data.captionPrompt}
word length : ${data.approxWords}
tone - ${data.toneofVoice}
${data.generateHashtags ? 'Also generate hashtags which are suitable for my content.' : ''}

Generate a variation of given content while maintaining the same word length and appropriate tone. Output will be only generated variation. Make sure to not add any other content.`


        await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: `You are an expert in analyzing and generating variation of given content. Your expertise includes understanding the nuances of the content, identifying key elements, and creating effective, relevant variation that align with the context and purpose.` },
            { role: 'user', content: content }
            ],
        }).then(completion => {
            if (completion) {
                resolve(completion.choices[0].message.content)
            }
            else {
                reject('Failed to generate text. Try again!')
            }
        }).catch(err => {
            reject('Failed to generate text. Try again!')
        })

    })
}
module.exports = OPEN_AI;