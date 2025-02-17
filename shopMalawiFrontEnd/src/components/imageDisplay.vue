// src/components/imageDisplay.vue
<template>
  <div class="full-screen-image-container">
    <img
      :src="imageUrl"
      :alt="alt"
      :class="fullView ? 'full-view' : 'thumbnail'"
      @click="openModal"
    />
    <teleport to="body">
      <div v-if="modalVisible" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <img :src="imageUrl" :alt="alt" class="full-image" />
          <button class="close-button" @click="closeModal">&times;</button>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
export default {
  name: "imageDisplay",
  props: {
    imageUrl: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: "Image",
    },
    fullView: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      modalVisible: false,
    };
  },
  methods: {
    openModal() {
      this.modalVisible = true;
    },
    closeModal() {
      this.modalVisible = false;
    },
  },
};
</script>

<style scoped>
.thumbnail {
  cursor: pointer;
  max-height: 130px;
  width: auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}
.thumbnail:hover {
  transform: scale(1.05);
}
.full-view {
  width: 100%;
  height: 56vh;
  object-fit: cover;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}
.full-image {
  width: 100%;
  height: auto;
  border-radius: 10px;
}
.close-button {
  position: absolute;
  top: -10px;
  right: -10px;
  background: #fff;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 1.5rem;
  line-height: 30px;
  text-align: center;
  cursor: pointer;
}
</style>
