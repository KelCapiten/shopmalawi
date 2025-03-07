//src/types/index.ts

// Image related interfaces
export interface Image {
  image_path: string;
  alt_text: string;
  is_primary: boolean;
}

// Product related interfaces
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  mark_up_amount: number;
  category_id: number;
  category_name: string;
  maincategory_id: number | null;
  maincategory_name: string | null;
  stock_quantity: number;
  is_active: boolean;
  uploaded_by_userID: number;
  uploaded_by: string;
  images: Image[];
  created_at: string;
  isSellerPick?: boolean;
  location_id: number; // Add location_id
  location_name: string; // Add location_name
}

export interface AddProductResponse {
  message: string;
  productId: number;
  product: Product;
}

export interface AddProductPayload {
  name: string;
  description: string;
  price: number;
  category_id: number;
  location_id: number;
  stockQuantity: number;
  images: File[];
}

export interface EditProductPayload {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  location_id: number;
  stockQuantity: number;
  images?: File[];
}

export interface GetProductsFilters {
  category_id?: number;
  startDate?: string;
  endDate?: string;
  groupBy?: string;
  uploaded_by?: number;
  includeInactive?: boolean;
  store_id?: number;
}

// Category related interfaces
export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number | null;
  subcategories?: Category[];
}

// Payment related interfaces
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

// Location related interfaces
export interface Location {
  id: number;
  name: string;
}

// Store related interfaces
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
  category_id?: number;
}

// Order related interfaces
export interface OrderData {
  user_id: number;
  shipping_address: string;
  shipping_town: string;
  total_amount: number;
  payment_method_id: number;
  payment_amount: number;
  order_items: {
    product_id: number;
    quantity: number;
    price: number;
  }[];
}
