const OpenAI = require("openai")

const OPEN_AI = {};

let openai
OPEN_AI.connectapikey = () => {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_KEY
    });
}

OPEN_AI.generatePostVariation = async (data) => {


    return new Promise(async (resolve, reject) => {

        let response, error
        if (data.text) {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: `You are an expert in analyzing and generating variation of given content. Your expertise includes understanding the nuances of the content, identifying key elements, and creating effective, relevant variation that align with the context and purpose.` },
                { role: 'user', content: data.text }
                ],
            });
            if (completion) {
                response.text = completion.choices[0].message.content
            }
            else {
                error = true
            }
        }
        if (data.image) {
            // let imagePath = "public/uploads/image/" + image.filename
            // const resizedImagePath = "public/uploads/image/resized-" + image.filename;
            // try {
            //   await sharp(imagePath)
            //     .resize({ width: 1024, height: 1024 })
            //     .toFormat('png')
            //     .ensureAlpha()
            //     .toFile(resizedImagePath);

            //   // console.log('Image resized successfully:', resizedImagePath);
            // } catch (error) {
            //   console.error('Error resizing image:', error);
            //   return;
            // }

            // const resizedImageBuffer = fs.createReadStream(resizedImagePath);

            let img = await openai.images.createVariation({
                model: "dall-e-2",
                image: data.image,
                n: 1,
                size: "1024x1024"
            });
            if (response.data[0].url) {
                response.image = response.data[0].url
            }
            else {
                error = true
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

OPEN_AI.generateImageUsingPrompt = async (type, prompt, image) => {
    try {
        let response
        if (type !== 'image') {
            response = await openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
            });
        }
        else {
            let imagePath = "public/uploads/image/" + image.filename
            const resizedImagePath = "public/uploads/image/resized-" + image.filename;
            try {
                await sharp(imagePath)
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

            response = await openai.images.createVariation({
                model: "dall-e-2",
                image: resizedImageBuffer,
                n: 1,
                size: "1024x1024"
            });
            try {
                fs.unlinkSync(imagePath);
                fs.unlinkSync(resizedImagePath);
            } catch (err) {
                console.log('err', err);
            }
        }
        let image_url = response.data[0].url;
        return image_url
    } catch (error) {
        console.error(`Error generating image: ${error}`);
    }
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
${data.generateHashtags ? 'Generate Hashtags' : ''}

Generate a variation of my content while maintaining the same word length and appropriate tone.`


        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: `You are an expert in analyzing and generating variation of given content. Your expertise includes understanding the nuances of the content, identifying key elements, and creating effective, relevant variation that align with the context and purpose.` },
            { role: 'user', content: content }
            ],
        })
        if (completion) {
            resolve(completion.choices[0].message.content)
        }
        else {
            reject('Failed to generate text. Try again!')
        }
    })
}
module.exports = OPEN_AI;