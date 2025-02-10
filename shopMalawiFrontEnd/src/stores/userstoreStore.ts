import { defineStore } from "pinia";

export const useUserstoreStore = defineStore("userstoreStore", {
  state: () => ({
    bannerUrl: "",
    brandName: "",
    tagline: "",
  }),
  actions: {
    setBannerUrl(url: string) {
      this.bannerUrl = url;
    },
    setBrandName(name: string) {
      this.brandName = name;
    },
    setTagline(tagline: string) {
      this.tagline = tagline;
    },
  },
  persist: true,
});
