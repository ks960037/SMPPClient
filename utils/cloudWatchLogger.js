import { createLogger, format, transports } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import dotenv from 'dotenv';
dotenv.config();

const awsRegion = process.env.CLOUDWATCH_REGION
const awsAccessKeyId = process.env.CLOUDWATCH_ACCESS_KEY_ID
const awsSecretKey = process.env.CLOUDWATCH_SECRET_ACCESS_KEY

// 設定 CloudWatch Transport
const cloudWatchTransport = new WinstonCloudWatch({
    logGroupName: 'skvip',
    logStreamName: 'application',
    awsRegion: awsRegion,
    awsOptions: {
        credentials: {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretKey,
        },
        region: awsRegion,
    },
    messageFormatter: function ({ level, message, additionalInfo }) {
        return `[${level}] : ${message} ${JSON.stringify(additionalInfo)}`;
    }
});

// 設定 Winston Logger
export const logger = createLogger({
    level: 'info',
    format: format.json(),
    transports: [
        cloudWatchTransport
    ]
});
