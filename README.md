# 💰 Web Quản Lý Chi Tiêu Cá Nhân (Expense Tracker)

Hệ thống Web Quản lý Chi tiêu Cá nhân & Sao kê Đa Tài khoản Ngân hàng, được xây dựng với **React (TypeScript)**, **Node.js (Express + TypeScript)**, **MongoDB Replica Set** và đóng gói hoàn chỉnh bằng **Docker Compose**.

---

## 📚 Tài Liệu Thiết Kế Kỹ Thuật (Documentation)

Dự án đi kèm bộ tài liệu thiết kế kỹ thuật tiêu chuẩn cao tại thư mục [`docs/`](docs/):

* 📘 **[Tài liệu Thiết kế Kỹ thuật Tổng hợp (TDD)](TechnicalDesignDocument.md)**
* 📌 **[Tổng quan Hệ thống & Ca sử dụng (System Overview)](docs/system-overview.md)**
* 🏗️ **[Kiến trúc Hệ thống & Ngăn xếp Công nghệ (Architecture)](docs/architecture.md)**
* 🗄️ **[Thiết kế Cơ sở Dữ liệu & Chiến lược Index (Database)](docs/database.md)**
* 🔌 **[Đặc tả Toàn bộ API Endpoints (API Specification)](docs/api.md)**
* 🚀 **[Giải pháp Xử lý Dữ liệu lớn & Chịu tải cao (Advanced Design)](docs/advanced-design.md)**

---

## ⚡ Hướng Dẫn Khởi Chạy Nhanh (Quickstart với Docker)

### Bước 1: Chuẩn bị file môi trường
Tạo file `.env` tại 2 thư mục `server/` và `client/`:
* Tại thư mục `server/`: Tạo file `.env`
  ```env
  PORT=5000
  MONGO_URI=mongodb://localhost:27017/expense_tracker?replicaSet=rs0
  JWT_SECRET=change_this_secret_in_production
  JWT_EXPIRES_IN=7d
  GOOGLE_CLIENT_ID=608534526399-0o9qkv4rgtckldhs273quf7h53vqetv7.apps.googleusercontent.com
  CLIENT_ORIGIN=http://localhost:5173
  ```

* Tại thư mục `client/`: Tạo file `.env`
  ```env
  VITE_API_URL=http://localhost:5000/api
  VITE_GOOGLE_CLIENT_ID=608534526399-0o9qkv4rgtckldhs273quf7h53vqetv7.apps.googleusercontent.com
  ```

---

### Bước 2: Khởi chạy toàn bộ hệ thống bằng Docker
Từ thư mục gốc dự án, chạy lệnh:
```bash
docker compose up -d --build
```

---

### Bước 3: Truy cập ứng dụng
* 🌐 **Giao diện Client (Frontend):** [http://localhost:5173](http://localhost:5173)
* 📡 **Máy chủ API (Backend Healthcheck):** [http://localhost:5000/api/health](http://localhost:5000/api/health)
* 🗄️ **Cơ sở dữ liệu MongoDB:** `localhost:27018` (Replica Set: `rs0`)

---

## 🧪 Kiểm Thử Tự Động (Automated Testing)
Dự án tích hợp bộ kiểm thử tự động toàn diện kiểm tra 100% các tính năng nghiệp vụ:
```bash
node scratch/test_full_suite.js
```
**Kết quả kiểm thử:** `14/14 PASSED (100% thành công)`.
