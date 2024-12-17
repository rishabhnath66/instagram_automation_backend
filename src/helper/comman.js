var bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai")
module.exports = {
  encrypt: async (password) => {
    return await bcrypt.hashSync(password, 10);
  },
  comparePassword: (plainPass, hashword, callback) => {
    bcrypt.compare(plainPass, hashword, function (err, isPasswordMatch) {
      return err == null ? callback(null, isPasswordMatch) : callback(err);
    });
  },
  generateStrongPassword: (minLength = 5, isSpeal = true) => {
    let passList = [
      "abcdefghijklmnopqrstuvwxyz", //lower case
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ", //upper case
      "0123456789", //numbers
    ];

    if (isSpeal) {
      passList.push("!@#$%^&*()_+{}:\"<>?|[];',./`~");
    }

    var password = "";
    let j = 0;
    for (let i = 0; i <= minLength; i++) {
      let t = passList[j];
      password += t[Math.floor(Math.random() * t.length)];
      j = j >= passList.length - 1 ? 0 : j + 1;
    }

    return password;
  },
  getUniqueId: (pre) => {
    return `${pre}-${Math.random()
      .toString(36)
      .slice(-2)
      .toUpperCase()}-${Date.now()}`;
  },
  slugify: (Text) => {
    return Text.toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
  },
  getExtensionFromUrl: (url) => {
    return url.split(/[#?]/)[0].split(".").pop().trim();
  },
  objectToQuery: (d) => {
    var str = [];
    for (var p in d) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(d[p] || ""));
    }
    return str.join("&");
  },
  ucFirst: (str) => {
    return str.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
  },
  manageJwtToken: (checkUser) => {
    return new Promise(async (resolve, reject) => {
      let token = await jwt.sign(
        {
          userId: checkUser._id,
          role: checkUser.role,
          email: checkUser.email,
          parentId: checkUser?.parentId || null,
          currentBrandId: checkUser?.currentBrandId || null,
        },
        process.env.TOKEN_SECRET,
        {
          expiresIn: process.env.TOKEN_LIFE,
        }
      );
      resolve(token);
    });
  },
  encryptSupportScript: (id) => {
    const crypto = require("crypto");
    let cipher = crypto.createCipher("aes-256-cbc", "d6F3Efeq");
    let crypted = cipher.update(id, "utf8", "hex");
    crypted += cipher.final("hex");
    return crypted;
  },
  validateData: (input, validateFields) => {
    const message = {};
    Object.keys(validateFields).forEach((field) => {
      const fieldValue = input?.[field];
      let type = validateFields?.[field]?.type;

      if (!input.hasOwnProperty(field)) {
        message[field] = field + ` is Require.`;
      } else if (typeof fieldValue != type && type != "array") {
        message[field] = field + ` type Should be ${type}.`;
      } else if (!Array.isArray(fieldValue) && type == "array") {
        message[field] = field + `fieldValue Should be array .`;
      } else if (type == "object") {
        if (Object.keys(fieldValue).length == 0) {
          message[field] = field + `fieldValue Should be not empty .`;
        }
      } else {
        if (type == "array") {
          if (fieldValue.length == 0) {
            message[field] = field + `fieldValue Should be not empty .`;
          }
        }
      }
    });
    return message;
  },
  sendResponse: (res, code, msg = null, data = undefined) => {
    const messagelist = {
      200: "",
      204: "Resource Not Found",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      500: "Internal Server Error",
    };
    let tstatus = [200, 201]
    console.log(msg)
    const message = msg || messagelist[code];
    return res.status(code).json({
      status: tstatus.includes(code),
      message: message,
      data,
    });
  },

  generatePostVariation: (data) => {
    let openai
    openai = new OpenAI({
      apiKey: process.env.OPENAI_KEY
    });


    return new Promise(async (resolve, reject) => {

      let response
      if (data.text) {
        const completion = await openai.chat.completions.create({
          messages: [{ role: "system", content: `You are an expert in analyzing and generating variation of given content. Your expertise includes understanding the nuances of the content, identifying key elements, and creating effective, relevant variation that align with the context and purpose.` },
          { role: 'user', content: data.text }
          ],
          model: "gpt-3.5-turbo",
        });
        if (completion) {
          resolve(completion.choices[0].message.content)
        }
        else {
          reject("Something went wrong. Try again !")
        }
      }
      if (data.image) {
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
    })

  }


};
