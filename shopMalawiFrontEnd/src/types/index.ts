// src/types/index.ts

export interface Image {
  image_path: string;
  alt_text: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  subcategory_id: number;
  subcategory_name: string;
  maincategory_id: number;
  maincategory_name: string;
  stock_quantity: number;
  uploaded_by_userID: number;
  uploaded_by: string;
  images: Image[];
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number | null;
  subcategories?: Category[];
}
