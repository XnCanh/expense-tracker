# 🔌 Đặc tả Giao diện Lập trình (API Specification)

Tất cả các API được thiết kế theo chuẩn **RESTful JSON API**, ngoại trừ các endpoint xuất báo cáo trả về luồng dữ liệu **Binary Stream** (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` và `application/pdf`).

---

## 🔑 Tiêu chuẩn Xác thực (Authentication)
Mọi yêu cầu (trừ `/api/auth/google`) đều phải gửi kèm Header:
```http
Authorization: Bearer <access_token>
```

---

## 📋 Danh sách Endpoints

### 1. Xác thực & Tài khoản (Auth)
| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/auth/google` | Đăng nhập bằng Google `idToken`. Trả về JWT Access Token & cờ `requiresWalletSetup`. |
| `GET` | `/api/auth/me` | Lấy thông tin tài khoản hiện tại (`name`, `email`, `avatarUrl`). |

### 2. Quản lý Ví (Wallets)
| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/wallets` | Lấy danh sách ví & tổng số dư hiện tại của người dùng. |
| `POST` | `/api/wallets` | Tạo ví mới (`name`, `bankName`, `accountNumber`, `initialBalance`, `startDate`). |
| `DELETE` | `/api/wallets/:id` | Gỡ ví và tự động xóa toàn bộ giao dịch liên quan (Cascade Deletion). |

### 3. Giao dịch Thu / Chi (Transactions)
| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/transactions` | Ghi chép khoản thu/chi. Tự động kiểm tra số dư và cập nhật số dư ví nguyên tử. |
| `GET` | `/api/transactions` | Lấy danh sách lịch sử giao dịch (hỗ trợ phân trang `page`, `limit`, lọc `walletId`). |

### 4. Danh mục (Categories)
| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/categories` | Lấy danh sách danh mục thu/chi hệ thống & tùy chỉnh. |

### 5. Sao kê & Báo cáo Dữ liệu lớn (Reports & Streaming)
| Phương thức | Endpoint | Mô tả | Định dạng phản hồi |
|---|---|---|---|
| `GET` | `/api/reports/statement` | Xem sao kê tổng hợp (`openingBalance`, `totalIncome`, `totalExpense`, `closingBalance`, `transactions`). | `application/json` |
| `GET` | `/api/reports/statement/export/excel` | **Xuất Báo cáo Excel dạng Stream** (Độ phức tạp $O(1)$ RAM). | `application/vnd.openxmlformats...` |
| `GET` | `/api/reports/statement/export/pdf` | **Xuất Báo cáo PDF Unicode dạng Stream** (Độ phức tạp $O(1)$ RAM). | `application/pdf` |
