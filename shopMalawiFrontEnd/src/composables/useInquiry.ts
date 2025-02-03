//\src\composables\useInquiry.ts
import { ref } from "vue";
import inquiriesService from "@/services/inquiriesService";
import type { Product } from "@/types";

export function useInquiries() {
  const inquiries = ref<any[]>([]);
  const products = ref<Product[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchInquiries = async () => {
    loading.value = true;
    try {
      inquiries.value = await inquiriesService.getInquiries();
    } catch (err) {
      error.value = "Failed to fetch inquiries";
    } finally {
      loading.value = false;
    }
  };

  const addInquiry = async (payload: any) => {
    loading.value = true;
    try {
      await inquiriesService.addInquiry(payload);
      await fetchInquiries();
    } catch (err) {
      error.value = "Failed to add inquiry";
    } finally {
      loading.value = false;
    }
  };

  const updateInquiry = async (id: number, payload: any) => {
    loading.value = true;
    try {
      await inquiriesService.updateInquiry(id, payload);
      await fetchInquiries();
    } catch (err) {
      error.value = "Failed to update inquiry";
    } finally {
      loading.value = false;
    }
  };

  const deleteInquiry = async (id: number) => {
    loading.value = true;
    try {
      await inquiriesService.deleteInquiry(id);
      await fetchInquiries();
    } catch (err) {
      error.value = "Failed to delete inquiry";
    } finally {
      loading.value = false;
    }
  };

  const linkProductToInquiry = async (
    inquiries_id: number,
    product_id: number
  ) => {
    loading.value = true;
    try {
      await inquiriesService.associateInquiryToProduct({
        inquiries_id,
        product_id,
      });
    } catch (err) {
      error.value = "Failed to associate product";
    } finally {
      loading.value = false;
    }
  };

  const unlinkProductFromInquiry = async (
    inquiries_id: number,
    product_id: number
  ) => {
    loading.value = true;
    try {
      await inquiriesService.disassociateInquiry(inquiries_id, product_id);
    } catch (err) {
      error.value = "Failed to disassociate product";
    } finally {
      loading.value = false;
    }
  };

  const getProductsLinkedToInquiryAndUser = async (
    inquiries_id: number,
    uploaded_by: number
  ) => {
    loading.value = true;
    try {
      products.value = await inquiriesService.getProductsByInquiryAndUser(
        inquiries_id,
        uploaded_by
      );
    } catch (err) {
      error.value = "Failed to fetch products";
    } finally {
      loading.value = false;
    }
  };

  return {
    inquiries,
    products,
    loading,
    error,
    fetchInquiries,
    addInquiry,
    updateInquiry,
    deleteInquiry,
    linkProductToInquiry,
    unlinkProductFromInquiry,
    getProductsLinkedToInquiryAndUser,
  };
}
