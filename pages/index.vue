<script setup>
import {
  NCarousel,
  NScrollbar,
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
const { $useDbStorage } = useStorage();
const $categoriesType = useCookie("type-categories");
const { $api } = useApi();
const { $createError } = useError();
const { $isClientSide, $addSeparator, $lazyFetchBasedOnViewport } = useNuxtApp();
const $title = ref("Lombok Halal Room");
const $description = ref(
  "Lombok Halal Room stands as an exclusive travel application, uniquely tailored to cater to Muslim-friendly destinations exclusively within the captivating realm of Lombok. As a specialized platform, it seamlessly connects travelers with accommodations that meticulously align with Islamic principles."
);
const $image = ref(
  "https://firebasestorage.googleapis.com/v0/b/lombok-halal-room-sandbox.appspot.com/o/assets%2Fhero.png?alt=media&token=e9fda99f-ecd3-40df-9932-13595ae16742"
);
const $local = reactive({
  showBooking: null,
  currentBooking: null,
  destinationLoading: null,
  destinationData: null,
  destinationRaw: null,
  selectedDestinationCategory: null,

  hotelLoading: null,
  hotelData: null,
  hotelRaw: null,
});

// const $typeProduct = {
//   All: "1=1",
//   Hotel: "types.title = 'Hotel'",
//   Rental: "types.title = 'Car Rent'",
//   Travel: "types.title iLIKE '%travel%'",
// };

definePageMeta({
  order: 0,
  label: "Home",
  title: "Lombok Halal Room",
  navigator: ({ _user }) => {
    if (_user?.scope?.startsWith("admin") || _user?.scope?.startsWith("super")) return false;
    return true;
  },
  validation: ({ _user }) => {
    if (_user?.scope?.startsWith("admin") || _user?.scope?.startsWith("super"))
      return `/${_user?.scope || ""}`;
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

const $onFetchHotel = async (_payload) => {
  $local.hotelLoading = true;
  try {
    const _resp = await $productStore.get(null, {
      params: {
        filter: JSON.stringify({
          where:
            "types.title = 'hotel' and products.client_id = '7641af15-3940-447d-b2f9-d5c80988c00c'",
          order: "products._created_date ASC",
        }),
        limit: 5,
      },
    });
    $local.hotelData = _resp.result;
    $local.hotelRaw = _resp;
  } catch (error) {
    $local.hotelData = null;
    $local.hotelRaw = null;
    $createError(error);
  } finally {
    // console.log($local.hotelData);
    $local.hotelLoading = false;
  }
};

const $onFetchDestination = async (_payload) => {
  $local.destinationLoading = true;
  try {
    const _resp = await $api.get("/destinations", {
      params: {
        ...(_payload || {}),
      },
    });
    $local.destinationData = _resp.result;
    $local.destinationRaw = _resp;
  } catch (error) {
    $local.destinationData = null;
    $local.destinationRaw = null;
    $createError(error);
  } finally {
    $local.destinationLoading = false;
  }
};

watch(
  () => $local.selectedDestinationCategory,
  () => {
    if ($local.selectedDestinationCategory) {
      $onFetchDestination({
        category: $local.selectedDestinationCategory,
      });
    }
  }
);

onMounted(async () => {
  $onFetchHotel();
  $local.currentBooking = await $useDbStorage("booking");
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
    <atoms-container>
      <!-- cover -->
      <section>
        <div class="grid md:grid-cols-4 grid-rows-4 gap-5 !text-white">
          <section
            @click.stop="navigateTo({ path: '/destination' })"
            class="relative top-0 left-0 col-span-2 row-span-4 overflow-hidden transition-transform duration-300 ease-out rounded-md cursor-pointer hover:scale-105 hover:z-10"
          >
            <atoms-image
              alt="image cover of destination"
              src="https://firebasestorage.googleapis.com/v0/b/lombok-halal-room-sandbox.appspot.com/o/assets%2Fdestination.jpeg?alt=media&token=3cfcca84-ac98-473a-bd6f-4af487ac65ac"
              class="w-full h-full"
            />
            <div
              class="absolute top-0 left-0 flex w-full h-full from-black bg-gradient-to-t to-transparent"
            >
              <div class="p-5 mt-auto space-y-2">
                <atoms-heading>Destination</atoms-heading>
                <atoms-text>📌 Located at Sade Village, Pujut District, Central Lombok </atoms-text>
              </div>
            </div>
          </section>
          <section
            @click.stop="navigateTo({ path: '/travel' })"
            class="col-span-2 row-span-2 relative top-0 left-0 rounded-md overflow-hidden !h-[300px] hover:scale-105 hover:z-10 transition-transform duration-300 ease-out cursor-pointer"
          >
            <atoms-image
              alt="image cover of halal travel"
              src="https://firebasestorage.googleapis.com/v0/b/lombok-halal-room-sandbox.appspot.com/o/assets%2Fmosque.jpeg?alt=media&token=b693e2c6-ddd0-441c-b01d-98f0770ccd21"
              class="w-full h-full"
            />
            <div
              class="absolute top-0 left-0 flex w-full h-full from-black bg-gradient-to-t to-transparent"
            >
              <div class="p-5 mt-auto space-y-2">
                <atoms-heading h3>Halal Travel</atoms-heading>
                <atoms-text>Islamic Center Mosque, Mataram</atoms-text>
              </div>
            </div>
          </section>
          <section
            @click.stop="navigateTo({ path: '/hotel' })"
            class="col-span-1 row-span-2 relative top-0 left-0 rounded-md overflow-hidden h-[300px] hover:scale-105 hover:z-10 transition-transform duration-300 ease-out cursor-pointer"
          >
            <atoms-image
              alt="image cover of hotel"
              src="https://firebasestorage.googleapis.com/v0/b/lombok-halal-room-sandbox.appspot.com/o/assets%2Fhotel.jpeg?alt=media&token=f556a8f7-1cd8-4278-a164-0326fb42d878"
              class="w-full h-full"
            />
            <div
              class="absolute top-0 left-0 flex w-full h-full from-black bg-gradient-to-t to-transparent"
            >
              <div class="p-5 mt-auto space-y-2">
                <atoms-heading h3>Hotel</atoms-heading>
              </div>
            </div>
          </section>
          <section
            @click.stop="navigateTo({ path: '/rental' })"
            class="col-span-1 row-span-2 relative top-0 left-0 rounded-md overflow-hidden h-[300px] hover:scale-105 hover:z-10 transition-transform duration-300 ease-out cursor-pointer"
          >
            <atoms-image
              alt="image cover of rental"
              src="https://firebasestorage.googleapis.com/v0/b/lombok-halal-room-sandbox.appspot.com/o/assets%2Frental.jpeg?alt=media&token=e71288df-6d53-4048-a572-4466a7de6d4d"
              class="w-full h-full"
            />
            <div
              class="absolute top-0 left-0 flex w-full h-full from-black bg-gradient-to-t to-transparent"
            >
              <div class="p-5 mt-auto space-y-2">
                <atoms-heading h3>Rental</atoms-heading>
              </div>
            </div>
          </section>
        </div>
      </section>

      <!-- booking/banner -->
      <br />
      <section>
        <n-card
          v-if="!$local.currentBooking || $local.currentBooking?.length <= 0"
          class="p-5 overflow-hidden transition-all duration-300 ease-out bg-white rounded-md cursor-pointer dark:bg-black bg-gradient"
          content-style="padding: 0 !important"
        >
          <div class="flex flex-col items-center justify-between gap-5 md:flex-row">
            <div class="w-full">
              <atoms-text strong>Make an unforgettable vacation with us</atoms-text>
              <atoms-text caption
                >Seamlessly connect with a single platform tailored for your dream vacation.</atoms-text
              >
            </div>
            <n-button
              type="primary"
              class="w-full md:w-auto"
              @click.stop="navigateTo({ path: '/authentication' })"
              >Join Now</n-button
            >
          </div>
        </n-card>
        <div v-else>
          <div class="flex items-center gap-2">
            <atoms-icon name="heart" class="!text-inherit"></atoms-icon>
            <div>
              <atoms-heading h5>Your current wishlist</atoms-heading>
            </div>
          </div>
          <br />
          <n-scrollbar x-scrollable>
            <div
              class="flex gap-2 p-2 overflow-x-auto rounded-md flex-nowrap bg-white-smoke dark:bg-black"
            >
              <div
                v-for="(_item, _iitem) in $local.currentBooking?.flatMap(
                  (_item) => _item?.orderItems
                )"
                :key="_iitem"
                class="shadow-xl hover:shadow-sm rounded-md overflow-hidden cursor-pointer transition-all duration-300 ease-out bg-white dark:bg-black-pure w-[350px] h-[125px]"
              >
                <section class="grid h-full grid-cols-6 gap-2">
                  <div class="flex col-span-2 overflow-hidden">
                    <atoms-image
                      :src="_item?.pictures?.[0]?.picture || _item.client?.picture"
                      class="w-full h-full"
                      ><template #none
                        ><n-space
                          class="w-full h-full bg-white-smoke dark:bg-black-pure"
                          justify="center"
                          align="center"
                        >
                          <atoms-icon
                            flat
                            size="25"
                            name="domain"
                            class="!text-primary" /></n-space></template
                    ></atoms-image>
                  </div>
                  <div
                    class="col-span-4 p-2"
                    @click.stop="navigateTo({ path: `/booking#${_item?.client?.id}` })"
                  >
                    <atoms-text strong>{{ _item?.title }}</atoms-text>
                    <atoms-text caption class="capitalize"
                      >{{ _item?.client?.name }} Booking</atoms-text
                    >
                    <div class="flex items-center gap-2">
                      <atoms-text caption>Total : </atoms-text>
                      <n-tag type="primary" size="tiny" class="mt-1"
                        ><atoms-text caption>
                          IDR
                          {{ $addSeparator(_item?.price * _item?.amount) || 0 }}</atoms-text
                        ></n-tag
                      >
                    </div>
                    <div class="mt-3">
                      <n-button size="tiny" type="primary">Continue Process</n-button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </n-scrollbar>
        </div>
      </section>
      <br />

      <!-- destination -->
      <section>
        <section class="flex flex-wrap items-center justify-between gap-5">
          <div class="flex items-center gap-2">
            <atoms-icon name="map" class="!text-inherit"></atoms-icon>
            <div>
              <atoms-heading h5>Destination</atoms-heading>
            </div>
          </div>
          <div
            v-if="$categoriesType?.length > 0"
            @vue:mounted="
              () => {
                $local.selectedDestinationCategory = $categoriesType?.[0];
              }
            "
          >
            <n-button-group>
              <n-button
                v-for="(_item, _index) in $categoriesType?.slice(0, 3)"
                :key="_index"
                :type="$local.selectedDestinationCategory == _item ? 'primary' : 'tertiary'"
                @click="$local.selectedDestinationCategory = _item"
                >{{ _item }}</n-button
              >
            </n-button-group>
          </div>
        </section>
        <br />
        <div class="space-y-2">
          <section class="space-y-5">
            <n-skeleton v-if="$local.destinationLoading" height="100px" width="100%" :repeat="5" />
            <div v-else-if="$local.destinationData?.length >= 0" class="space-y-5">
              <div
                v-for="(_item, _iitem) in $local.destinationData?.slice(0, 5)"
                :key="_iitem"
                class="overflow-hidden transition-all duration-300 ease-out bg-white rounded-md shadow-xl cursor-pointer hover:shadow-sm dark:bg-black"
              >
                <section class="grid grid-cols-5">
                  <div class="flex overflow-hidden col-span-full md:col-span-1">
                    <atoms-image
                      :src="_item.pictures?.[0]?.picture || _item.picture"
                      class="w-full h-[250px]"
                      ><template #none
                        ><n-space
                          class="w-full h-full bg-white-smoke dark:bg-black-pure"
                          justify="center"
                          align="center"
                        >
                          <atoms-icon
                            flat
                            size="25"
                            name="domain"
                            class="!text-primary" /></n-space></template
                    ></atoms-image>
                  </div>
                  <div
                    class="p-5 col-span-full md:col-span-4"
                    @click.stop="router.push({ path: '/destination/' + _item.id })"
                  >
                    <div>
                      <atoms-heading h4>{{ _item.title }}</atoms-heading>
                      <atoms-text caption>{{ _item.category }}</atoms-text>
                    </div>
                    <br />
                    <n-card>
                      <atoms-text
                        span
                        v-html="
                          _item.description?.slice(0, 100) +
                          `${_item.description?.length > 100 ? '...' : ''}`
                        "
                      />
                    </n-card>
                    <br />
                    <div class="mt-auto">
                      <n-button type="primary">Read More</n-button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
            <atoms-empty
              v-else
              class="bg-white dark:bg-black"
              image=""
              message="Destination are not available at the moment"
            />
          </section>
        </div>
        <br />
        <n-button @click="navigateTo({ path: '/destination' })">See more</n-button>
      </section>
      <br />

      <!-- hotel -->
      <section>
        <section class="flex flex-wrap items-center justify-between gap-5">
          <div class="flex items-center gap-2">
            <div>
              <atoms-heading h5>Best places to stay</atoms-heading>
              <atoms-text>We've got many kind of villas and hotels just for you to stay</atoms-text>
            </div>
          </div>
        </section>
        <br />
        <div class="space-y-2">
          <section class="space-y-5">
            <n-skeleton v-if="$local.hotelLoading" height="100px" width="100%" :repeat="5" />
            <div v-else-if="$local.hotelData?.length >= 0" class="space-y-5">
              <div
                v-for="(_item, _iitem) in $local.hotelData"
                :key="_iitem"
                class="shadow-xl hover:shadow-sm rounded-md overflow-hidden !cursor-pointer transition-all duration-300 ease-out bg-white dark:bg-black"
                @click.stop="navigateTo({ path: '/hotel/room/' + _item?.id })"
              >
                <section class="grid grid-cols-5">
                  <div class="flex h-full overflow-hidden col-span-full md:col-span-1">
                    <atoms-image
                      :src="_item.pictures?.[0]?.picture || _item.picture"
                      class="w-full h-[300px]"
                      ><template #none
                        ><n-space
                          class="w-full h-full bg-white-smoke dark:bg-black-pure"
                          justify="center"
                          align="center"
                        >
                          <atoms-icon
                            flat
                            size="25"
                            name="domain"
                            class="!text-primary" /></n-space></template
                    ></atoms-image>
                  </div>

                  <div class="p-5 col-span-full md:col-span-4">
                    <div class="grid h-full gap-5 md:grid-cols-2">
                      <div class="flex flex-col order-2 h-full col-span-1 md:order-1">
                        <div>
                          <atoms-heading h4>{{ _item.title }}</atoms-heading>
                          <atoms-text caption :to="`/${_item.client?.title}/${_item.client?.id}`">{{
                            _item.client?.name
                          }}</atoms-text>
                        </div>
                        <n-space class="mt-2">
                          <n-tag
                            size="small"
                            v-for="(_product_amentities, _ipa) in _item.amenities?.length > 10
                              ? [
                                  ...(_item.amenities?.filter(
                                    (_item) => _item.category == 'halal'
                                  ) || []),
                                  ...(_item.amenities?.filter(
                                    (_item) => _item.category != 'halal'
                                  ) || []),
                                ]?.slice(0, 10)
                              : _item.amenities?.slice(0, 10)"
                            :key="_ipa"
                            :type="_product_amentities.category == 'halal' ? 'primary' : 'default'"
                          >
                            <template v-if="_product_amentities.category == 'halal'" #icon
                              ><atoms-icon
                                name="star-crescent"
                                flat
                                class="text-primary"
                              ></atoms-icon
                            ></template>
                            {{ _product_amentities.title }}</n-tag
                          >
                          <atoms-text v-if="_item.amenities?.length > 5" caption
                            >and more...</atoms-text
                          >
                        </n-space>
                        <br />
                        <atoms-text
                          span
                          v-html="_item.description?.slice(0, 100) || ''"
                        ></atoms-text>
                        <br />
                        <div class="mt-auto">
                          <n-button type="primary">Check Detail</n-button>
                        </div>
                      </div>
                      <div class="flex items-end order-1 col-span-1 gap-2 md:order-2 md:flex-col">
                        <atoms-text class="!text-primary">Starts with,</atoms-text>
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
                </section>
              </div>
            </div>
            <atoms-empty
              v-else
              class="bg-white dark:bg-black"
              image=""
              message="Places are not available at the moment"
            />
          </section>
        </div>
        <br />
        <n-button @click="navigateTo({ path: '/hotel' })">See more</n-button>
      </section>
      <br />

      <!-- other -->
      <section class="p-5 border-2 border-opacity-50 border-dashed rounded-md border-primary">
        <n-card
          class="p-5 overflow-hidden bg-white rounded-md dark:bg-black bg-gradient"
          content-style="padding: 0 !important"
        >
          <div class="flex flex-col items-center justify-around gap-5 md:flex-row">
            <div class="order-1 md:order-none">
              <atoms-heading h5>What else do we provide?</atoms-heading>
              <atoms-text
                >We always trying to make our customer happy by providing help for planning their
                trip, even in halal way</atoms-text
              >
              <br />
              <div class="space-y-2 md:space-x-2">
                <n-button type="primary" class="w-full md:w-auto">Go rent</n-button>
                <n-button
                  type="warning"
                  @click="router.push({ path: '/authentication/signup-client' })"
                  :class="[($breakpoint.mdAndDown && 'fullWidth') || '', '!text-black']"
                  >Be our partner</n-button
                >
              </div>
            </div>
            <atoms-image
              src="https://firebasestorage.googleapis.com/v0/b/lombok-halal-room-sandbox.appspot.com/o/assets%2Fhero.png?alt=media&token=e9fda99f-ecd3-40df-9932-13595ae16742"
              class="h-[250px]"
            />
          </div>
        </n-card>
        <br />
        <div class="grid gap-5 md:grid-cols-2">
          <n-card
            class="p-5 overflow-hidden transition-all duration-300 ease-out bg-white rounded-md cursor-pointer dark:bg-black"
            content-style="padding: 0 !important"
          >
            <div class="flex flex-col items-center justify-between gap-5 md:flex-row">
              <div class="w-full">
                <atoms-text strong>Explore your destination by self</atoms-text>
                <atoms-text caption
                  >Get your flexibility to get into places by transportation provided by our
                  stackholder</atoms-text
                >
              </div>
              <n-button type="primary" class="w-full md:w-auto">Go rent</n-button>
            </div>
          </n-card>
          <n-card
            class="p-5 overflow-hidden transition-all duration-300 ease-out bg-white rounded-md cursor-pointer dark:bg-black"
            content-style="padding: 0 !important"
          >
            <div class="flex flex-col items-center justify-between gap-5 md:flex-row">
              <div class="w-full">
                <atoms-text strong>More into Halal Vacation </atoms-text>
                <atoms-text caption
                  >Most popular choices for travellers from Lombok based on Halal index</atoms-text
                >
              </div>
              <n-button type="primary" class="w-full md:w-auto">Go travel</n-button>
            </div>
          </n-card>
        </div>
      </section>
      <br />

      <!-- Kerja sama pembuatan LombokHalalRoom -->
      <section class="text-center">
        <br />
        <br />
        <atoms-text strong>We've been trusted by top companies based on Lombok</atoms-text>
        <br />
        <br />
        <div class="grid grid-cols-2 gap-5 md:grid-cols-4">
          <div class="flex items-center col-span-1 mb-4 md:mb-0 justify-evenly">
            <img src="/media/unram.png" alt="Gambar 1" class="w-[25%] rounded-md" />
          </div>
          <div class="flex items-center justify-center col-span-1 mb-4 md:mb-0">
            <img src="/media/kedaireka.svg" alt="Gambar 2" class="w-[25%] rounded-md" />
          </div>
          <div class="flex items-center justify-center col-span-1 mb-4 md:mb-0">
            <img src="/media/grandmadani.png" alt="Gambar 3" class="w-[25%] h-full rounded-full" />
          </div>
          <div class="flex items-center justify-center col-span-1 mb-4 md:mb-0">
            <img src="/media/kampusmerdeka.png" alt="Gambar 4" class="w-[25%] rounded-md" />
          </div>
        </div>
        <br />
        <br />
      </section>

      <br />
    </atoms-container>
  </div>
</template>
