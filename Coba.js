const { S3Client, ListBucketsCommand, ListObjectsCommand } = require('@aws-sdk/client-s3');
const { fromIni } = require("@aws-sdk/credential-provider-ini");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs');
const path = require('path');

const s3Client = new S3Client({
    region: "us-east-1",
    credentials: fromIni()
});

async function getBucketName(){
    const command = new ListBucketsCommand({})
    const bucket = await s3Client.send(command)
    return bucket.Buckets.length > 0 ? bucket.Buckets[0].Name : null  
}

async function getBucketObjectsInFolder(bucketName, folderPrefix) {
    const command = new ListObjectsCommand({
        Bucket: bucketName,
        Prefix: folderPrefix 
    });

    try {
        const response = await s3Client.send(command);
        return response.Contents; 
    } catch (error) {
        console.error("Error listing objects:", error);
        return [];
    }
}

const uploadFile = async (bucketName, filePath, folder) => {
    const fileName = path.basename(filePath);
    const folderPath = folder.endsWith('/') ? folder : `${folder}/`; 

    const uploadParams = {
        Bucket: bucketName,
        Key: `${folderPath}${fileName}`,
        Body: fs.createReadStream(filePath),
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        console.log("Successfully uploaded file to S3:", data);
    } catch (err) {
        console.error("Error uploading file:", err);
    }
};



async function main(){
    const bucketName = await getBucketName()
    const filePath = './coba.txt'
    await uploadFile(bucketName, filePath, 'course');
    // console.log(bucketName)
    const object = await getBucketObjectsInFolder(bucketName, 'course')
    console.log(object)
}

main()