<script setup>
import {
  NForm,
  NButton,
  NTag,
  NDivider,
  NSkeleton,
  useNotification,
  NScrollbar,
  NSpace,
  NCard,
  NTabs,
  NTabPane,
  useLoadingBar,
} from "naive-ui";
import { useAmenitiesStore } from "@/store/amenities";
import { useDetailStore } from "@/store/detail";
import { useProductStore } from "@/store/product";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

const $detailStore = useDetailStore();
const { data: $dataDetail } = storeToRefs($detailStore);
const $amenitiesStore = useAmenitiesStore();
const { data: $dataAmenities } = storeToRefs($amenitiesStore);
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const url = useRequestURL();
const router = useRouter();
const route = useRoute();
const { $createError } = useError();
const { $api } = useApi();
const { $removeSeparator, $addSeparator, $uploadFile } = useNuxtApp();
const $breakpoint = useBreakpoint();
const $loadingBar = useLoadingBar();
const $notification = useNotification();

const $local = reactive({
  showBooking: null,
});

definePageMeta({
  hidden: true,
});

const { data, pending } = await useLazyAsyncData(
  `products/${route.params.id}`,
  () =>
    $fetch(`${useRuntimeConfig()?.public.apiUrl}/products/${route.params.id}`, {
      method: "get",
    }),
  {
    transform: (payload) => payload?.result || null,
    watch: false,
  },
);

provide("$setShowBooking", (_payload) => {
  $local.showBooking = _payload;
});
</script>
<template>
  <div>
    <molecules-drawer
      v-model:show="$local.showBooking"
      height="100%"
      :content="{
        title: `Booking ${$local.showBooking?.title || ''}`,
      }"
      @closed="$local.showBooking = null"
    >
      <molecules-booking :target="$local.showBooking" />
    </molecules-drawer>

    <n-skeleton v-if="pending" type="card" height="250px"></n-skeleton>
    <section v-else>
      <Head>
        <Title>{{ data?.title }}</Title>
        <Meta name="canonical" :content="url.origin" />
        <Meta name="description" :content="data?.description" />
        <Meta name="og:title" :content="data?.title" />
        <Meta name="og:description" :content="data?.description" />
        <Meta name="og:image" :content="data?.client?.picture" />
        <Meta name="twitter:title" :content="data?.title" />
        <Meta name="twitter:description" :content="data?.description" />
        <Meta name="twitter:image" :content="data?.client?.picture" />
        <Meta name="twitter:card" content="summary_large_image" />
      </Head>
      <client-only>
        <molecules-product :data="data" :pending="pending" />
      </client-only>
    </section>
    <br />
    <br />
  </div>
</template>
