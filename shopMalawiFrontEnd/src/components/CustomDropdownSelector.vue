//src/components/CustomDropdownSelector.vue
<template>
  <div class="custom-selector">
    <label v-if="label">{{ label }}</label>
    <div
      ref="selectorRef"
      class="selector-display"
      tabindex="0"
      @click="toggleDropdown"
    >
      <span>{{ displayLabel }}</span>
      <svg
        class="selector-icon"
        xmlns="http://www.w3.org/2000/svg"
        height="24"
        width="24"
        viewBox="0 0 24 24"
      >
        <path d="M7 10l5 5 5-5z" />
      </svg>
    </div>
    <Teleport to="body">
      <div v-if="showDropdown" class="selector-dropdown" :style="dropdownStyle">
        <div
          class="selector-option"
          v-for="option in options"
          :key="option.id"
          @click="selectOption(option)"
        >
          {{ option.name }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
} from "vue";

export default defineComponent({
  name: "CustomDropdownSelector",
  props: {
    modelValue: {
      type: Number as () => number | null,
      default: null,
    },
    options: {
      type: Array as () => Array<{ id: number; name: string }>,
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
    placeholder: {
      type: String,
      default: "Select an option",
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const showDropdown = ref(false);
    const selectorRef = ref<HTMLElement | null>(null);
    const dropdownStyle = ref({});

    const displayLabel = computed(() => {
      if (!props.modelValue) return props.placeholder;
      const option = props.options.find((o) => o.id === props.modelValue);
      return option ? option.name : props.placeholder;
    });

    const updateDropdownPosition = () => {
      if (!selectorRef.value || !showDropdown.value) return;

      const rect = selectorRef.value.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 180; // max-height of dropdown

      // Determine if dropdown should appear above or below
      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      dropdownStyle.value = {
        position: "fixed",
        [showAbove ? "bottom" : "top"]: showAbove
          ? `${viewportHeight - rect.top + 8}px` // Added 8px gap when above
          : `${rect.bottom + 8}px`, // Added 8px gap when below
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: "999",
      };
    };

    const toggleDropdown = () => {
      showDropdown.value = !showDropdown.value;
      if (showDropdown.value) {
        nextTick(() => {
          updateDropdownPosition();
        });
      }
    };

    const selectOption = (option: { id: number; name: string }) => {
      emit("update:modelValue", option.id);
      showDropdown.value = false;
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (
        !selectorRef.value?.contains(event.target) &&
        !event.target.closest(".selector-dropdown")
      ) {
        showDropdown.value = false;
      }
    };

    onMounted(() => {
      window.addEventListener("click", handleClickOutside);
      window.addEventListener("scroll", updateDropdownPosition);
      window.addEventListener("resize", updateDropdownPosition);
      document.addEventListener("scroll", updateDropdownPosition, true); // Listen to all scrolling events
    });

    onUnmounted(() => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", updateDropdownPosition);
      window.removeEventListener("resize", updateDropdownPosition);
      document.removeEventListener("scroll", updateDropdownPosition, true);
    });

    return {
      showDropdown,
      selectorRef,
      dropdownStyle,
      displayLabel,
      toggleDropdown,
      selectOption,
    };
  },
});
</script>

<style scoped>
.custom-selector {
  position: relative;
}
.custom-selector label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.selector-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  padding: 8px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.selector-display:focus {
  border-color: orange;
  box-shadow: 0 0 5px rgba(255, 165, 0, 0.5);
  outline: none;
}
.selector-display span {
  color: #555;
}
.selector-icon {
  fill: #555;
  width: 16px;
  height: 16px;
}
.selector-dropdown {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 180px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}
.selector-option {
  padding: 8px;
  cursor: pointer;
}
.selector-option:hover {
  background: #f0f0f0;
}
</style>
