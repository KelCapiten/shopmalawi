//\src\components\StorePage.vue
<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>{{ store.brandName || "My Store" }}</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <div v-if="store.bannerUrl" class="banner">
        <img :src="store.bannerUrl" alt="Store Banner" class="banner-image" />
      </div>

      <IonCard class="brand-info-card">
        <IonCardHeader>
          <IonCardTitle>{{ store.brandName || "Your Brand" }}</IonCardTitle>
          <IonCardSubtitle>{{
            store.tagline || "Showcase Your Brand"
          }}</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent>
          <p>
            {{
              store.description ||
              "Tell your customers about your brand and what makes it special."
            }}
          </p>
        </IonCardContent>
      </IonCard>

      <IonSegment v-model="selectedSegment" class="store-segment">
        <IonSegmentButton value="featured">
          <IonLabel>Featured</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="all">
          <IonLabel>All Products</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="manage">
          <IonLabel>Manage Products</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      <div v-if="selectedSegment !== 'manage'" class="products-grid">
        <IonGrid>
          <IonRow>
            <IonCol
              v-for="product in filteredProducts"
              :key="product.id"
              size="6"
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
              <img :src="product.imageUrl" />
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

      <IonFab
        vertical="bottom"
        horizontal="end"
        slot="fixed"
        v-if="selectedSegment !== 'manage'"
      >
        <IonFabButton @click="goToManage">
          <IonIcon :icon="createIcon" />
        </IonFabButton>
      </IonFab>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { trashOutline, createOutline } from "ionicons/icons";

export default defineComponent({
  name: "StorePage",
  setup() {
    const store = ref({
      brandName: "My Awesome Brand",
      tagline: "Quality & Creativity",
      description:
        "Welcome to my special corner where I showcase my brand and products. Discover what makes us unique and browse through our featured items.",
      bannerUrl: "https://via.placeholder.com/800x200.png?text=Store+Banner",
      products: [
        {
          id: 1,
          name: "Product One",
          description: "This is product one",
          price: 100.0,
          imageUrl: "https://via.placeholder.com/150",
        },
        {
          id: 2,
          name: "Product Two",
          description: "This is product two",
          price: 200.0,
          imageUrl: "https://via.placeholder.com/150",
        },
        {
          id: 3,
          name: "Product Three",
          description: "This is product three",
          price: 300.0,
          imageUrl: "https://via.placeholder.com/150",
        },
        {
          id: 4,
          name: "Product Four",
          description: "This is product four",
          price: 400.0,
          imageUrl: "https://via.placeholder.com/150",
        },
      ],
    });

    const selectedSegment = ref("featured");

    const filteredProducts = computed(() => {
      if (selectedSegment.value === "featured") {
        return store.value.products.slice(0, 2);
      } else if (selectedSegment.value === "all") {
        return store.value.products;
      }
      return [];
    });

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

    const goToManage = () => {
      selectedSegment.value = "manage";
    };

    const trashIcon = trashOutline;
    const createIcon = createOutline;

    return {
      store,
      selectedSegment,
      filteredProducts,
      addProduct,
      editProduct,
      deleteProduct,
      goToManage,
      trashIcon,
      createIcon,
    };
  },
});
</script>

<style scoped>
.banner {
  width: 100%;
  height: 200px;
  overflow: hidden;
}
.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.brand-info-card {
  margin: 1rem;
}
.store-segment {
  margin: 1rem;
}
.products-grid {
  padding: 1rem;
}
.product-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}
.manage-products {
  padding: 1rem;
}
.price {
  font-weight: bold;
  margin-top: 0.5rem;
}
</style>
