// src/utils/utilities.ts
import router from "@/router";
import { Product } from "@/types/types";
import type { Category } from "@/types/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:1994";

export function updateImageUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

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

export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
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

export function loadProductFromSessionStorage<T>(): T | null {
  const stored = sessionStorage.getItem("selectedProduct");
  if (stored) {
    return JSON.parse(stored) as T;
  } else {
    router.replace({ name: "shop" });
    return null;
  }
}

export function computeSubcategories(categories: Category[]): Category[] {
  return categories
    .flatMap((category) =>
      category.subcategories && category.subcategories.length > 0
        ? category.subcategories
        : [category]
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}
