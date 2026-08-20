import { useState, useEffect } from "react";

interface HealthData {
  status: string;
  db: string;
  timestamp: string;
}

function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error("Loi ket noi server:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 640, margin: "60px auto", padding: 24, fontFamily: "sans-serif", textAlign: "center" }}>
      <h1>Web Quản Lý Chi Tiêu</h1>
      <p style={{ color: "#666" }}>Dự án đã khởi tạo cấu trúc và kết nối MongoDB thành công.</p>

      <div style={{ marginTop: 32, padding: 20, background: "#f5f5f5", borderRadius: 8, textAlign: "left" }}>
        <h3>Trạng thái kết nối Hệ thống:</h3>
        {loading ? (
          <p>Đang kiểm tra...</p>
        ) : health ? (
          <ul>
            <li><strong>Server:</strong> {health.status}</li>
            <li><strong>MongoDB:</strong> {health.db}</li>
            <li><strong>Thời gian:</strong> {new Date(health.timestamp).toLocaleString("vi-VN")}</li>
          </ul>
        ) : (
          <p style={{ color: "red" }}>Không thể kết nối đến Backend Server (http://localhost:5000)</p>
        )}
      </div>
    </div>
  );
}

export default App;
