<script setup>
import {
  NButton,
  NCarousel,
  NSpace,
  NScrollbar,
  NCarouselItem,
  NPagination,
  NSkeleton,
  NRate,
  NTag,
  NCard,
  NDivider,
} from "naive-ui";
import { ref, onMounted, reactive } from "vue"; // ⬅️ reactive ditambahkan
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
const {
  $isClientSide,
  $addSeparator,
  $lazyFetchBasedOnViewport,
  $getGeolocation, // ⬅️ ambil helper geolokasi
} = useNuxtApp();

const $refProductWrapper = ref(null);
const $refProductLoadBtn = ref(null);
const $breakpoint = useBreakpoint();
const route = useRoute();
const router = useRouter();

/* -------------------- STATE -------------------- */
const $local = reactive({
  clientsLoading: false,
  mapLoading: false,
  showBooking: false,

  term: "",
  hotelPage: 1,
  targetToFly: null,

  productLazyFetch: null,
  productMoreLoading: false,
  productLoading: false,
  productRaw: { pages: 1, count: 0 },
  productData: [],

  clientDataPersist: [],
  clientData: [],
  clientRaw: { pages: 1, count: 0 },
  clientPage: 1,
});

/* ---------------- PARSER HELPERS ---------------- */
const parseProductsPayload = (res) => {
  const rows = Array.isArray(res?.result?.products)
    ? res.result.products
    : Array.isArray(res?.data?.products)
    ? res.data.products
    : Array.isArray(res?.result)
    ? res.result
    : Array.isArray(res)
    ? res
    : [];
  const pages = res?.result?.pages ?? res?.pages ?? 1;
  const count = res?.result?.count ?? res?.count ?? rows.length;
  return { rows, pages, count };
};

const parseClientsPayload = (res) => {
  const rows = Array.isArray(res?.result?.clients)
    ? res.result.clients
    : Array.isArray(res?.data?.clients)
    ? res.data.clients
    : Array.isArray(res?.result)
    ? res.result
    : Array.isArray(res)
    ? res
    : [];
  const pages = res?.result?.pages ?? res?.pages ?? 1;
  const count = res?.result?.count ?? res?.count ?? rows.length;
  return { rows, pages, count };
};

/* ---------------- FETCH PRODUCTS ---------------- */
const $onFetchProduct = async (_payload = {}) => {
  $local.productMoreLoading = true;
  if (!_payload?.noLoading) $local.productLoading = true;
  try {
    const res = await $productStore.get(null, {
      params: {
        filter: JSON.stringify({
          where:
            `LOWER(types.title) = 'hotel'` +
            " AND " +
            ($local.term
              ? `LOWER(products.title) LIKE '%${String($local.term).toLowerCase()}%'`
              : "1=1"),
          order: "products._updated_date DESC",
        }),
        page: _payload?.page || 1,
        limit: _payload?.limit || 5,
      },
    });

    const { rows, pages, count } = parseProductsPayload(res);
    $local.productData = rows;
    $local.productRaw = { pages, count };

    // auto-lazy load bila data < total
    if (Array.isArray($local.productData) && $local.productData.length < count) {
      $lazyFetchBasedOnViewport(
        $onFetchProduct({ limit: $local.productData.length + 5, noLoading: true }),
        $refProductLoadBtn
      );
    }
  } catch (error) {
    $local.productData = [];
    $local.productRaw = { pages: 1, count: 0 };
    $createError(error);
  } finally {
    $local.productMoreLoading = false;
    $local.productLoading = false;
  }
};

