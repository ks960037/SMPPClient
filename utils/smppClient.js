import smpp from 'smpp';
// 載入環境變數
import dotenv from 'dotenv';
dotenv.config();

// import mongoose from 'mongoose';
// const Types = mongoose.Schema.Types
import { SMSRecord } from '../models/SMPPRocord.js';

const url = process.env.TELCO_URL
const acc = process.env.TELCO_ACC
const pas = process.env.TELCO_PAS

/** smpp 單例 */
let session;
/** 發起 smpp 會話 */
function createSmppSession() {
    console.log("發起 smpp 會話")
    session = smpp.connect({
        url: url,
        auto_enquire_link_period: 10000,
        reconnect_delay: 5000,
        debug: true
    });

    // SMSC连接成功时触发
    session.on('connect', onConnected);

    session.on('bind_transceiver', () => {
        console.log("成功綁定到 SMSC 後，可以開始發送短訊");
    });

    session.on('deliver_sm', onDeliver);

    session.on('delivery_receipt', (pdu) => {
        console.log("處理傳送回執 (DLR)", pdu)
    });

    session.on('status_report', (pdu) => {
        console.log("處理狀態回執(SR)", pdu)
    });

    // SMSC连接关闭时触发
    session.on('close', () => {
        console.log('SMSC连接已关闭');
    });

    // SMSC连接错误时触发
    session.on('error', (error) => {
        console.log('SMSC连接出现错误:', error);
    });

    // 监听SIGINT信号（Ctrl + C）并关闭SMPP连接
    process.on('SIGINT', () => {
        console.log('接收到 SIGINT 信号，关闭 SMPP 连接');
        removeSmppSession()
    });
}

/** 處理中的訊息數量 */
let count = 0;

// 連線後綁定帳密
const onConnected = () => {
    console.log('SMSC连接成功');
    session.bind_transceiver({
        system_id: acc,
        password: pas
    }, (pdu) => {
        if (pdu.command_status === 0) {
            console.log('绑定成功');
            // 在绑定成功后发送短信
            processSMSReqs()
        } else {
            console.log('绑定失败');
            session.close();
        }
    });
}

/** 處理訊息佇列 */
async function processSMSReqs() {
    console.log("開始處理訊息佇列", SMSReqs)
    while (SMSReqs.length > 0) {
        const SMSReq = SMSReqs.pop();
        console.log("處理中的訊息佇列:", SMSReq)

        const userId = SMSReq.userId;
        const phones = SMSReq.phones;
        const content = SMSReq.content;
        const batchId = SMSReq.batchId;

        // 記錄到資料庫
        // const records = [];
        for (const phone of phones) {
            console.log(phone)
            try {
                const record = await SMSRecord.create({
                    sender: userId,
                    receiver: phone,
                    content: content,
                    smppType: 1,
                    batchId: batchId,
                    statusCode: 1,
                    statusMessage: "smpp 發送中"
                })
                sendSMS(record.id, phone, content);
            } catch (e) {
                console.error("資料庫記錄發生錯誤:", e)
            }
        }
        // TODO:改成用 insertMany 提高效率
        // SMSRecord.insertMany(records);

        count++;
    }
}

// 发送短信函数
function sendSMS(recordId, receiver, content) {
    // console.log("檢查 sendSMS", recordId, receiver, content)
    // return
    const submitSm = {
        //source_addr: '639506584595', // 发送者号码
        destination_addr: receiver, // 接收者号码
        short_message: content, // 短信内容
    };
    // 向 smpp 發送簡訊號碼及內容
    session.submit_sm(submitSm, (pdu) => {
        console.log("協議數據單元:", pdu);
        if (pdu.command_status === 0) {
            console.log('短信发送成功');
            if (pdu.message_id == "-1") {
                SMSRecord.updateOne({
                    _id: recordId
                }, {
                    messageId: pdu.message_id,
                    statusCode: 4,
                    statusMessage: "smpp 發送失敗",
                })
            } else {
                // 成功 -> 更新記錄
                SMSRecord.updateOne({
                    _id: recordId
                }, {
                    messageId: pdu.message_id,
                    statusCode: 2,
                    statusMessage: "smpp 已送出",
                })
            }
        } else {
            console.log('短信发送失败');
            // 失敗 -> 更新記錄
            SMSRecord.updateOne({
                _id: recordId
            }, {
                messageId: pdu.message_id,
                statusCode: 4,
                statusMessage: "smpp 發送失敗",
            })
        }
    });
}

// 送出
const onDeliver = async (pdu) => {
    if (pdu.command === 'deliver_sm') {
        console.log("收到短訊", pdu)
        // 成功送出 => 更新記錄 (此時使用 message_id 作為標示)
        SMSRecord.updateOne({
            messageId: pdu.message_id,
        }, {
            statusCode: 3,
            statusMessage: "smpp 已送達",
        })
        count--;
    } else if (pdu.command === 'deliver_sm_resp') {
        console.log("收到發送短訊的回應", pdu)
    }
    // 全部發送成功，關閉連線
    if (count == 0)
        removeSmppSession();
}

// 中斷連線並清除 session 單例
function removeSmppSession() {
    console.log("中斷 smpp 會話")
    session.close();
    session = null;
}

/**訊息範例
 * {
 *  userId: string,
    phones: string[],
    content: string,
    batchId: string
 * }
 */

/** 訊息佇列 */
const SMSReqs = [];
export function sendSMSToSmppClient(SMSReq) {
    // 將訊息推送到訊息佇列
    SMSReqs.push(SMSReq);
    // console.log("會話狀態", session)
    // 確認 session 狀態，如果斷線了就重新建立連線
    if (!session) {
        createSmppSession()
    }
    else {
        // 連線還在就直接處理發送
        processSMSReqs()
    }
}