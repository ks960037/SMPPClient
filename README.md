# SMPP 發送客戶端

## smpp type 定義
1. Telco

## smpp 發送流程
1. http 傳送資料
    1. userId:用戶id
    2. phones:號碼陣列
    3. content:簡訊內容
    4. batchId:批次id
2. 服務器記錄並回應
3. smpp client 處理並記錄
4. smpp 收到發送成功 更新記錄
5. smpp 收到成功訊號 更新記錄