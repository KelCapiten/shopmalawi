//src/types/index.ts
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

export interface BankDetails {
  id: number;
  user_id: number;
  payment_method_name: string;
  account_number: string;
  account_holder_name: string;
  branch_code?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  description: string;
}

export interface Location {
  id: number;
  name: string;
}

// New interface for the store table
export interface Store {
  id: number;
  brand_name: string;
  tagline?: string;
  description?: string;
  banner_url?: string;
  profile_picture_url?: string;
  owner_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
