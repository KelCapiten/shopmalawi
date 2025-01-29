// src/utils/utilities.ts
import router from "@/router";
import { Product } from "@/types";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:1994";

export function getPrimaryImage(
  images: { image_path: string; is_primary: number }[]
): string {
  const primaryImage = images.find((img) => img.is_primary === 1);
  return primaryImage
    ? `${API_BASE_URL}${primaryImage.image_path}`
    : "https://via.placeholder.com/150";
}

export function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatDate(date: string): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  return new Date(date).toLocaleDateString("en-GB", options);
}

export function navigateToProductPage(product: Product): void {
  sessionStorage.setItem("selectedProduct", JSON.stringify(product));
  router.push({ name: "ProductPage", params: { id: product.id } });
}

export function getOneWeekAgoDate() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
}
