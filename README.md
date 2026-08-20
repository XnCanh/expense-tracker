# Web Quản Lý Chi Tiêu (Expense Tracker)

Dự án Web Quản lý Chi tiêu cá nhân và sao kê đa tài khoản ngân hàng.

---

## 📁 Cấu trúc Dự án (Architecture)

```text
expense-tracker/
├── docker-compose.yml         # Thiết lập container MongoDB (Replica Set), Server, Client
├── .gitignore                 # Bỏ qua node_modules, .env, mongo_data...
├── README.md                  # Hướng dẫn chạy và tài liệu dự án
│
├── server/                    # Backend (Node.js + Express + TypeScript)
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── config/            # Cấu hình db.ts (MongoDB Mongoose), env.ts
│       ├── controllers/       # Controller xử lý nghiệp vụ
│       ├── middlewares/       # Auth JWT middleware, Error handling
│       ├── models/            # Schema User, Wallet, Category, Transaction
│       ├── routes/            # Khai báo endpoint API
│       ├── services/          # Business logic & Transaction
│       ├── utils/             # Helper format, JWT, stream
│       ├── app.ts             # Express App
│       └── server.ts          # Server bootstrap & DB connection
│
└── client/                    # Frontend (React + Vite + TypeScript)
    ├── Dockerfile
    ├── .dockerignore
    ├── .env.example
    ├── .env
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── api/               # Axios client & API endpoints
        ├── components/        # Layout & Route guards
        ├── contexts/          # Auth Context
        ├── pages/             # Các trang giao diện
        ├── types/             # Type definitions
        ├── App.tsx
        ├── index.css          # Design system & styles
        └── main.tsx
```

---

## 🚀 Hướng dẫn Chạy với Docker (Khuyên dùng)

### 1. Chuẩn bị file môi trường
Tạo file `.env` từ file mẫu `.env.example`:
- `server/.env`
- `client/.env`

### 2. Khởi chạy toàn bộ hệ thống
```bash
docker compose up -d --build
```

### 3. Kiểm tra dịch vụ
- **Client (Frontend)**: [http://localhost:5173](http://localhost:5173)
- **Server Healthcheck API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **MongoDB**: `localhost:27017` (Replica set: `rs0`)

---

## 🛠️ Hướng dẫn Chạy Thủ Công (Không dùng Docker)

### 1. Khởi động MongoDB Replica Set
Dự án sử dụng **MongoDB Session Transactions** để đảm bảo tính toàn vẹn số dư và chống chi tiêu âm. MongoDB cần chạy ở chế độ **Replica Set**:
```bash
mongod --replSet rs0 --dbpath <đường_dẫn_data>
# Ở terminal khác:
mongosh --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
```

### 2. Chạy Server
```bash
cd server
npm install
npm run dev
```

### 3. Chạy Client
```bash
cd client
npm install
npm run dev
```

---

## 🔗 Liên kết Git & Đẩy lên GitHub

Để đưa mã nguồn lên kho lưu trữ cá nhân trên GitHub:
```bash
git remote add origin https://github.com/<tên-tài-khoản-github>/<tên-repo>.git
git branch -M main
git push -u origin main
```
