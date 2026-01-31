import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();

export const uploadToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  const bucketName = process.env.S3_BUCKET_NAME || 'family-chore-assets';

  const params = {
    Bucket: bucketName,
    Key: `proof-images/${Date.now()}-${fileName}`,
    Body: fileBuffer,
    ContentType: mimeType
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

export default s3;
