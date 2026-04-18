// Frontend TypeScript types for Product API
export interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Payload shape for creating/updating a product
export interface ProductCreate {
  name: string;
  price: number;
  inStock: boolean;
  tags?: string[];
}

// Generic API wrapper (aligns with the OpenAPI contract where responses wrap data)
export interface ApiList<T> {
  data: T;
}

export type ApiError = { error: string };
