# 🗄️ Thiết kế Cơ sở Dữ liệu (Database Design)

Tài liệu này mô tả chi tiết mô hình dữ liệu MongoDB, sơ đồ thực thể liên kết (ERD), chiến lược đánh chỉ mục (Compound Indexing) và cơ chế giao dịch nguyên tử ACID.

---

## 📊 Sơ đồ Thực thể (Entity Relationship Diagram - ERD)

```mermaid
erDiagram
    USER ||--o{ WALLET : owns
    USER ||--o{ TRANSACTION : creates
    USER ||--o{ CATEGORY : customizes
    WALLET ||--o{ TRANSACTION : logs
    CATEGORY ||--o{ TRANSACTION : classifies

    USER {
        ObjectId _id PK
        string googleId UK
        string email UK
        string name
        string avatarUrl
        datetime createdAt
        datetime updatedAt
    }

    WALLET {
        ObjectId _id PK
        ObjectId userId FK
        string name
        string bankName
        string accountNumber
        number initialBalance
        number currentBalance
        datetime startDate
        datetime createdAt
        datetime updatedAt
    }

    CATEGORY {
        ObjectId _id PK
        ObjectId userId FK "Nullable (null = Default system category)"
        string name
        string type "income | expense"
        string icon
        datetime createdAt
    }

    TRANSACTION {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId walletId FK
        ObjectId categoryId FK
        string type "income | expense"
        number amount
        number balanceAfter
        datetime date
        string note
        datetime createdAt
        datetime updatedAt
    }
```

---

## ⚡ Chiến lược Đánh Chỉ mục Phức hợp (Compound Index Strategy)

Nhằm tối ưu hóa hiệu năng truy vấn cho bài toán **100 ví / tài khoản và hàng triệu bản ghi giao dịch**, hệ thống áp dụng các chỉ mục B-Tree chuyên biệt:

| Collection | Chỉ mục (Indexes) | Mục đích tối ưu | Độ phức tạp |
|---|---|---|---|
| **Users** | `{ googleId: 1 }` (Unique)<br/>`{ email: 1 }` (Unique) | Xác thực đăng nhập Google tức thì | $O(1)$ Hash / $O(log N)$ |
| **Wallets** | `{ userId: 1, createdAt: -1 }` | Lấy danh sách ví của User và tính Tổng số dư | $O(log N)$ |
| **Transactions** | `{ userId: 1, walletId: 1, date: -1, _id: -1 }` | **Chỉ mục cốt lõi**: Phục vụ truy vấn Lịch sử, Bộ lọc Sao kê theo ngày và xuất báo cáo Stream | $O(log N)$ |
| **Transactions** | `{ userId: 1, date: -1 }` | Lấy danh sách giao dịch gần đây trên Trang chủ | $O(log N)$ |
| **Categories** | `{ userId: 1, type: 1 }` | Lấy danh mục Thu/Chi theo người dùng | $O(log N)$ |

---

## 🔒 Cơ chế Giao dịch ACID (MongoDB Multi-Document Transactions)

Khi người dùng thực hiện giao dịch **Chi tiền (Expense)** hoặc **Gỡ ví (Delete Wallet)**:
```typescript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Khóa và đọc số dư hiện tại của Ví
  const wallet = await Wallet.findOne({ _id: walletId, userId }).session(session);
  
  // 2. Chặn chi âm tuyệt đối
  if (type === "expense" && wallet.currentBalance < amount) {
    throw new AppError("Số dư trong ví không đủ để thực hiện giao dịch", 400);
  }

  // 3. Cập nhật số dư nguyên tử
  wallet.currentBalance += (type === "income" ? amount : -amount);
  await wallet.save({ session });

  // 4. Tạo bản ghi giao dịch với balanceAfter
  await Transaction.create([{ ...data, balanceAfter: wallet.currentBalance }], { session });

  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```
