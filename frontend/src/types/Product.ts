// src/types/Product.ts
export interface Product {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  stock: number;
}
  