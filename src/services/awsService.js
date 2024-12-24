const { S3Client, CopyObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('node:fs/promises');
const { Upload } = require("@aws-sdk/lib-storage");
const config = {
  region: process.env.region,
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
};
const client = new S3Client(config);

const AWSHelper = {};

let defaultOptions = {
  ACL: "public-read",
  Bucket: process.env.bucketName
};

AWSHelper.multiuploadS3 = async () => {

}

AWSHelper.uploadS3 = (file, remotePath, options = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let uploadParams = {
        ...defaultOptions,
        ...options,
      };

      uploadParams.Key = remotePath;
      uploadParams.Body = file?.buffer ? file.buffer : file


      const parallelUploads3 = new Upload({
        client: client,
        params: uploadParams,
      });

      parallelUploads3.on("httpUploadProgress", (progress) => {
        // console.log(progress)
      });

      const data = await parallelUploads3.done();
      if (data?.ETag) {
        // ETag Key Location
        let { ETag, Key, Location } = data;
        resolve({ ETag, Key, Location });
      } else {
        reject(data);
      }

    } catch (e) {
      reject(e);
    }

  });
};

AWSHelper.copyObject = async (source, target) => {
  return new Promise(async (resolve, reject) => {
    let params = Object.assign({}, defaultOptions);
    params.CopySource = defaultOptions.Bucket + "/" + source;
    params.Key = target;

    const copyObject = async () => {
      try {
        const command = new CopyObjectCommand(params);
        const response = await client.send(command);
        resolve({ key: target, data: response });
      } catch (error) {
        reject("error while coping objects from s3" + err);
        console.error("error while coping objects from s3" + err);
        return;
      }
    };

    copyObject();
  });
};

AWSHelper.deleteObjects = (remotePaths = []) => {
  return new Promise((resolve, reject) => {
    let bucketName = defaultOptions.Bucket;
    remotePaths.forEach(function (item) {
      const params = {
        Bucket: bucketName,
        Key: item,
      };
      const command = new DeleteObjectCommand(params);
      client
        .send(command)
        .then((data) => {
          resolve(1);
        })
        .catch((err) => {
          reject("error while deleting objects from s3" + err);
          console.error("error while deleting objects from s3" + err);
          return;
        });
    });
  });
};



module.exports = AWSHelper