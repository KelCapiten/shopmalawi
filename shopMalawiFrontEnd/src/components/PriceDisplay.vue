<template>
  <div class="price-display">
    <div class="price">MWK {{ formattedPrice }}</div>
    <div class="stock-info">Only {{ stock }} left</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "PriceDisplay",
  props: {
    price: {
      type: [Number, String],
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const formattedPrice = computed(() => {
      // Convert price to a number if it is a string
      const value =
        typeof props.price === "string" ? parseFloat(props.price) : props.price;
      // Format the number to have exactly two decimals
      const fixed = value.toFixed(2);
      // Split into integer and decimal parts
      const parts = fixed.split(".");
      // Use a regular expression to add a space as a thousand separator to the integer part
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      return parts.join(".");
    });

    return { formattedPrice };
  },
});
</script>

<style scoped>
.price-display {
  background-color: rgb(43, 187, 62);
  color: white;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-family: Arial, sans-serif;
}

.price {
  font-weight: bold;
  font-size: 1.4rem;
  margin-bottom: 4px;
}

.stock-info {
  font-size: 0.9rem;
  color: #ffe3e3;
  font-weight: bold;
}
</style>