/* ----------------- FETCH CLIENTS ---------------- */
const $onFetchClients = async (_payload = {}) => {
  $local.mapLoading = true;
  $local.clientsLoading = true;
  try {
    $local.clientPage = _payload.page || 1;
    const _limit = _payload.limit || 5;

    const res = await $clientStore.get(null, {
      params: {
        filter: JSON.stringify({
          where: "LOWER(types.title) = 'hotel'", // ⬅️ aman terhadap kapitalisasi
          order: "clients._updated_date DESC",
        }),
        page: $local.clientPage,
        limit: _limit,
      },
    });

    const { rows, pages, count } = parseClientsPayload(res);
    $local.clientData = rows;
    $local.clientRaw = { pages, count };

    // Fallback: jika sama sekali tidak ada koordinat, isi satu titik default + reverse geocode
    const hasAnyCoords = $local.clientData.some(
      (it) => it?.clientLocation?.latitude && it?.clientLocation?.longitude
    );

    if ($local.clientData.length > 0 && !hasAnyCoords) {
      const latitude = -8.5869286;
      const longitude = 116.0910654;
      const geo = (await $getGeolocation?.(latitude, longitude)) || {};
      $local.clientData = $local.clientData.map((r, idx) =>
        idx === 0 ? { ...r, clientLocation: { latitude, longitude, ...geo } } : r
      );
    }

    // Persist untuk peta: gabungkan unik by id
    const existing = new Set(($local.clientDataPersist || []).map((i) => i?.id));
    const toAppend = $local.clientData.filter((i) => !existing.has(i?.id));
    $local.clientDataPersist = [...($local.clientDataPersist || []), ...toAppend];
  } catch (error) {
    $local.clientRaw = { pages: 1, count: 0 };
    $local.clientData = [];
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
});

/* ----------------------- SEO -------------------- */
const $meta = ref({
  href: `${route.fullPath}`,
  title: "Hotel",
  description:
    "Explore Lombok & Indonesia places in halal way. Search such hotels, vehicles, attractions, foods & others to plan a trip",
});

const $title = ref("Hotel");
const $description = ref(
  "Explore Lombok & Indonesia places in halal way. Search such hotels, vehicles, attractions, foods & others to plan a trip"
);
const $image = ref("https://www.lombokhalalroom.com/favicon.ico");

