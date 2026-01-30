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
const $tabs = {
  overview: "Overview",
  rent: "Rent",
  reviews: "Reviews",
};
const $local = reactive({
  mainLoading: false,
  tab: $tabs.overview,
  dataAmenities: null,
  dataPictures: null,
  dataRent: null,
  showBooking: null,
});
const {
  data: $clientData,
  error: $clientError,
  pending: $clientPending,
  refresh: $refreshClient,
} = await useFetch(`${useRuntimeConfig()?.public.apiUrl}/clients/${route.params.slug}`, {
  method: "get",
  key: `clients/${route.params.slug}`,
  watch: false,
});

const $onFetchAmenities = async () => {
  if ($clientData.value?.result?.id) {
    $local.mainLoading = true;
    try {
      const _resp = await $clientStore.get(`${$clientData.value?.result?.id}/details`);
      console.log(_resp);
      if (_resp?.status) {
        $local.dataAmenities = _resp.result?.flatMap((_item) => _item.amenities);
        $local.dataPictures = _resp.result?.flatMap((_item) => _item.pictures);
      }
    } catch (error) {
      $local.dataAmenities = null;
      $local.dataPictures = null;
      $createError(error);
    } finally {
      $local.mainLoading = false;
    }
  }
};

watch(
  () => $clientData.value?.result?.id,
  async (_payload) => {
    ///clients/{id}/amenities
    await $onFetchAmenities();
  }
);

watch([() => $local.tab, () => $clientData.value?.result], async (_payload) => {
  // console.log($local.tab, $clientData.value?.result?.id);
  if ($local.tab === $tabs.rent && $clientData.value?.result?.id) {
    $local.mainLoading = true;
    try {
      const _resp = await $clientStore.get(`${$clientData.value?.result?.id}/products`);
      // console.log(_resp);
      if (_resp?.status) {
        $local.dataRent = _resp.result;
      }
    } catch (error) {
      $createError(error);
    } finally {
      $local.mainLoading = false;
    }
  } else if ($local.tab === $tabs.overview && $clientData.value?.result?.id) {
    await $onFetchAmenities();
  }
});

watchEffect(() => {
  $refreshClient();
});

onMounted(() => {
  console.log($clientData);
});

