//\src\services\inquiriesService.ts
import apiClient from "@/services/apiClient";

const inquiriesService = {
  async getInquiries() {
    const res = await apiClient.get("/api/inquiries/getInquiries");
    return res.data;
  },
  async addInquiry(payload: FormData) {
    const res = await apiClient.post("/api/inquiries/addInquiry", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  async updateInquiry(id: number, payload: any) {
    const res = await apiClient.put(
      `/api/inquiries/updateInquiry/${id}`,
      payload
    );
    return res.data;
  },
  async deleteInquiry(id: number) {
    const res = await apiClient.delete(`/api/inquiries/deleteInquiry/${id}`);
    return res.data;
  },
  async associateInquiryToProduct(data: {
    inquiries_id: number;
    product_id: number;
  }) {
    const res = await apiClient.post(
      "/api/inquiries/associateInquiryToProduct",
      data
    );
    return res.data;
  },
  async disassociateInquiry(inquiries_id: number, product_id: number) {
    const res = await apiClient.delete(
      `/api/inquiries/disassociateInquiry/${inquiries_id}/${product_id}`
    );
    return res.data;
  },
  async getProductsByInquiryAndUser(inquiries_id: number) {
    const res = await apiClient.get(
      "/api/inquiries/getProductsAssociatedWithInquiry",
      {
        params: { inquiries_id },
      }
    );
    return res.data;
  },
};

export default inquiriesService;
