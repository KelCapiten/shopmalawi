//\src\components\StorePage.vue
<template>
  <IonPage>
    <IonContent>
      <section class="hero-section" v-if="store.bannerUrl">
        <img :src="store.bannerUrl" alt="Store Banner" class="hero-image" />
        <div class="hero-overlay">
          <h1 class="hero-title">{{ store.brandName || "Your Brand" }}</h1>
          <p class="hero-subtitle">
            {{ store.tagline || "Showcase Your Brand" }}
          </p>
        </div>
        <div class="profile-circle">
          <img :src="store.profilePictureUrl" alt="Profile Picture" />
        </div>
      </section>

      <IonCard class="brand-story-card">
        <IonCardHeader>
          <IonCardTitle>Our Story</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>
            {{
              store.description ||
              "Tell your customers what makes your brand special. Share your story, mission, and values here."
            }}
          </p>
        </IonCardContent>
      </IonCard>

      <IonGrid
        class="category-tiles"
        v-if="store.categories && store.categories.length"
      >
        <IonRow>
          <IonCol
            v-for="category in store.categories"
            :key="category.id"
            size="6"
            class="category-tile"
            @click="filterByCategory(category.name)"
          >
            <div class="tile-content">
              <img
                :src="category.iconUrl"
                alt="Category Icon"
                class="category-icon"
              />
              <p class="tile-label">{{ category.name }}</p>
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>

      <IonSegment v-model="selectedSegment" class="store-segment">
        <IonSegmentButton value="featured">
          <IonLabel>Featured</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="all">
          <IonLabel>All Products</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="manage">
          <IonLabel>Manage</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      <div v-if="selectedSegment === 'featured'" class="featured-carousel">
        <IonSlides :options="sliderOptions">
          <IonSlide
            v-for="product in featuredProducts"
            :key="product.id"
            class="slide"
          >
            <div class="slide-inner">
              <img
                :src="product.imageUrl"
                alt="Featured Product"
                class="featured-image"
              />
              <h2>{{ product.name }}</h2>
              <p>{{ product.description }}</p>
              <p class="featured-price">MWK {{ product.price.toFixed(2) }}</p>
            </div>
          </IonSlide>
        </IonSlides>
      </div>

      <div v-else-if="selectedSegment === 'all'" class="products-grid">
        <IonGrid>
          <IonRow>
            <IonCol
              v-for="product in filteredProducts"
              :key="product.id"
              size="6"
              class="product-col"
            >
              <IonCard>
                <img
                  :src="product.imageUrl"
                  alt="Product Image"
                  class="product-image"
                />
                <IonCardHeader>
                  <IonCardTitle>{{ product.name }}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>{{ product.description }}</p>
                  <p class="price">MWK {{ product.price.toFixed(2) }}</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </div>

      <div v-else class="manage-products">
        <IonButton expand="block" color="primary" @click="addProduct">
          Add New Product
        </IonButton>
        <IonList>
          <IonItem
            v-for="product in store.products"
            :key="product.id"
            button
            @click="editProduct(product)"
          >
            <IonThumbnail slot="start">
              <img :src="product.imageUrl" alt="product thumbnail" />
            </IonThumbnail>
            <IonLabel>
              <h2>{{ product.name }}</h2>
              <p>MWK {{ product.price.toFixed(2) }}</p>
            </IonLabel>
            <IonButton
              fill="clear"
              color="secondary"
              @click.stop="deleteProduct(product.id)"
            >
              <IonIcon slot="icon-only" :icon="trashIcon" />
            </IonButton>
          </IonItem>
        </IonList>
      </div>
    </IonContent>
    <div class="floating-share-toolbar">
      <ShareToolbar
        :enableNavigationToolbar="true"
        :enableShareToolbar="false"
      />
    </div>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { trashOutline } from "ionicons/icons";
import ShareToolbar from "./ShareToolbar.vue";

