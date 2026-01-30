<script setup>
import {
  NButton,
  NCarousel,
  NSpace,
  NScrollbar,
  NCarouselItem,
  NSkeleton,
  NRate,
  NTag,
  NCard,
  NDivider,
} from "naive-ui";
import { ref, onMounted } from "vue";
import axios from "axios";

import { useUserStore } from "@/store/user";
import { useClientStore } from "@/store/client";
import { useProductStore } from "@/store/product";
import { storeToRefs } from "pinia";

const $productStore = useProductStore();
const $clientStore = useClientStore();
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const url = useRequestURL();
const { $createError } = useError();
const { $isClientSide, $addSeparator, $lazyFetchBasedOnViewport, $getGeolocation } = useNuxtApp();
const $refProductWrapper = ref(null);
const $refProductLoadBtn = ref(null);
const $breakpoint = useBreakpoint();
const route = useRoute();
const router = useRouter();
const $local = reactive({
  clientsLoading: false,
  mapLoading: false,
  clientData: null,
  carRentPage: 1,
  targetToFly: null,

  term: "",
  productLazyFetch: null,
  productMoreLoading: false,
  productLoading: false,
  productRaw: null,
  productData: null,
});

const $onFetchProduct = async (_payload) => {
  $local.moreLoading = true;
  if (!_payload?.noLoading) {
    $local.productLoading = true;
  }
  try {
    const _resp = await $productStore.get(null, {
      params: {
        filter: JSON.stringify({
          where: (
            "types.title iLIKE '%car%'" +
            " and " +
            ($local.term ? `products.title iLIKE '%${$local.term}%'` : "1=1")
          ).toLocaleLowerCase(),
          order: "products._created_date ASC",
        }),
        page: _payload?.page || 1,
        limit: _payload?.limit || 5,
      },
    });

    $local.productData = _resp.result;
    $local.productRaw = _resp;
  } catch (error) {
    $local.productData = null;
    $local.productRaw = null;
    $createError(error);
  } finally {
    $local.moreLoading = false;
    $local.productLoading = false;
  }
};

const $onFetchClients = async (_payload) => {
  $local.mapLoading = true;
  $local.clientsLoading = true;
  try {
    const _resp = await $clientStore.get(null, {
      params: {
        filter: JSON.stringify({
          where: "types.title iLIKE '%car%'".toLocaleLowerCase(),
          order: "clients._updated_date DESC",
        }),
        page: 1,
        limit: 5,
      },
    });
    $local.clientData = _resp?.result;

    if (
      !$local.clientData?.find(
        (_item) => _item?.clientLocation?.latitude && _item?.clientLocation?.longitude
      )
    ) {
      const latitude = "-8.5869286",
        longitude = "116.0910654";
      $local.clientData[0].clientLocation = {
        latitude,
        longitude,
        ...((await $getGeolocation(latitude, longitude)) || {}),
      };
    }
  } catch (error) {
    $local.clientData = null;
    $createError(error);
  } finally {
    $local.clientsLoading = false;
    $local.mapLoading = false;
  }
};

onMounted(() => {
  $onFetchClients();
  $onFetchProduct();
  // $lazyFetchBasedOnViewport($onFetchProduct, $refProductWrapper);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const $meta = ref({
  href: `${route.fullPath}`,
  title: "Rental",
  description:
    "Explore Lombok & Indonesia places in halal way. Search such hotels, vehicles, attractions, foods & others to plan a trip",
});

const $title = ref("Rental");
const $description = ref(
  "Explore Lombok & Indonesia places in halal way. Search such hotels, vehicles, attractions, foods & others to plan a trip"
);
const $image = ref("https://www.lombokhalalroom.com/favicon.ico");

