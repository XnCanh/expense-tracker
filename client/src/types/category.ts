export type CategoryType = "income" | "expense";

export interface Category {
  _id: string;
  name: string;
  type: CategoryType;
  isDefault: boolean;
}
