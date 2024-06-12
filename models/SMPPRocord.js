import mongoose from "mongoose";

const SMPPRecordSchema = new mongoose.Schema({
    sender: { // 發送者資訊 (用戶 id)
        type: String,
        required: true
    },
    receiver: { // 接收者號碼
        type: String,
        required: true
    },
    content: { // 訊息內容
        type: String,
        required: true
    },
    smppType: { // 使用哪個 smpp 發送
        type: Number,
        enum: [1],
        default: 1,
    },
    batchId: { // 記錄查帳時該記錄屬於哪個批次
        type: String,
        required: true
    },
    messageId: { // 發送記錄使用的比對條件
        type: String,
        default: ""
    },
    statusCode: {
        type: Number,
        enum: [0, 1, 2, 3, 4],
        default: 1,
    },
    statusMessage: {
        type: String,
        enum: ["成功", "smpp 發送中", "smpp 已送出", "smpp 已送達", "smpp 發送失敗"],
        default: "smpp 發送中",
    },
}, {
    collection: "SMPPRecords",
    timestamps: true,
});

export const SMPPRecord = mongoose.model("SMPPRecord", SMPPRecordSchema);
