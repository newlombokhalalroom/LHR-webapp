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
const { $addSeparator, $citiesType, $provincesType, $toBase64, $window, $trim } = useNuxtApp();
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
  dataAmenities: null,
  dataPictures: null,
  dataRooms: null,
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
} = await useFetch(`${useRuntimeConfig()?.public.apiUrl}/products/${route.params.slug}`, {
  method: "get",
  key: `products/${route.params.slug}`,
  watch: false,
});

const $getSpesificAmenities = (_items, _target) =>
  _items.amenities?.filter((_item) =>
    _item?.category?.toLowerCase()?.includes(_target?.toLowerCase())
  ) || [];

watchEffect(() => {
  $refreshClient();
});

onMounted(() => {
  console.log($productData);
});

definePageMeta({
  hidden: true,
});
</script>
<template>
  <div>
    <Head
      ><Title>Hotel {{ $productData?.result?.name || "" }}</Title></Head
    >
    <atoms-image-native
      v-if="$productData?.result?.pictures?.[0]?.picture"
      :src="$productData?.result?.pictures?.[0]?.picture"
      height="250px"
    >
      <template #none
        ><n-space
          class="bg-white-smoke dark:bg-black-pure w-full h-full"
          justify="center"
          align="center"
        >
          <atoms-icon flat size="25" name="camera" class="!text-primary" /></n-space
      ></template>
      <section class="grid grid-cols-2 w-full h-full">
        <div></div>
        <div class="grid grid-cols-2 overflow-hidden">
          <atoms-image-native :src="$productData?.result?.pictures?.[1]?.picture">
            <template #none
              ><n-space
                class="bg-white-smoke dark:bg-black-pure w-full h-full"
                justify="center"
                align="center"
              >
                <atoms-icon
                  flat
                  size="25"
                  name="camera"
                  class="!text-primary" /></n-space></template
          ></atoms-image-native>
          <atoms-image-native :src="$productData?.result?.pictures?.[2]?.picture">
            <template #none
              ><n-space
                class="bg-white-smoke dark:bg-black-pure w-full h-full"
                justify="center"
                align="center"
              >
                <atoms-icon
                  flat
                  size="25"
                  name="camera"
                  class="!text-primary" /></n-space></template
          ></atoms-image-native>
          <atoms-image-native :src="$productData?.result?.pictures?.[3]?.picture">
            <template #none
              ><n-space
                class="bg-white-smoke dark:bg-black-pure w-full h-full"
                justify="center"
                align="center"
              >
                <atoms-icon
                  flat
                  size="25"
                  name="camera"
                  class="!text-primary" /></n-space></template
          ></atoms-image-native>
          <atoms-image-native :src="$productData?.result?.pictures?.[4]?.picture">
            <template #none
              ><n-space
                class="bg-white-smoke dark:bg-black-pure w-full h-full"
                justify="center"
                align="center"
              >
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
      <atoms-icon
        type="primary"
        name="chevron-left"
        @click="router.push({ path: '/travel' })"
        class="-translate-y-28 !p-0 !m-0"
      ></atoms-icon>
      <n-card class="mx-auto -translate-y-24">
        <div v-if="!$productData?.result?.id" class="space-y-2">
          <n-skeleton :repeat="2"></n-skeleton>
          <n-skeleton :repeat="2" width="50%"></n-skeleton>
        </div>
        <div v-else class="space-y-2 flex flex-wrap gap-5">
          <div class="ring-5 ring-primary">
            <atoms-image-native
              width="125px"
              height="125px"
              :src="$productData?.result?.client?.picture"
            >
              <template #none
                ><n-space
                  class="bg-white-smoke dark:bg-black-pure w-full h-full"
                  justify="center"
                  align="center"
                >
                  <atoms-icon
                    flat
                    size="25"
                    name="domain"
                    class="!text-primary !mb-0" /></n-space></template
            ></atoms-image-native>
          </div>
          <div>
            <Head>
              <Title>Hotel {{ $productData?.result?.title }}</Title>
            </Head>
            <atoms-heading class="capitalize">
              {{ $productData?.result?.title }}
            </atoms-heading>
            <br />
            <atoms-text class="mb-1" caption
              >Posted
              {{ moment($productData?.result?._created_date).format("DD MMMM YYYY") }}</atoms-text
            >
            <!-- <n-space>
              <n-tag size="small" type="primary"> Halal Certified </n-tag>
              <n-tag size="small"> Hotel </n-tag></n-space
            > -->
          </div>
        </div>
      </n-card>

      <n-card class="-translate-y-16">
        <n-divider title-placement="left" class="!mt-0">
          <atoms-text span strong>Description</atoms-text>
        </n-divider>
        <div>
          <atoms-text v-html="$productData?.result?.description" />
        </div>
        <n-divider title-placement="left">
          <atoms-text span strong>Tour Inclusion</atoms-text>
        </n-divider>
        <div>
          <section
            v-if="$getSpesificAmenities($productData?.result, $classified.Regular)?.length > 0"
            class="md:grid grid-cols-3 gap-5"
          >
            <div
              v-for="(_amenity, _iamenity) in $getSpesificAmenities(
                $productData?.result,
                $classified.Regular
              )"
              :key="_iamenity"
              class="space-y-1"
            >
              <atoms-text caption strong class="!text-primary capitalize"
                >{{ _amenity.category }}
              </atoms-text>
              <atoms-text class="capitalize">{{ _amenity.title || "-" }}</atoms-text>
            </div>
          </section>
          <atoms-text v-else>-</atoms-text>
        </div>
        <n-divider title-placement="left">
          <atoms-text span strong>Tour Exclusion</atoms-text>
        </n-divider>
        <div>
          <section
            v-if="$getSpesificAmenities($productData?.result, $classified.Excluded)?.length > 0"
            class="md:grid grid-cols-3 gap-5"
          >
            <div
              v-for="(_amenity, _iamenity) in $getSpesificAmenities(
                $productData?.result,
                $classified.Excluded
              )"
              :key="_iamenity"
              class="space-y-1"
            >
              <atoms-text caption strong class="!text-primary capitalize"
                >{{ _amenity.category }}
              </atoms-text>
              <atoms-text class="capitalize">{{ _amenity.title || "-" }}</atoms-text>
            </div>
          </section>
          <atoms-text v-else>-</atoms-text>
        </div>
        <n-divider title-placement="left">
          <atoms-text span strong>Halal Services</atoms-text>
        </n-divider>
        <div>
          <section
            v-if="$getSpesificAmenities($productData?.result, $classified.Halal)?.length > 0"
            class="md:grid grid-cols-3 gap-5"
          >
            <div
              v-for="(_amenity, _iamenity) in $getSpesificAmenities(
                $productData?.result,
                $classified.Halal
              )"
              :key="_iamenity"
              class="space-y-1"
            >
              <atoms-text caption strong class="!text-primary capitalize"
                >{{ _amenity.category }}
              </atoms-text>
              <atoms-text class="capitalize">{{ _amenity.title || "-" }}</atoms-text>
            </div>
          </section>
          <atoms-text v-else>-</atoms-text>
        </div>
        <br />
      </n-card>
      <n-card class="-translate-y-12">
        <section class="grid grid-cols-2 items-center">
          <div>
            <atoms-text span class="!text-primary">Price starts from </atoms-text>

            <atoms-heading h4>IDR {{ $addSeparator($productData?.result?.price) }}</atoms-heading>
            <atoms-text caption class="text-primary"> (Inclusives of taxes) </atoms-text>
          </div>
          <div class="flex justify-end">
            <n-button
              v-if="$productData?.result?.client"
              type="primary"
              @click="
                $window.open(
                  `https://api.whatsapp.com/send?phone=${$trim(
                    $productData?.result?.client?.phone?.replaceAll('+', '')
                  )}&text=Hello%2C+im+curious+about+your+package+in+LombokHalalRoom.com+which+is+${$trim(
                    $productData?.result?.title
                  )}+Package&type=phone_number&app_absent=0`,
                  '_blank'
                )
              "
              class=""
              data-action="share/whatsapp/share"
            >
              Chat Now
              <template #icon
                ><atoms-icon flat name="whatsapp" class="!text-black"></atoms-icon></template
            ></n-button>
          </div>
        </section>
      </n-card>
    </atoms-container>
    <atoms-container v-else>
      <n-skeleton card height="250px" :repeat="2"></n-skeleton>
    </atoms-container>
  </div>
</template>