definePageMeta({
  hidden: true,
});
</script>
<template>
  <molecules-drawer
    v-model:show="$local.showBooking"
    :content="{
      title: `Booking ${$local.showBooking?.title || ''}`,
    }"
    @closed="$local.showBooking = null"
  >
    <molecules-booking :target="$local.showBooking" />
  </molecules-drawer>
  <div>
    <Head
      ><Title>Car Rent {{ $clientData?.result?.name || "" }}</Title></Head
    >
    <atoms-image-native
      v-if="$clientData?.result?.picture"
      :src="$clientData?.result?.picture"
      height="250px"
    />
    <div v-else class="h-[250px] bg-primary-darken relative top-0 left-0"></div>
    <atoms-container v-if="!$clientPending && $clientData?.result?.id">
      <n-button
        type="primary"
        @click="router.push({ path: '/admin/hotel' })"
        class="-translate-y-28 !text-white"
        >Back
      </n-button>
      <n-card class="mx-auto -translate-y-24">
        <div v-if="!$clientData?.result?.id" class="space-y-2">
          <n-skeleton :repeat="2"></n-skeleton>
          <n-skeleton :repeat="2" width="50%"></n-skeleton>
        </div>
        <div v-else class="space-y-2 flex gap-5">
          <div class="ring-5 ring-primary">
            <atoms-avatar
              ref="$refPicture"
              class="cursor-pointer dark:!bg-black bg-white"
              :src="$clientData?.result?.picture"
              sizes="150"
              nickname="account"
            />
          </div>
          <div>
            <Head>
              <Title>{{ $clientData?.result?.name }}</Title>
            </Head>
            <atoms-heading class="capitalize">
              {{ $clientData?.result?.name }}
            </atoms-heading>
            <atoms-text
              >Joined
              {{ moment($clientData?.result?._created_date).format("DD MMMM YYYY") }}</atoms-text
            >
            <n-space>
              <!-- <n-tag size="small" type="primary"> Halal Certified </n-tag> -->
              <n-tag size="small"> Car Rent </n-tag></n-space
            >
          </div>
        </div>
      </n-card>

      <n-tabs v-model:value="$local.tab" type="segment" class="-translate-y-20">
        <n-tab-pane :name="$tabs.overview" :tab="$tabs.overview">
          <n-card>
            <template #header>
              <atoms-text strong>About</atoms-text>
            </template>
            <section class="space-y-2">
              <div>
                <atoms-text span strong class="!text-primary">Description</atoms-text>
                <atoms-text>{{ $clientData?.result?.description }}...</atoms-text>
              </div>
              <div>
                <atoms-text span strong class="!text-primary">Contact</atoms-text>
                <atoms-text>Email : {{ $clientData?.result?.email }}</atoms-text>
                <atoms-text>Phone : {{ $clientData?.result?.phone }}</atoms-text>
              </div>
            </section>
          </n-card>
          <br />
          <n-card v-if="$local.dataAmenities">
            <template #header>
              <atoms-text strong>Amenities</atoms-text>
            </template>
            <section class="grid md:grid-cols-3 gap-2">
              <div
                v-for="(_amenities, _iamenities) in Object.values(
                  $local.dataAmenities?.reduce((acc, ar) => {
                    if (!acc[ar.title]) acc[ar.title] = { ...ar };

                    return acc;
                  }, {})
                )"
                :key="_iamenities"
              >
                <atoms-text span strong class="!text-primary capitalize">{{
                  _amenities.category
                }}</atoms-text>
                <atoms-text>{{ _amenities.title }}</atoms-text>
              </div>
            </section>
          </n-card>
          <n-divider title-placement="left">
            <atoms-text span>Preview</atoms-text>
          </n-divider>
          <n-scrollbar
            v-if="$clientData?.result?.clientPictures?.length > 0"
            x-scrollable
            class="bg-white dark:bg-black"
          >
            <!-- $clientData?.result?.clientPictures -->
            <div class="flex">
              <atoms-image-native
                v-for="(_roomPicture, _iroomPicture) in Array.from(
                  Array(
                    $clientData?.result?.clientPictures?.length < 7
                      ? 7
                      : $clientData?.result?.clientPictures.length
                  ).keys()
                )?.map((_item) => $clientData?.result?.clientPictures?.[_item] || _item)"
                :key="_iroomPicture"
                :class="['!m-0 hover:shadow-md !cursor-pointer']"
                :src="_roomPicture.picture"
                width="250px"
                height="150px"
              >
                <template #none
                  ><n-space class="bg-slate-100 w-full h-full" justify="center" align="center">
                    <atoms-icon flat size="25" name="camera" class="!text-primary" /></n-space
                ></template>
              </atoms-image-native>
            </div>
          </n-scrollbar>
          <atoms-empty v-else message="None of pictures" image=""></atoms-empty>
          <n-divider title-placement="left">
            <atoms-text span>Location</atoms-text>
          </n-divider>
          <molecules-map-embed
            v-if="
              Boolean(
                $clientData?.result?.clientLocation?.latitude &&
                  $clientData?.result?.clientLocation?.longitude
              )
            "
            clean
            radius
            class="bg-primary w-full h-[500px] !overflow-hidden"
            :locations="[$clientData?.result?.clientLocation]"
          />
          <atoms-empty v-else message="None of locations" image=""></atoms-empty>
        </n-tab-pane>
        <n-tab-pane :name="$tabs.rent" :tab="$tabs.rent">
          <div
            v-if="$local.mainLoading || !$local.dataRent || $local.dataRent?.length <= 0"
            class="space-y-3"
          >
            <n-skeleton card height="100px" :repeat="5"></n-skeleton>
          </div>
          <div v-else class="space-y-3">
            <n-card
              size="small"
              v-for="(_item, _iitem) in $local.dataRent"
              class="shadow-2xl hover:shadow-sm cursor-pointer transition-all duration-300 ease-out"
            >
              <section class="grid grid-cols-5 gap-5">
                <atoms-image-native
                  :src="_item.pictures?.[0]?.picture"
                  :height="$breakpoint.smAndDown ? '200px' : 'auto'"
                  class="col-span-full md:col-span-1"
                  ><template #none
                    ><n-space class="h-[200px] bg-slate-100 w-full" justify="center" align="center">
                      <atoms-icon
                        flat
                        size="25"
                        name="domain"
                        class="!text-primary" /></n-space></template
                ></atoms-image-native>
                <div class="col-span-full md:col-span-4">
                  <div class="grid grid-cols-2 h-full">
                    <div class="col-span-1 flex flex-col h-full">
                      <div>
                        <atoms-text caption :to="`/${_item.client?.title}/${_item.client?.id}`">{{
                          _item.client?.name
                        }}</atoms-text>
                        <atoms-heading h4>{{ _item.title }}</atoms-heading>
                      </div>
                      <n-space class="mt-2">
                        <n-tag
                          v-for="(_amenities, _iamenities) in _item.amenities"
                          :key="_iamenities"
                          size="small"
                          type="primary"
                        >
                          {{ _amenities?.title || "-" }}
                        </n-tag>
                      </n-space>
                      <br />
                      <atoms-text span>{{ _item.description }}</atoms-text>
                      <br />
                      <div class="mt-auto">
                        <n-button type="primary" @click="$local.showBooking = _item"
                          >Book Now</n-button
                        >
                      </div>
                    </div>
                    <div class="col-span-1 flex flex-col items-end">
                      <n-tag>
                        <atoms-text span
                          >IDR {{ $addSeparator(_item.price || 0) }}/{{
                            _item.units || "rent"
                          }}</atoms-text
                        >
                      </n-tag>
                    </div>
                  </div>
                </div>
              </section>
            </n-card>
          </div>
        </n-tab-pane>
        <n-tab-pane :name="$tabs.reviews" :tab="$tabs.reviews">
          <n-card>
            <atoms-empty message="There are no reviews at the moment..." image=""></atoms-empty>
          </n-card>
        </n-tab-pane>
      </n-tabs>
    </atoms-container>
    <atoms-container v-else>
      <n-skeleton card height="500px"></n-skeleton>
    </atoms-container>
  </div>
</template>
