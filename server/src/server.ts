import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";

async function bootstrap() {
  // Kết nối MongoDB
  await connectDB(env.mongoUri);

  app.listen(env.port, () => {
    console.log(`[server] Server dang chay tai: http://localhost:${env.port}`);
  });
}

bootstrap();
