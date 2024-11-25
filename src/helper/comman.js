var bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
        return Text.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
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
        return str.replace(/(^\w|\s\w)/g, m => m.toUpperCase())
    },
    manageJwtToken: (checkUser) => {
        return new Promise(async (resolve, reject) => {
            let token = await jwt.sign({
                userId: checkUser._id,
                role: checkUser.role,
                email: checkUser.email,
                parentId: checkUser?.parentId || null,
                currentBrandId: checkUser?.currentBrandId || null,
            }, process.env.TOKEN_SECRET, {
                expiresIn: process.env.TOKEN_LIFE
            });
            resolve(token);
        });
    },
    encryptSupportScript: (id) => {
        const crypto = require('crypto');
        let cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq');
        let crypted = cipher.update(id, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    },
    validateData :(input,validateFields)=>{
        const message = {};
        Object.keys(validateFields).forEach(field => {
            const fieldValue = input?.[field];
            let type =validateFields?.[field]?.type
      
            if (!fieldValue) {
                message[field] = field + ` is Require.`;
            }else if(typeof fieldValue != type ) {
         
                message[field] = field + ` type Should be ${type}.`;
            }
        });
        return message
    },
    sendResponse : (res, code,msg=null, data=undefined)=>{
        const messagelist = {
          200: '',
          400: 'Bad Request',
          401: 'Unauthorized',
          403: 'Forbidden',
          404: 'Not Found',
          500: 'Internal Server Error'
        };
        const message = msg || messagelist[code] ;
        return res.status(code).json({
          status: code == 200 ? true : false ,
          message: message,
          data,
        });
    }
};
