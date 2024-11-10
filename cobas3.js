const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { fromIni } = require("@aws-sdk/credential-provider-ini");

const s3Client = new S3Client({
    region: "us-east-1",
    credentials: fromIni()
});

const uploadFile = async (bucketName, file, folder) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    const folderPath = folder.endsWith('/') ? folder : `${folder}/`;

    const uploadParams = {
        Bucket: bucketName,
        Key: `${folderPath}${fileName}`,
        Body: file.buffer,
        ContentType: file.mimetype
    };

    try {
        await s3Client.send(new PutObjectCommand(uploadParams));
        const url = `https://${bucketName}.s3.amazonaws.com/${folderPath}${fileName}`;
        console.log("Successfully uploaded file to S3:", url);
        return url;
    } catch (err) {
        console.error("Error uploading file:", err);
        throw err;
    }
};

module.exports = uploadFile;