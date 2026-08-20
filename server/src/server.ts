import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { ensureDefaultCategories } from "./services/categoryService";

async function bootstrap() {
  // 1. Kết nối MongoDB
  await connectDB(env.mongoUri);

  // 2. Tự động khởi tạo các danh mục mặc định (Ăn uống, Đi lại, Lương...)
  await ensureDefaultCategories();

  // 3. Khởi chạy Express Server
  app.listen(env.port, () => {
    console.log(`[server] Server dang chay tai: http://localhost:${env.port}`);
  });
}

bootstrap();
