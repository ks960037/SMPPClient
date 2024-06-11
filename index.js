// 載入環境變數
import dotenv from 'dotenv';
dotenv.config();

// 使用 express 建構服務端
import express from 'express';
import cors from "cors";
const app = express();
app.use(express.json());
const corsOptions = {
    origin: ['http://localhost:3000', 'https://smshub24.com/'],
    credentials: true
}
app.use(cors(corsOptions));

import mongoose from "mongoose"
// 連線資料庫
const mongodbUri = process.env.MONGODB_URI;
try {
    console.log(`嘗試連線資料庫${mongodbUri}......`)
    // await mongoose.connect(config.dburl, DB_OPTIONS)
    mongoose.promise = global.Promise
    mongoose.connect(mongodbUri, {
        ssl: true,
        tlsCAFile: `./mongoKey/ca.pem`,
        tlsCertificateKeyFile: `./mongoKey/client.pem`,
        directConnection: true,
        tlsAllowInvalidHostnames: true,
        tlsCertificateKeyFilePassword: 'test1234',
        serverSelectionTimeoutMS: 60000
    })
    console.log('DB connection established')
} catch (error) {
    console.error('DB connection failed', error)
}

// 載入路由
import smppClient from "./routes/smppClient.js"
app.use("/smpp", smppClient);

// 檢查埠是否被佔用，若被佔用則使用下一個可用的埠
import portfinder from 'portfinder';
portfinder.basePort = process.env.PORT;
try {
    const port = await portfinder.getPortPromise()
    app.listen(port, () => {
        console.log(`Listening on ${port}...`)
    });
} catch (err) {
    console.error('Error finding port:', err);
}
