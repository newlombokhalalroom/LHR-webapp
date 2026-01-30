<script setup>
import {
  NCarousel,
  NButton,
  NButtonGroup,
  NSkeleton,
  NSpace,
  NCard,
  NTag,
  NDivider,
} from "naive-ui";
import { useUserStore } from "@/store/user";
import { useProductStore } from "@/store/product";
import { storeToRefs } from "pinia";

const $productStore = useProductStore();
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const router = useRouter();
const route = useRoute();
const url = useRequestURL();
const $refDestinationWrapper = ref(null);
const $config = useRuntimeConfig();
const $breakpoint = useBreakpoint();
const $categoriesType = useCookie("type-categories");
const { $api } = useApi();
const { $createError } = useError();
const { $isClientSide, $addSeparator, $lazyFetchBasedOnViewport } = useNuxtApp();
const $title = ref("About Us");
const $description = ref(
  "We stands as an exclusive travel application, uniquely tailored to cater to Muslim-friendly destinations exclusively within the captivating realm of Lombok. As a specialized platform, it seamlessly connects travelers with accommodations that meticulously align with Islamic principles."
);
const $image = ref(
  "https://firebasestorage.googleapis.com/v0/b/lombok-halal-room-sandbox.appspot.com/o/assets%2Fhero.png?alt=media&token=e9fda99f-ecd3-40df-9932-13595ae16742"
);
const $local = reactive({
  showBooking: null,
});

definePageMeta({
  order: 6,
  label: "About Us",
  title: "About Us",
  hidden: true,
  // navigator: ({ _user }) => {
  //   if (_user?.scope?.includes("admin")) return false;
  //   return true;
  // },
  // validation: ({ _user }) => {
  //   if (_user?.scope?.includes("admin")) return "/admin";
  // },
});

useSeoMeta({
  title: () => $title.value,
  description: () => $description.value,
  ogTitle: () => $title.value,
  ogDescription: () => $description.value,
  ogImage: () => $image.value,
  ogImageAlt: () => $title.value,
  ogImageSecureUrl: () => $image.value,
  ogImageUrl: () => $image.value,
  ogUrl: () => url.origin,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: () => $title.value,
  twitterDescription: () => $description.value,
  twitterImage: () => $image.value,
  twitterImageAlt: () => $title.value,
  robots: "index, follow",
});
</script>
<template>
  <div>About Us</div>
</template>
