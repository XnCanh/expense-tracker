# 🚀 Thiết kế Nâng cao & Khả năng Mở rộng (Advanced System Design)

Tài liệu này phân tích giải pháp kỹ thuật chuyên sâu để giải quyết 3 bài toán thử thách nâng cao:
1. **Xử lý 1 user có 100 tài khoản ngân hàng, mỗi tài khoản có hàng triệu giao dịch.**
2. **Xuất báo cáo PDF và Excel đáp ứng hàng triệu dòng dữ liệu với bộ nhớ tối thiểu ($O(1)$ RAM).**
3. **Kiến trúc Multi-Tenant chịu tải cao (Hàng triệu request / phút).**

---

## ⚡ 1. Bài toán: 100 Tài khoản Ngân hàng x Hàng triệu Giao dịch

### Thách thức:
Nếu tính tổng số dư bằng cách `SUM` toàn bộ giao dịch mỗi khi mở App, hệ thống sẽ phải quét hàng trăm triệu records $\rightarrow$ sập database và nghẽn CPU.

### Giải pháp kỹ thuật:
1. **Pre-aggregated Balance Mutation:**
   - Mỗi Ví lưu sẵn `currentBalance`. Khi có giao dịch mới, số dư ví được cập nhật trực tiếp $\pm$ số tiền giao dịch trong $O(1)$.
   - Trang chủ tính **Tổng số dư** bằng cách chỉ quét qua 100 documents của bảng `Wallet`:
     $$\text{Thời gian truy vấn} = O(N_{\text{wallets}}) = O(100) \approx 1.2\text{ms}$$
2. **Compound Index B-Tree Clustered Search:**
   - Index: `{ userId: 1, walletId: 1, date: -1, _id: -1 }`.
   - Khi truy vấn sao kê của bất kỳ ví nào, database nhảy thẳng đến đúng node B-Tree mà không quét toàn bảng (Index Scan only), tốc độ đạt $O(\log N)$.
3. **Keyset / Cursor Pagination:**
   - Trả về dữ liệu theo trang phân đoạn nhỏ ($50 - 100$ items), tránh nạp mảng lớn vào bộ nhớ.

---

## 📑 2. Bài toán: Xuất Báo cáo Excel / PDF Hàng triệu Dòng Data ($O(1)$ RAM)

### Thách thức:
Việc nạp 1.000.000 dòng dữ liệu vào mảng JavaScript thông thường sẽ tiêu tốn $> 2\text{GB}$ RAM, gây lỗi **Node.js JavaScript Heap Out of Memory**.

### Giải pháp kỹ thuật:
```mermaid
flowchart LR
    MongoDB[(MongoDB Cursor)] -- "Batch Stream Data" --> NodeEngine[Node.js Stream Engine]
    NodeEngine -- "exceljs.stream.xlsx / pdfkit" --> ResStream[HTTP Response Pipe (Chunked Transfer)]
    ResStream -- "Direct Download Stream" --> Browser[User Browser]
```

1. **MongoDB Cursor Streaming:**
   - Dùng `Transaction.find(rangeFilter).sort({ date: -1 }).cursor()` đọc từng chunk nhỏ dữ liệu từ disk qua socket.
2. **ExcelJS WorkbookWriter Stream:**
   - Khởi tạo `new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res })`.
   - Mỗi dòng giao dịch được ghi và xả ngay ra mạng thông qua `sheet.addRow(...).commit()`.
   - **Bộ nhớ RAM tiêu thụ luôn cố định $\approx 15\text{MB} - 25\text{MB}$ bất kể file xuất có 100 dòng hay 10.000.000 dòng!**
3. **PDFKit Pipe Stream:**
   - Dùng `doc.pipe(res)` đẩy trực tiếp các trang PDF nén và font Unicode TrueType về client theo chuẩn HTTP/1.1 Chunked Transfer.

---

## 🌐 3. Bài toán: Kiến trúc Multi-Tenant Quy mô Lớn (Triệu Request / Phút)

### Thách thức:
Đảm bảo hàng triệu người dùng cùng truy cập không gây nghẽn cổ chai (bottleneck) và dữ liệu tài chính không bao giờ bị lẫn lộn giữa các người dùng.

### Giải pháp kỹ thuật:

```mermaid
graph TD
    ClientApps[Mobile & Web Clients] --> LB[Load Balancer: Nginx / AWS ALB]
    LB --> Node1[Server Instance 1]
    LB --> Node2[Server Instance 2]
    LB --> NodeN[Server Instance N (Horizontal Auto-Scaling)]

    Node1 --> MongoRouter[MongoDB Mongos Query Router]
    Node2 --> MongoRouter
    NodeN --> MongoRouter

    MongoRouter --> Shard1[(Shard 1: User Partition A-H)]
    MongoRouter --> Shard2[(Shard 2: User Partition I-P)]
    MongoRouter --> Shard3[(Shard 3: User Partition Q-Z)]
```

1. **Stateless JWT Architecture (Phi trạng thái):**
   - Server không lưu session trong memory. Mọi node server đều có thể giải mã token độc lập $\rightarrow$ Mở rộng ngang (Horizontal Scaling) vô hạn chỉ bằng cách tăng số lượng container.
2. **Logical Partitioning & Database Sharding:**
   - Toàn bộ Schema đều có trường bắt buộc `userId`.
   - Sẵn sàng Sharding MongoDB với Shard Key `{ userId: "hashed" }`, phân tán tải đồng đều trên nhiều cụm máy chủ vật lý độc lập.
3. **Chống Overdraft & Race Condition bằng ACID Transactions:**
   - Sử dụng cơ chế khóa tài liệu nguyên tử của MongoDB Replica Set (`session.withTransaction()`), đảm bảo tính nhất quán tuyệt đối của số dư tài khoản.