export default defineComponent({
  name: "StorePage",
  components: { ShareToolbar },
  setup() {
    const store = ref({
      brandName: "My Awesome Brand",
      tagline: "Quality & Creativity",
      description:
        "Welcome to our special corner! We focus on delivering unique products backed by an inspiring brand story. Explore our featured items, categories, and find out why we're special.",
      bannerUrl: "https://via.placeholder.com/800x300.png?text=My+Store+Banner",
      profilePictureUrl: "https://via.placeholder.com/100?text=Profile",
      categories: [
        {
          id: 1,
          name: "Fashion",
          iconUrl: "https://via.placeholder.com/50/0000FF?text=F",
        },
        {
          id: 2,
          name: "Electronics",
          iconUrl: "https://via.placeholder.com/50/FF0000?text=E",
        },
        {
          id: 3,
          name: "Home",
          iconUrl: "https://via.placeholder.com/50/00FF00?text=H",
        },
      ],
      products: [
        {
          id: 1,
          name: "Product One",
          description: "A must-have for anyone who loves style!",
          price: 150.0,
          imageUrl: "https://via.placeholder.com/200?text=Product+1",
          category: "Fashion",
          featured: true,
        },
        {
          id: 2,
          name: "Product Two",
          description: "Upgrade your tech game with this gadget",
          price: 250.0,
          imageUrl: "https://via.placeholder.com/200?text=Product+2",
          category: "Electronics",
          featured: true,
        },
        {
          id: 3,
          name: "Product Three",
          description: "Transform your home with this unique item",
          price: 300.0,
          imageUrl: "https://via.placeholder.com/200?text=Product+3",
          category: "Home",
          featured: false,
        },
        {
          id: 4,
          name: "Product Four",
          description: "Another fashion gem you'll love",
          price: 120.0,
          imageUrl: "https://via.placeholder.com/200?text=Product+4",
          category: "Fashion",
          featured: false,
        },
      ],
    });

    const selectedSegment = ref("featured");
    const selectedCategory = ref("");

    const sliderOptions = {
      slidesPerView: 1.3,
      spaceBetween: 10,
      centeredSlides: true,
    };

    const featuredProducts = computed(() =>
      store.value.products.filter((p) => p.featured)
    );

    const filteredProducts = computed(() => {
      if (!selectedCategory.value) return store.value.products;
      return store.value.products.filter(
        (p) => p.category === selectedCategory.value
      );
    });

    const filterByCategory = (catName: string) => {
      selectedSegment.value = "all";
      selectedCategory.value = catName;
    };

    const addProduct = () => {
      console.log("Add new product");
    };

    const editProduct = (product: any) => {
      console.log("Edit product", product);
    };

    const deleteProduct = (productId: number) => {
      store.value.products = store.value.products.filter(
        (p) => p.id !== productId
      );
    };

    const trashIcon = trashOutline;

    return {
      store,
      selectedSegment,
      selectedCategory,
      sliderOptions,
      featuredProducts,
      filteredProducts,
      filterByCategory,
      addProduct,
      editProduct,
      deleteProduct,
      trashIcon,
    };
  },
});
</script>

<style scoped>
.hero-section {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}
.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-overlay {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
}
.profile-circle {
  position: absolute;
  top: 50%;
  left: 16px;
  transform: translateY(-50%);
  width: 130px;
  height: 130px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #b9b9b9;
}
.profile-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0.5rem 0;
}
.hero-subtitle {
  font-size: 1rem;
  margin: 0;
}
.brand-story-card {
  margin: 1rem;
}
.category-tiles {
  margin: 1rem;
}
.category-tile {
  text-align: center;
  margin-bottom: 1rem;
}
.tile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}
.category-icon {
  width: 50px;
  height: 50px;
  object-fit: cover;
  margin-bottom: 0.5rem;
}
.tile-label {
  font-size: 0.9rem;
  font-weight: 500;
}
.store-segment {
  margin: 1rem;
}
.featured-carousel {
  padding: 0.5rem 1rem;
}
.slide {
  display: flex;
  justify-content: center;
  align-items: center;
}
.slide-inner {
  text-align: center;
}
.featured-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  margin-bottom: 0.5rem;
}
.featured-price {
  font-weight: bold;
  margin-top: 0.5rem;
}
.products-grid {
  padding: 1rem;
}
.product-col {
  margin-bottom: 1rem;
}
.product-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}
.price {
  font-weight: bold;
  margin-top: 0.5rem;
}
.manage-products {
  padding: 1rem;
}
.floating-share-toolbar {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
}
</style>
