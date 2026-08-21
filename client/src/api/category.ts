import axiosClient from "./axiosClient";
import { Category, CategoryType } from "../types/category";

export async function listCategoriesApi(type?: CategoryType): Promise<Category[]> {
  const { data } = await axiosClient.get<{ categories: Category[] }>("/categories", {
    params: type ? { type } : undefined,
  });
  return data.categories;
}
