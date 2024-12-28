import { defineStore } from "pinia";
import { ref, onMounted } from "vue";
import { moon, sunny } from "ionicons/icons";

export const useThemeStore = defineStore("theme", () => {
  const isDarkMode = ref(false);
  const themeIcon = ref(sunny);

  const applyTheme = (darkMode: boolean) => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
    themeIcon.value = darkMode ? moon : sunny;
  };

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;
    applyTheme(isDarkMode.value);
    try {
      localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode.value));
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  onMounted(() => {
    try {
      const savedTheme = localStorage.getItem("isDarkMode");
      if (savedTheme !== null) {
        isDarkMode.value = JSON.parse(savedTheme);
        applyTheme(isDarkMode.value);
      }
    } catch (error) {
      console.error("Failed to load theme preference:", error);
    }
  });

  return {
    isDarkMode,
    themeIcon,
    toggleTheme,
  };
});