definePageMeta({
  order: 1,
  label: "Hotel",
  title: "Hotel List",
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
      :content="{ title: `Booking ${$local.showBooking?.title || ''}` }"
      @closed="$local.showBooking = null"
    >
      <molecules-booking :target="$local.showBooking" />
    </molecules-drawer>

    <!-- Hero -->
    <section>
      <div class="bg-primary">
        <atoms-container>
          <br /><br />
          <section>
            <atoms-heading h2>Find place for you to stay relax</atoms-heading>
            <atoms-text>Search prices on hotels, villas and more...</atoms-text>
          </section>
        </atoms-container>
      </div>
      <div class="relative w-full overflow-hidden">
        <section class="grid h-full grid-rows-2">
          <div class="min-h-[50px] bg-primary"></div>
          <div class="bg-transparent"></div>
        </section>
      </div>
    </section>

    <atoms-container>
      <!-- Product section -->
      <section ref="$refProductWrapper">
        <div class="space-y-1">
          <section class="space-y-5">
            <n-skeleton v-if="$local.productLoading" height="100px" width="100%" :repeat="5" />
            <div v-else-if="Array.isArray($local.productData)" class="space-y-5">
              <div
                v-for="(_item, _iitem) in $local.productData"
                :key="_item?.id || _iitem"
                class="overflow-hidden transition-all duration-300 ease-out bg-white rounded-md shadow-xl cursor-pointer hover:shadow-sm dark:bg-black"
              >
                <section class="grid grid-cols-5">
                  <atoms-image-native
                    :src="_item.pictures?.[0]?.picture"
                    class="col-span-full md:col-span-1 min-h-[200px]"
                  >
                    <template #none>
                      <n-space
                        class="w-full h-full bg-white-smoke dark:bg-black-pure"
                        justify="center"
                        align="center"
                      >
                        <atoms-icon flat size="25" name="domain" class="!text-primary" />
                      </n-space>
                    </template>
                  </atoms-image-native>

                  <div
                    class="p-5 col-span-full md:col-span-4"
                    @click.stop="navigateTo({ path: '/hotel/room/' + _item?.id })"
                  >
                    <div class="grid md:grid-cols-2">
                      <div class="flex flex-col order-2 h-full col-span-1 md:order-1">
                        <div>
                          <atoms-heading h4>{{ _item.title }}</atoms-heading>
                          <atoms-text caption :to="`/${_item.client?.title}/${_item.client?.id}`">
                            {{ _item.client?.name }}
                          </atoms-text>
                        </div>
                      </div>
                      <div class="flex items-end order-1 col-span-1 gap-2 md:order-2 md:flex-col">
                        <atoms-text caption>Starts with,</atoms-text>
                        <n-tag size="small">
                          <atoms-text caption>
                            IDR {{ $addSeparator(_item.price || 0) }}/{{ _item.units || "rent" }}
                          </atoms-text>
                        </n-tag>
                      </div>
                    </div>

                    <br />
                    <n-space>
                      <n-tag size="small" type="primary" class="capitalize">
                        {{ _item.client?.title || "-" }}
                      </n-tag>
                      <n-tag
                        v-for="(_amen, _ipa) in _item.amenities?.slice(0, 5)"
                        :key="_ipa"
                        size="small"
                        class="capitalize"
                      >
                        {{ _amen.title }}
                      </n-tag>
                      <atoms-text v-if="_item.amenities?.length > 5" caption
                        >and more...</atoms-text
                      >
                    </n-space>

                    <br />
                    <n-card>
                      <atoms-text span>
                        {{
                          (_item.description || "").slice(0, 100) +
                          `${(_item.description || "").length > 100 ? "..." : ""}`
                        }}
                      </atoms-text>
                    </n-card>

                    <br />
                    <div class="mt-auto">
                      <n-button type="primary">Detail</n-button>
                    </div>
                  </div>
                </section>
              </div>

              <n-button
                v-if="$local.productData.length < ($local.productRaw?.count || 0)"
                ref="$refProductLoadBtn"
                :disabled="$local.productRaw?.pages < 2 || $local.productMoreLoading"
                @click="
                  () => {
                    if ($local.productData.length < ($local.productRaw?.count || 0)) {
                      $onFetchProduct({ limit: $local.productData.length + 5, noLoading: true });
                    }
                  }
                "
              >
                {{ $local.productMoreLoading ? "Loading..." : "Load More" }}
              </n-button>
            </div>

            <atoms-empty
              v-else
              class="bg-white dark:bg-black"
              image=""
              message="Rooms are not available at the moment"
            />
          </section>

          <br /><br />
        </div>
      </section>

      <!-- hotel by client -->
      <section>
        <atoms-heading h3 class="capitalize">Find best place to stay overnight</atoms-heading>
        <atoms-text>
          Vacations recommendation for hotels, places, ticket and others for your trip.
        </atoms-text>
        <br />

        <div>
          <section class="grid grid-cols-1 md:grid-cols-2">
            <div class="col-span-1 md:h-[500px] bg-white-smoke dark:bg-black p-2 rounded-l-md">
              <n-scrollbar
                :style="{ 'max-height': $breakpoint.smAndDown ? '100%' : '500px' }"
                trigger="none"
              >
                <div class="md:mr-5">
                  <section
                    v-if="!$local.clientsLoading && ($local.clientData?.length || 0) > 0"
                    class="text-center"
                  >
                    <div class="space-y-5 text-left">
                      <div
                        v-for="(_client, _iclient) in $local.clientData"
                        :key="_client?.id || _iclient"
                        class="overflow-hidden transition-all duration-300 ease-out bg-white rounded-md shadow-md cursor-pointer dark:bg-black-pure hover:shadow-sm"
                        @click.stop="
                          () => {
                            if (_client?.clientLocation && !$breakpoint?.mdAndDown) {
                              $local.targetToFly = _client?.clientLocation;
                            } else if ($breakpoint?.mdAndDown) {
                              router.push({ path: '/hotel/' + _client.id });
                            }
                          }
                        "
                      >
                        <section class="grid grid-cols-3 overflow-hidden">
                          <atoms-image-native
                            :src="_client?.product?.pictures?.[0]?.picture || _client?.picture"
                            :height="!$breakpoint.smAndDown ? '100%' : '150px'"
                            class="relative top-0 overflow-y-hidden cursor-pointer col-span-full md:col-span-1"
                          >
                            <template #none>
                              <n-space
                                class="w-full h-full bg-slate-100 dark:bg-black"
                                justify="center"
                                align="center"
                              >
                                <atoms-icon flat size="25" name="domain" class="!text-primary" />
                              </n-space>
                            </template>

                            <n-scrollbar v-if="_client.product?.pictures?.length > 1" x-scrollable>
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

                          <div class="p-5 col-span-full md:col-span-2">
                            <div>
                              <atoms-heading h6 class="capitalize">
                                {{ (_client.name || "").toLowerCase() }}
                              </atoms-heading>
                              <div class="flex items-center gap-2 mt-1 flex-nowrap">
                                <n-rate readonly :default-value="5" size="small" />
                                <atoms-text caption>(5/5)</atoms-text>
                              </div>
                              <br />
                              <n-card size="small">
                                <div v-if="_client.product?.id">
                                  <atoms-text span class="capitalize">
                                    Room
                                    {{
                                      (_client.product.title || "")
                                        .toLowerCase()
                                        .replaceAll("room", "")
                                    }}
                                  </atoms-text>

                                  <client-only>
                                    <div class="flex items-center gap-2">
                                      <n-tag size="tiny">Starts from</n-tag>
                                      <atoms-text caption strong>
                                        IDR {{ $addSeparator(_client.product?.price || 0) }}/{{
                                          _client.product?.units || "rent"
                                        }}
                                      </atoms-text>
                                    </div>
                                  </client-only>

                                  <n-space class="mt-1">
                                    <n-tag
                                      v-for="(_amen, _ipa) in _client.product?.amenities || []"
                                      :key="_ipa"
                                      size="tiny"
                                    >
                                      <atoms-text caption>{{ _amen.title }}</atoms-text>
                                    </n-tag>
                                  </n-space>
                                </div>
                                <atoms-text v-else caption>
                                  {{
                                    (_client?.description || "").slice(0, 100) +
                                    `${(_client?.description || "").length >= 100 ? "..." : ""}`
                                  }}
                                </atoms-text>
                              </n-card>
                            </div>

                            <br />
                            <n-button
                              size="small"
                              type="primary"
                              @click.stop="router.push({ path: '/hotel/' + _client.id })"
                            >
                              See more
                            </n-button>
                          </div>
                        </section>
                      </div>
                    </div>
                  </section>

                  <section v-else class="flex flex-col flex-wrap gap-5">
                    <n-skeleton height="300px" />
                    <n-skeleton height="300px" />
                    <n-skeleton height="300px" />
                  </section>
                </div>
              </n-scrollbar>
            </div>

            <div
              v-if="!$breakpoint.mdAndDown"
              class="col-span-1 p-2 bg-white-smoke dark:bg-black rounded-r-md"
            >
              <n-skeleton v-if="$local.mapLoading" height="100%"></n-skeleton>
              <molecules-map-embed
                v-else
                class="bg-primary !z-0 w-full h-[500px] !overflow-hidden rounded-md"
                :locations="
                  $local.clientDataPersist
                    ?.map((_item) => ({
                      ...(_item?.clientLocation || {}),
                      name: _item?.name || 'rent',
                    }))
                    ?.filter((_item) => _item?.latitude && _item?.longitude)
                    ?.map((_item) => ({
                      ...(_item || {}),
                      popup: (_payload) =>
                        `<div><strong>${_payload?.name}</strong><br/><span>${
                          _payload?.display_name || _payload?.address || ''
                        }</span></div>`,
                    }))
                "
                :flyTo="$local.targetToFly"
                :zoom="15"
                popup
                radius
              />
            </div>
          </section>
        </div>

        <br />
        <n-pagination
          class="flex flex-wrap gap-y-5"
          v-model:page="$local.clientPage"
          :page-count="$local.clientRaw?.pages || 1"
          @update:page="(_val) => $onFetchClients({ page: _val })"
        />
      </section>

      <br /><br />
    </atoms-container>
  </div>
</template>
