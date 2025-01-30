//\src\services\inquiriesService.ts
import apiClient from "./apiClient";
import { Product } from "@/types";

interface AssociateInquiryPayload {
  inquiries_id: number;
  product_id: number;
}

interface AddInquiryPayload {
  name: string;
  description: string;
  category_id: number;
  stock_quantity: number;
  location_id: number;
  images: File[];
}

const inquiriesService = {
  addInquiry(payload: AddInquiryPayload): Promise<{ inquiryId: number }> {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("description", payload.description);
    formData.append("category_id", payload.category_id.toString());
    formData.append("stock_quantity", payload.stock_quantity.toString());
    formData.append("location_id", payload.location_id.toString());
    payload.images.forEach((image) => formData.append("files", image));
    return apiClient
      .post("/api/inquiries/addInquiry", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => response.data);
  },

  getInquiries(): Promise<any[]> {
    return apiClient
      .get("/api/inquiries/getInquiries")
      .then((response) => response.data);
  },

  associateInquiryToProduct(payload: AssociateInquiryPayload): Promise<void> {
    return apiClient
      .post("/api/inquiries/associateInquiryToProduct", payload)
      .then(() => {});
  },

  disassociateInquiry(inquiries_id: number, product_id: number): Promise<void> {
    return apiClient
      .post("/api/inquiries/disassociateInquiryFromProduct", {
        inquiries_id,
        product_id,
      })
      .then(() => {});
  },

  getProductsByInquiryAndUser(
    inquiries_id: number,
    user_id: number
  ): Promise<Product[]> {
    return apiClient
      .get("/api/inquiries/getProductsByInquiryAndUser", {
        params: { inquiries_id, uploaded_by: user_id },
      })
      .then((response) => response.data);
  },
};

export default inquiriesService;
