import express from 'express';
const router = express.Router();
import dotenv from 'dotenv';
dotenv.config();
import { sendSMSToSmppClient } from "../utils/smppClient.js"

const smppKey = process.env.SMPP_KEY

// 發送短信
router.post('/', async (req, res) => {
    console.log("請求發送短信", req.body)
    const body = req.body;
    const userId = body.userId;
    const batchId = body.batchId;
    const phones = body.phones;
    const content = body.content;
    const key = body.smppkey;

    if (smppKey !== key) return res.status(401).send({
        message: "沒有正確的 smppkey"
    });

    try {
        sendSMSToSmppClient({
            userId,
            batchId,
            phones,
            content
        });
        res.status(200).send({
            message: "成功",
        });
    } catch (error) {
        res.status(400).send(error);
    }
});

export default router;
