<script setup>
import {
  NPagination,
  useLoadingBar,
  NCard,
  NButton,
  NDivider,
  NSpace,
  NTag,
  NCheckbox,
  NCheckboxGroup,
  useMessage,
  NSkeleton,
  NCarousel,
  NCarouselItem,
  NBreadcrumb,
  NBreadcrumbItem,
  NImage,
  NImageGroup,
  useThemeVars,
  NTabs,
  NScrollbar,
  NDatePicker,
  NTabPane,
  NSelect,
} from "naive-ui";
import { ref, onMounted, computed } from "vue";
import moment from "moment/min/moment-with-locales";
import { useClientStore } from "@/store/client";
moment.locale("id");

const $clientStore = useClientStore();

const { $api } = useApi();
const { $addSeparator, $citiesType, $provincesType, $toBase64 } = useNuxtApp();
const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();
const $message = useMessage();
const $loadingBar = useLoadingBar();
const $breakpoint = useBreakpoint();
const { $storage } = useStorage();
const { $createError } = useError();
const $local = reactive({
  mainLoading: false,
  showBooking: null,
});

const $classified = {
  Halal: "halal",
  Regular: "regular",
  Excluded: "excluded",
};

const {
  data: $productData,
  error: $productError,
  pending: $productPending,
  refresh: $refreshClient,
} = await useFetch(`${useRuntimeConfig()?.public.apiUrl}/destinations/${route.params.slug}`, {
  method: "get",
  key: `destinations/${route.params.slug}`,
  watch: false,
});

watchEffect(() => {
  $refreshClient();
});

definePageMeta({
  hidden: true,
});
</script>
<template>
  <div>
    <Head
      ><Title>Hotel {{ $productData?.result?.title || "" }}</Title></Head
    >

    <atoms-image-native
      v-if="$productData?.result?.pictures?.[0]?.picture"
      :src="$productData?.result?.pictures?.[0]?.picture"
      height="250px"
    >
      <template #none
        ><n-space class="bg-slate-100 w-full h-full" justify="center" align="center">
          <atoms-icon flat size="25" name="camera" class="!text-primary" /></n-space
      ></template>
      <section class="grid grid-cols-2 w-full h-full">
        <div></div>
        <div class="grid grid-cols-2 overflow-hidden">
          <atoms-image-native
            v-for="(_picture, _i_picture) in Array.from(
              Array(
                $productData?.result?.pictures?.length <= 4
                  ? 4
                  : $productData?.result?.pictures?.length
              ).keys()
            )?.map((_item) => $productData?.result?.pictures?.[_item] || _item)"
            :key="_i_picture"
            :src="_picture.picture"
          >
            <template #none
              ><n-space class="bg-slate-100 w-full h-full" justify="center" align="center">
                <atoms-icon
                  flat
                  size="25"
                  name="camera"
                  class="!text-primary" /></n-space></template
          ></atoms-image-native>
        </div>
      </section>
    </atoms-image-native>
    <div v-else class="h-[250px] bg-white-smoke dark:bg-black-pure relative top-0 left-0"></div>

    <atoms-container v-if="!$productPending && $productData?.result?.id">
      <n-button
        type="primary"
        @click="router.push({ path: '/destination' })"
        class="-translate-y-28"
        >Back</n-button
      >

      <n-card class="mx-auto -translate-y-24">
        <div v-if="!$productData?.result?.id" class="space-y-2">
          <n-skeleton :repeat="2"></n-skeleton>
          <n-skeleton :repeat="2" width="50%"></n-skeleton>
        </div>
        <div v-else class="space-y-2">
          <Head>
            <Title>Hotel {{ $productData?.result?.name }}</Title>
          </Head>
          <atoms-heading class="capitalize">
            {{ $productData?.result?.title }}
          </atoms-heading>

          <atoms-text class="mb-1" caption
            >Posted {{ moment($productData?.result?._created_date).format("DD MMMM YYYY") }} ·
            {{ $productData?.result?.category }}</atoms-text
          >
        </div>
      </n-card>
      <n-card class="mx-auto -translate-y-16">
        <atoms-text caption strong class="!text-primary capitalize">Description </atoms-text>
        <atoms-text class="capitalize">{{ $productData?.result?.description || "-" }}</atoms-text>
        <br />
        <atoms-text caption strong class="!text-primary capitalize">Location </atoms-text>
        <atoms-text class="capitalize"
          >Address : {{ $productData?.result?.address || "-" }}</atoms-text
        >
        <atoms-text class="capitalize">City : {{ $productData?.result?.city || "-" }}</atoms-text>
        <atoms-text class="capitalize"
          >Province : {{ $productData?.result?.province || "-" }}</atoms-text
        >
        <br />
        <molecules-map-embed
          v-if="Boolean($productData?.result?.latitude && $productData?.result?.longitude)"
          clean
          radius
          class="bg-primary w-full h-[500px] !overflow-hidden"
          :locations="[$productData?.result]"
        />
      </n-card>
    </atoms-container>
    <atoms-container v-else>
      <n-skeleton card height="250px" :repeat="2"></n-skeleton>
    </atoms-container>
  </div>
</template>
