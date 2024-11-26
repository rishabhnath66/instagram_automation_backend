const { Upload } = require("@aws-sdk/lib-storage");
const {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} =require("@aws-sdk/client-s3");
const fs = require('node:fs/promises');

const config = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
};
const client = new S3Client(config);

const AWSHelper = {};

let defaultOptions = {
  ACL: "public-read",
  Bucket: process.env.AWS_BUCKET_NAME
};

AWSHelper.uploadS3 = (localFile, remotePath, options = {}) => {
  return new Promise(async(resolve, reject) => {
    let uploadParams = {
      ...defaultOptions,
      ...options,
    };

    uploadParams.Key = remotePath;
    let fdata=await fs.readFile(localFile);
    uploadParams.Body = fdata

 
        const parallelUploads3 = new Upload({
          client: client,
          params: uploadParams,
        });

        parallelUploads3.on("httpUploadProgress", (progress) => {
          // console.log(progress)
        });

        const data = await parallelUploads3.done();

         fs.unlink(localFile);
        if(data?.ETag) {
          // ETag Key Location
          let { ETag, Key, Location } = data;
          resolve({ ETag, Key, Location });
        } else {
          reject(data);
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



export default AWSHelper;