definePageMeta({
  order: 2,
  label: "Rental",
  title: "Rental Transportation",
  navigator: ({ _user }) => {
    if (_user?.scope?.includes("admin")) return false;
    return true;
  },
  validation: ({ _user }) => {
    if (_user?.scope?.includes("admin")) return "/admin";
  },
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
  <div>
    <molecules-drawer
      v-model:show="$local.showBooking"
      :content="{
        title: `Booking ${$local.showBooking?.title || ''}`,
      }"
      @closed="$local.showBooking = null"
    >
      <molecules-booking :target="$local.showBooking" />
    </molecules-drawer>
    <!-- search room -->
    <section>
      <div class="bg-secondary">
        <atoms-container>
          <br />
          <br />
          <section>
            <atoms-heading h2 class="!text-black">Explore places by yourself</atoms-heading>
            <atoms-text class="!text-black"
              >Search rent prices on car, motorcycle and much more...</atoms-text
            >
          </section>
        </atoms-container>
      </div>
      <section class="grid grid-rows-2 h-full">
        <div class="min-h-[50px] bg-secondary"></div>
        <div class="bg-transparent"></div>
      </section>
      <!-- <div class="w-full relative overflow-hidden">
        <atoms-container
          class="w-[90%] md:w-full absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2"
        >
          <n-card class="w-full bg-white-smoke dark:bg-black rounded-md">
            <div class="w-full flex flex-wrap">
              <atoms-input
                placeholder="What types of rental would you like to rent..."
                hide-detail
                class="!rounded-r-none flex-1"
                ><template #prepend>
                  <atoms-icon
                    name="magnify"
                    class="!rounded-none bg-secondary"
                  ></atoms-icon> </template
              ></atoms-input>
              <atoms-input-date
                :is-date-disabled="(ts) => ts <= $dateEdit(new Date())"
                type="date"
                disabled
                format="dd MMMM yyyy"
                hide-detail
                class="!rounded-none"
                style="border-radius: none !important"
                ><template #prepend>
                  <atoms-icon
                    name="calendar"
                    class="!rounded-none bg-secondary"
                  ></atoms-icon> </template
              ></atoms-input-date>
              <n-button
                @click="$onFetchProduct"
                type="warning"
                class="!rounded-none w-full md:w-auto"
                >Search</n-button
              >
            </div>
          </n-card>
        </atoms-container>
      </div> -->
    </section>
    <atoms-container>
      <section ref="$refProductWrapper" class="">
        <div class="space-y-2">
          <section class="space-y-5">
            <n-skeleton v-if="$local.productLoading" height="100px" width="100%" :repeat="5" />
            <div v-else-if="$local.productData?.length >= 0" class="space-y-5">
              <div
                v-for="(_item, _iitem) in $local.productData"
                :key="_iitem"
                @click.stop="router.push({ path: '/rental/' + _item?.client.id })"
                class="shadow-xl hover:shadow-sm rounded-md overflow-hidden cursor-pointer transition-all duration-300 ease-out bg-white dark:bg-black"
              >
                <section class="grid grid-cols-5">
                  <atoms-image-native
                    :src="_item.pictures?.[0]?.picture"
                    class="col-span-full md:col-span-1 min-h-[200px]"
                    ><template #none
                      ><n-space
                        class="h-full bg-white-smoke dark:bg-primary w-full"
                        justify="center"
                        align="center"
                      >
                        <atoms-icon
                          flat
                          size="25"
                          name="domain"
                          class="!text-primary dark:!text-white" /></n-space></template
                  ></atoms-image-native>
                  <!-- @click.stop="router.push({ path: '/rental/' + _item.id })" -->
                  <div class="col-span-full md:col-span-4 p-5">
                    <div class="grid md:grid-cols-2">
                      <div class="col-span-1 order-2 md:order-1 flex flex-col h-full">
                        <div>
                          <atoms-heading h4>{{ _item.title }}</atoms-heading>
                          <atoms-text caption :to="`/${_item.client?.title}/${_item.client?.id}`">{{
                            _item.client?.name
                          }}</atoms-text>
                        </div>
                      </div>
                      <div class="col-span-1 order-1 md:order-2 flex gap-2 md:flex-col items-end">
                        <atoms-text caption>Starts with,</atoms-text>
                        <n-tag size="small">
                          <atoms-text caption
                            >IDR {{ $addSeparator(_item.price || 0) }}/{{
                              _item.units || "rent"
                            }}</atoms-text
                          >
                        </n-tag>
                      </div>
                    </div>
                    <br />
                    <n-space class="">
                      <n-tag size="small" type="primary" class="capitalize">
                        {{ _item.client?.title || "-" }}
                      </n-tag>
                      <n-tag
                        size="small"
                        class="capitalize"
                        v-for="(_product_amentities, _ipa) in _item.amenities?.slice(0, 5)"
                        :key="_ipa"
                        >{{ _product_amentities.title }}</n-tag
                      >
                      <atoms-text v-if="_item.amenities?.length > 5" caption
                        >and more...</atoms-text
                      >
                    </n-space>
                    <br />
                    <n-card>
                      <atoms-text span>{{
                        _item.description?.slice(0, 100) +
                        `${_item.description?.length > 100 ? "..." : ""}`
                      }}</atoms-text>
                    </n-card>
                    <br />
                    <div class="mt-auto">
                      <n-button @click.stop="$local.showBooking = _item" type="primary"
                        >Rent Now</n-button
                      >
                    </div>
                  </div>
                </section>
              </div>
              <n-button
                v-if="!Boolean($local.productData?.length >= $local.productRaw?.count)"
                ref="$refProductLoadBtn"
                :disabled="$local.productRaw?.pages < 1 || $local.moreLoading"
                @click="
                  () => {
                    if ($local.productRaw?.pages > 1) {
                      $onFetchProduct({ limit: $local.productData?.length + 5, noLoading: true });
                    }
                  }
                "
                >{{ $local.moreLoading ? "Loading..." : "Load More" }}</n-button
              >
            </div>
            <atoms-empty
              v-else
              class="bg-white dark:bg-black"
              image=""
              message="Rental are not available at the moment"
            />
          </section>
          <br />
          <br />
        </div>
      </section>
      <section>
        <atoms-heading h3 class="capitalize">Find rental</atoms-heading>
        <atoms-text
          >Vacations recommendation for hotels, places, ticket and others for your trip.</atoms-text
        >
        <br />

        <section class="grid grid-cols-1 md:grid-cols-2">
          <div class="col-span-1 md:h-[500px]">
            <n-scrollbar
              :style="{ 'max-height': $breakpoint.smAndDown ? '100%' : '500px' }"
              trigger="none"
            >
              <div class="md:mr-5">
                <section
                  v-if="!$local.clientsLoading && $local.clientData?.length > 0"
                  class="text-center"
                >
                  <div class="space-y-5 text-left">
                    <div
                      v-for="(_client, _iclient) in Array.from(
                        Array($local.clientData.length < 3 ? 3 : $local.clientData.length).keys()
                      )?.map((_item) => $local.clientData?.[_item] || _item)"
                      @click.stop="
                        () => {
                          if (_client?.clientLocation && !$breakpoint?.mdAndDown) {
                            $local.targetToFly = _client?.clientLocation;
                          } else if ($breakpoint?.mdAndDown) {
                            router.push({ path: '/rental/' + _client.id });
                          }
                        }
                      "
                    >
                      <!-- @click.stop="router.push({ path: '/hotel/' + _client.id })" -->
                      <n-skeleton v-if="!_client?.id" height="200px" />
                      <section
                        v-else
                        class="grid grid-cols-3 cursor-pointer bg-white dark:bg-black-pure rounded-md shadow-2xl hover:shadow-sm transition-all duration-300 ease-out overflow-hidden"
                      >
                        <atoms-image-native
                          :src="_client?.product?.pictures?.[0]?.picture || _client?.picture"
                          :height="!$breakpoint.smAndDown ? '100%' : '150px'"
                          class="col-span-full md:col-span-1 cursor-pointer relative top-0 overflow-y-hidden"
                          ><template #none
                            ><n-space
                              class="h-full bg-slate-100 dark:bg-black w-full"
                              justify="center"
                              align="center"
                            >
                              <atoms-icon
                                flat
                                size="25"
                                name="domain"
                                class="!text-primary" /></n-space
                          ></template>
                          <n-scrollbar
                            v-if="_client.product?.pictures?.length > 1"
                            x-scrollable
                            class=""
                          >
                            <div class="flex">
                              <atoms-image-native
                                v-for="(_roomPicture, _iroomPicture) in _client.product?.pictures"
                                :key="_iroomPicture"
                                :class="['!m-0 hover:shadow-md !cursor-pointer']"
                                :src="_roomPicture.picture"
                                width="150px"
                                height="75px"
                              />
                            </div>
                          </n-scrollbar>
                        </atoms-image-native>
                        <div class="col-span-full md:col-span-2 p-5">
                          <div class="">
                            <atoms-heading h6 class="capitalize">{{
                              _client.name?.toLowerCase()
                            }}</atoms-heading>
                            <div class="flex items-center flex-nowrap gap-2 mt-1">
                              <n-rate readonly :default-value="3" size="small" />
                              <atoms-text caption>(3/5)</atoms-text>
                            </div>
                            <br />
                            <n-card size="small">
                              <div v-if="_client.product?.id">
                                <atoms-text span class="capitalize"
                                  >Room
                                  {{
                                    _client.product.title?.toLowerCase()?.replaceAll("room", "")
                                  }}</atoms-text
                                >

                                <client-only>
                                  <div class="flex items-center gap-2">
                                    <n-tag size="tiny">Starts from</n-tag>
                                    <atoms-text caption strong
                                      >IDR {{ $addSeparator(_client.product?.price || 0) }}/{{
                                        _client.product?.units || "rent"
                                      }}</atoms-text
                                    >
                                  </div>
                                </client-only>
                                <n-space class="mt-1">
                                  <n-tag
                                    size="tiny"
                                    v-for="(_product_amentities, _ipa) in _client.product.amenities"
                                    :key="_ipa"
                                    ><atoms-text caption>{{
                                      _product_amentities.title
                                    }}</atoms-text></n-tag
                                  >
                                </n-space>
                              </div>
                              <atoms-text v-else caption>{{
                                _client?.description?.slice(0, 100) +
                                `${_client?.description?.length >= 100 ? "..." : ""}`
                              }}</atoms-text>
                            </n-card>
                          </div>
                          <br />
                          <n-button
                            size="small"
                            type="primary"
                            @click.stop="router.push({ path: '/rental/' + _client.id })"
                            >See more</n-button
                          >

                          <div class="flex justify-between"></div>
                        </div>
                      </section>
                    </div>
                  </div>
                </section>
                <section v-else class="flex flex-col gap-5 flex-wrap">
                  <n-skeleton height="300px" />
                  <n-skeleton height="300px" />
                  <n-skeleton height="300px" />
                </section>
              </div>
            </n-scrollbar>
          </div>
          <div v-if="!$breakpoint.mdAndDown" class="col-span-1">
            <!-- v-if="
                !$local.clientData?.find(
                  (_item) => _item?.clientLocation?.latitude && _item?.clientLocation?.longitude
                ) || $local.mapLoading" -->
            <n-skeleton v-if="$local.mapLoading" height="100%"></n-skeleton>
            <molecules-map-embed
              v-else
              class="bg-primary w-full h-[500px] !overflow-hidden rounded-md"
              :locations="
                $local.clientData
                  ?.map((_item) => ({
                    ...(_item?.clientLocation || {}),
                    name: _item?.name || 'rent',
                  }))
                  ?.filter((_item) => _item?.latitude && _item?.longitude)
                  ?.map((_item) => ({
                    ...(_item || {}),
                    popup: (_payload) =>
                      `<div><strong>${_payload?.name}</strong><br/><span>${
                        _payload?.display_name || _payload?.address
                      }</span></div>`,
                  }))
              "
              :flyTo="$local.targetToFly"
              :zoom="15"
              popup
              radius
            />
            <!-- <client-only v-if="!!$breakpoint">
              <client-only>
                <atoms-maps class="sticky top-0 h-full" />
              </client-only>
            </client-only> -->
          </div>
        </section>
      </section>
    </atoms-container>
  </div>
</template>
