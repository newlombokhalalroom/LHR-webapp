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
import moment from "moment";

const $productStore = useProductStore();
const $clientStore = useClientStore();
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const { $createError } = useCustomError();
const { $isClientSide, $addSeparator, $lazyFetchBasedOnViewport } = useNuxtApp();
const $refProductWrapper = ref(null);
const $refProductLoadBtn = ref(null);
const $breakpoint = useBreakpoint();
const route = useRoute();
const router = useRouter();
const $local = reactive({
  term: null,
  tripType: null, // open_trip or private_trip
  openFilter: false,
  mainLoading: false,
  mapLoading: false,

  clientsLoading: false,
  clientData: null,
  clientPage: 1,
  targetToFly: null,

  productLazyFetch: null,
  productMoreLoading: false,
  productLoading: true,
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
          where: String(
            "(types.title iLIKE '%travel%' OR types.title iLIKE '%tour%')" +
              String($local.term ? ` AND products.title iLIKE '%${$local.term}%'` : "") +
              String($local.tripType ? ` AND trip_details.trip_type iLIKE '%${$local.tripType}%'` : "")
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

    console.log($local.productData);
  }
};

onMounted(() => {
  $onFetchProduct();
});

const $meta = ref({
  href: `${route.fullPath}`,
  title: "Travel",
  description:
    "Explore Lombok & Indonesia places in halal way. Search such hotels, vehicles, attractions, foods & others to plan a trip",
});

definePageMeta({
  order: 3,
  label: "Tour Packages",
  title: "Tour Packages",
  navigator: ({ _user }) => {
    if (_user?.scope?.includes("admin")) return false;
    return true;
  },
  validation: ({ _user }) => {
    if (_user?.scope?.includes("admin")) return "/admin";
  },
});

useHead({
  title: $meta.value.title,
  meta: [
    {
      name: "description",
      content: $meta.value.description,
    },
    {
      rel: "canonical",
      href: $meta.value.href,
    },
    {
      rel: "amphtml",
      href: $meta.value.href,
    },
    // google
    {
      itemprop: "name",
      content: $meta.value.title,
    },
    {
      itemprop: "description",
      content: $meta.value.description,
    },
    {
      itemprop: "image",
      content: "image/here",
    },
    // twitter card
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    { name: "twitter:site", content: route.fullPath },
    {
      name: "twitter:title",
      content: $meta.value.title,
    },
    {
      name: "twitter:description",
      content: $meta.value.description,
    },
    {
      name: "twitter:image",
      content: "image/here",
    },
    {
      name: "twitter:image:alt",
      content: $meta.value.title,
    },
    {
      name: "twitter:url",
      content: $meta.value.href,
    },
    // Open Graph
    { property: "og:site_name", content: route.fullPath },
    { property: "og:type", content: "website" },
    {
      property: "og:title",
      content: $meta.value.title,
    },
    {
      property: "og:description",
      content: $meta.value.description,
    },
    {
      property: "og:image",
      content: "image/here",
    },
    {
      property: "og:url",
      content: $meta.value.href,
    },
    {
      property: "og:image:secure_url",
      content: "image/here",
    },
    {
      property: "og:image:alt",
      content: $meta.value.title,
    },
  ],
  link: [
    {
      rel: "canonical",
      href: $meta.value.href,
    },
    {
      rel: "amphtml",
      href: $meta.value.href,
    },
  ],
});
</script>
<template>
  <div>
    <atoms-container class="overflow-y-auto">
      <div id="quick" class="flex flex-col md:flex-row gap-2 sticky top-0">
        <!-- <n-button
          @click="$local.openFilter = true"
          id="status-room"
          class="md:w-auto md:grow-0"
          :disabled="$local.mainLoading"
        >
          Filter</n-button
        > -->
        <atoms-input
          id="search-room"
          :disabled="$local.mainLoading"
          class="w-full md:w-auto md:grow"
          placeholder="Search tour by name..."
          @keyup.enter="$onFetchProduct"
          v-model:value="$local.term"
          hide-detail
          clearable
        >
          <template #append>
            <div class="flex">
              <n-button
                type="primary"
                :round="false"
                class="!rounded-none"
                :disabled="$local.mainLoading"
                @click="
                  () => {
                    $onFetchProduct({ page: 1, limit: 5 });
                  }
                "
              >
                Search
              </n-button>

              <atoms-icon
                :disabled="$local.mainLoading"
                name="close"
                :circle="false"
                class="!rounded-l-none"
                @click="
                  () => {
                    $local.term = null;
                    $onFetchProduct({ page: 1, limit: 5 });
                  }
                "
              />
            </div>
          </template>
        </atoms-input>

        <!-- Filter for Trip Type -->
        <n-space class="ml-auto w-full md:w-auto">
          <n-button 
            :type="$local.tripType === null ? 'primary' : 'default'" 
            @click="() => { $local.tripType = null; $onFetchProduct({ page: 1, limit: 5 }); }">All</n-button>
          <n-button 
            :type="$local.tripType === 'Open trip' ? 'primary' : 'default'" 
            @click="() => { $local.tripType = 'Open trip'; $onFetchProduct({ page: 1, limit: 5 }); }">Open Trip</n-button>
          <n-button 
            :type="$local.tripType === 'Private trip' ? 'primary' : 'default'" 
            @click="() => { $local.tripType = 'Private trip'; $onFetchProduct({ page: 1, limit: 5 }); }">Private Trip</n-button>
        </n-space>
      </div>
      <br />

      <section ref="$refProductWrapper" class="">
        <div class="space-y-2">
          <section class="space-y-5">
            <n-skeleton v-if="$local.productLoading" height="100px" width="100%" :repeat="5" />
            <div v-else-if="$local.productData?.length >= 0" class="space-y-5">
              <div
                v-for="(_item, _iitem) in $local.productData"
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
                  <div
                    class="col-span-full md:col-span-4 p-5"
                    @click.stop="router.push({ path: '/tour/' + _item.id })"
                  >
                    <div class="grid md:grid-cols-2">
                      <div class="col-span-1 order-2 md:order-1 flex flex-col h-full">
                        <div>
                          <atoms-heading h4>
                            {{ _item.title }}
                            <span v-if="_item.trip_type?.toLowerCase() === 'open trip'" class="text-sm font-normal text-gray-500 ml-1">
                              <template v-if="_item.schedules?.length === 1">
                                ({{ moment(_item.schedules[0].departure_date).format('DD MMM YYYY') }} - {{ moment(_item.schedules[0].return_date).format('DD MMM YYYY') }})
                              </template>
                              <template v-else-if="_item.schedules?.length > 1">
                                (Multiple Dates Available)
                              </template>
                              <template v-else>
                                (No Schedule Added)
                              </template>
                            </span>
                          </atoms-heading>
                          <atoms-text caption :to="`/${_item.client?.title}/${_item.client?.id}`">{{
                            _item.client?.name
                          }}</atoms-text>
                        </div>
                      </div>
                      <div class="col-span-1 order-1 md:order-2 flex gap-2 md:flex-col items-end">
                        <atoms-text caption>Starts with,</atoms-text>
                        <div class="flex gap-2 items-center">
                          <n-tag v-if="_item.trip_type?.toLowerCase() === 'open trip'" size="small" type="success">
                            Open Trip
                          </n-tag>
                          <n-tag v-else-if="_item.trip_type?.toLowerCase() === 'private trip'" size="small" type="warning">
                            Private Trip
                          </n-tag>
                          <n-tag size="small">
                            <atoms-text caption
                              >IDR {{ $addSeparator(_item.price || 0) }}/{{
                                _item.units || "rent"
                              }}</atoms-text
                            >
                          </n-tag>
                        </div>
                      </div>
                    </div>
                    <br />
                    <div class="mt-auto">
                      <n-button type="primary">Know More</n-button>
                    </div>
                  </div>
                </section>
              </div>
              <!-- @click="$openLink('whatsapp://send?text=google.com')"
          data-action="share/whatsapp/share" -->
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
              message="Travel Tour are not available at the moment"
            />
          </section>
          <br />
          <br />
        </div>
      </section>
    </atoms-container>
  </div>
</template>
