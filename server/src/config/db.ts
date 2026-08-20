import mongoose from "mongoose";

export async function connectDB(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    console.log("[db] Ket noi MongoDB thanh cong!");
  } catch (err) {
    console.error("[db] Loi ket noi MongoDB:", err);
    process.exit(1);
  }
}
