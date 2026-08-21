import axiosClient from "./axiosClient";
import { LoginResponse } from "../types/auth";

export async function loginWithGoogleIdToken(idToken: string): Promise<LoginResponse> {
  const { data } = await axiosClient.post<LoginResponse>("/auth/google", { idToken });
  return data;
}

export async function fetchMe(): Promise<LoginResponse> {
  const { data } = await axiosClient.get<LoginResponse>("/auth/me");
  return data;
}
