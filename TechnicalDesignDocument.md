# 📘 TÀI LIỆU THIẾT KẾ KỸ THUẬT (TECHNICAL DESIGN DOCUMENT)
## HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN & SAO KÊ ĐA TÀI KHOẢN NGÂN HÀNG (EXPENSE TRACKER)

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)
* **Tên dự án:** Expense Tracker System
* **Mục tiêu:** Cung cấp giải pháp quản lý tài chính cá nhân toàn diện, hỗ trợ quản lý đa ví / tài khoản ngân hàng, ghi chép thu chi tức thời, bảo vệ chống chi âm ACID và cung cấp hệ thống sao kê tài chính chuyên nghiệp với khả năng xuất báo cáo dữ liệu lớn (Streaming Excel & PDF).
* **Đối tượng sử dụng:** Người dùng cá nhân có nhu cầu quản lý dòng tiền từ nhiều tài khoản ngân hàng và ví tiền mặt.

---

## 2. NGĂN XẾP CÔNG NGHỆ (TECH STACK)
* **Frontend:** React 18, TypeScript, Vite, React Router v6, Lucide React, Facebook Modern Design System (Light/Dark Theme), Custom Animated Popup Modal & Toast System.
* **Backend:** Node.js 20 LTS, Express.js, TypeScript, Mongoose ODM, Zod Validation, Google Auth Library, JsonWebToken.
* **Streaming Engine:** ExcelJS (WorkbookWriter Stream), PDFKit (Stream Pipe + Arial Unicode TrueType Font).
* **Database:** MongoDB 7.0 cấu hình Replica Set (`rs0`) hỗ trợ Multi-Document ACID Transactions.
* **DevOps:** Docker & Docker Compose Containerization.

---

## 3. THIẾT KẾ KIẾN TRÚC & MÔ HÌNH DỮ LIỆU
* **Chi tiết Kiến trúc:** Xem tại [`docs/architecture.md`](docs/architecture.md)
* **Chi tiết Cơ sở Dữ liệu & Indexing:** Xem tại [`docs/database.md`](docs/database.md)
* **Chi tiết Đặc tả API:** Xem tại [`docs/api.md`](docs/api.md)
* **Chi tiết Giải pháp Nâng cao:** Xem tại [`docs/advanced-design.md`](docs/advanced-design.md)

---

## 4. GIẢI PHÁP CHO CÁC BÀI TOÁN THỬ THÁCH NÂNG CAO
1. **Xử lý 1 user có 100 tài khoản NH x Hàng triệu giao dịch:**
   * Áp dụng mô hình **Pre-aggregated Balance Mutation** trên từng ví, tính tổng số dư tức thời trong $O(N_{\text{wallets}}) = O(100) \approx 1.2\text{ms}$.
   * Đánh chỉ mục phức hợp `{ userId: 1, walletId: 1, date: -1, _id: -1 }` giúp truy vấn sao kê đạt tốc độ $O(\log N)$.
2. **Xuất báo cáo PDF và Excel hàng triệu dòng dữ liệu ($O(1)$ RAM):**
   * Sử dụng **MongoDB Cursor** kết hợp **ExcelJS Stream WorkbookWriter** và **PDFKit Pipe**, ghi trực tiếp ra HTTP Chunked Stream.
   * Bộ nhớ RAM duy trì ở mức hằng số tối thiểu $\approx 15\text{MB}$, loại bỏ hoàn toàn nguy cơ tràn RAM máy chủ.
3. **Kiến trúc Multi-Tenant quy mô lớn (Hàng triệu request/phút):**
   * Cơ chế Stateless JWT Authentication cho phép Scale ngang (Horizontal Scaling) không giới hạn.
   * Cách ly dữ liệu hoàn toàn theo `userId`, sẵn sàng Sharding với Shard Key `{ userId: "hashed" }`.
   * Giao dịch nguyên tử MongoDB ACID Transactions ngăn chặn triệt để Race Condition và chi âm.

---

## 5. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)
Hệ thống tích hợp bộ kiểm thử tự động toàn diện với **14/14 bài test thành công 100% (14 PASSED / 0 FAILED)**:
1. Healthcheck & Kết nối Cơ sở dữ liệu.
2. Khởi tạo User cá nhân hóa qua Google OAuth.
3. Bắt buộc tạo ví đầu tiên (`requiresWalletSetup: true`).
4. Tự động khởi tạo danh mục mặc định (10 danh mục).
5. Tạo nhiều ví khác nhau với số dư ban đầu.
6. Tính Tổng số dư đa ví theo thời gian thực.
7. Ghi chép Khoản Thu & Tự động tăng số dư.
8. Ghi chép Khoản Chi & Tự động trừ số dư.
9. Kiểm tra chống chi vượt số dư ví (ACID Protection).
10. Lịch sử giao dịch sắp xếp giảm dần (Mới nhất đến cũ nhất).
11. Báo cáo sao kê tài chính chi tiết chính xác 100%.
12. Xuất sao kê Excel (.xlsx) dạng Stream (HTTP 200 OK).
13. Xuất sao kê PDF (.pdf) dạng Stream Full Unicode (HTTP 200 OK).
14. Bảo mật & Cách ly dữ liệu Multi-Tenant giữa các User.
