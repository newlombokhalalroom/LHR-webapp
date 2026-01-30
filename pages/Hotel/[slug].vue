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
const $filterArrByCustom = (payload, target, by = "category") =>
  payload?.filter((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

const $findArrByCustom = (payload, target, by = "title") =>
  payload?.find((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

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
  location: "Location",
  rooms: "Rooms",
  reviews: "Reviews",
};
const $local = reactive({
  mainLoading: false,
  moreLoading: false,
  tab: $tabs.overview,
  dataAmenities: null,
  dataPictures: null,
  dataRooms: null,
  rawRooms: null,
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

const $onFetchProduct = async (_payload) => {
  $local.mainLoading = true;
  try {
    const _resp = await $clientStore.get(`${$clientData.value?.result?.id}/products`, {
      params: {
        page: _payload?.page || 1,
        limit: _payload?.limit || 5,
      },
    });
    if (_resp?.status) {
      $local.dataRooms = _resp.result;
      $local.rawRooms = _resp;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

watch([() => $local.tab, () => $clientData.value?.result], async (_payload) => {
  // console.log($local.tab, $clientData.value?.result?.id);
  if ($local.tab === $tabs.rooms && $clientData.value?.result?.id) {
    await $onFetchProduct();
  }
  // else if ($local.tab === $tabs.overview && $clientData.value?.result?.id) {
  //   // await $onFetchAmenities();
  // }
});

watchEffect(() => {
  $refreshClient();
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
      ><Title>Hotel {{ $clientData?.result?.name || "" }}</Title></Head
    >
    <atoms-image-native
      v-if="$clientData?.result?.clientPictures?.[0]?.picture || $clientData?.result?.picture"
      :src="$clientData?.result?.clientPictures?.[0]?.picture || $clientData?.result?.picture"
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
      <section
        v-if="$clientData?.result?.clientPictures?.length > 1"
        class="grid grid-cols-2 w-full h-full"
      >
        <div></div>
        <div class="grid grid-cols-2 overflow-hidden">
          <atoms-image-native :src="$clientData?.result?.clientPictures?.[1]?.picture">
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
          <atoms-image-native :src="$clientData?.result?.clientPictures?.[2]?.picture">
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
          <atoms-image-native :src="$clientData?.result?.clientPictures?.[3]?.picture">
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
          <atoms-image-native :src="$clientData?.result?.clientPictures?.[4]?.picture">
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
    <div v-else class="h-[250px] bg-primary-darken relative top-0 left-0"></div>
    <atoms-container v-if="!$clientPending && $clientData?.result?.id">
      <n-button class="-translate-y-28" type="primary" @click="router.push({ path: '/hotel' })">
        Back
      </n-button>
      <n-card class="mx-auto -translate-y-24">
        <div v-if="!$clientData?.result?.id" class="space-y-2">
          <n-skeleton :repeat="2"></n-skeleton>
          <n-skeleton :repeat="2" width="50%"></n-skeleton>
        </div>
        <div v-else class="space-y-2 flex flex-wrap gap-5">
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
              <Title>Hotel {{ $clientData?.result?.name }}</Title>
            </Head>
            <atoms-heading class="capitalize">
              {{ $clientData?.result?.name }}
            </atoms-heading>

            <atoms-text class="mt-1"
              >Joined
              {{ moment($clientData?.result?._created_date).format("DD MMMM YYYY") }}</atoms-text
            >
            <br />
            <n-space>
              <!-- <n-tag size="small" type="primary"> Halal Certified </n-tag> -->
              <n-tag size="small"> Hotel </n-tag></n-space
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
              </div>
            </section>
          </n-card>
          <br />
          <n-card>
            <template #header>
              <atoms-text strong>Facilities</atoms-text>
            </template>
            <!-- <section
              v-if="$clientData?.result?.clientFacilities?.length > 0"
              class="grid md:grid-cols-3 gap-2"
            >
              <div
                v-for="(_fasility, _ifasility) in $clientData?.result?.clientFacilities || []"
                :key="_ifasility"
              >
                <atoms-text span strong class="!text-primary capitalize">{{
                  _fasility.category
                }}</atoms-text>
                <atoms-text>{{ _fasility.title }}</atoms-text>
              </div>
            </section> -->
            <div v-if="$clientData?.result?.clientFacilities?.length > 0">
              <n-tabs type="line" animated>
                <n-tab-pane name="0" tab="Halal">
                  <section
                    v-if="
                      $filterArrByCustom($clientData?.result?.clientFacilities, 'halal')?.length > 0
                    "
                    class="grid md:grid-cols-3 gap-2"
                  >
                    <div
                      v-for="(_amenity, i_amenity) in $filterArrByCustom(
                        $clientData?.result?.clientFacilities,
                        'halal'
                      ) || []"
                      :key="i_amenity"
                    >
                      <atoms-text caption strong class="!text-primary capitalize">{{
                        _amenity.category
                      }}</atoms-text>
                      <atoms-text>{{ _amenity.title }}</atoms-text>
                    </div>
                  </section>
                  <atoms-empty v-else image="" height="100" message=" " class="mt-2">
                    <atoms-text caption>No Halal amenities</atoms-text></atoms-empty
                  >
                </n-tab-pane>
                <n-tab-pane name="1" tab="Regular">
                  <section
                    v-if="
                      $filterArrByCustom($clientData?.result?.clientFacilities, 'regular')?.length >
                      0
                    "
                    class="grid md:grid-cols-3 gap-2"
                  >
                    <div
                      v-for="(_amenity, i_amenity) in $filterArrByCustom(
                        $clientData?.result?.clientFacilities,
                        'regular'
                      ) || []"
                      :key="i_amenity"
                    >
                      <atoms-text caption strong class="!text-primary capitalize">{{
                        _amenity.category
                      }}</atoms-text>
                      <atoms-text>{{ _amenity?.title }} </atoms-text>
                    </div>
                  </section>
                  <atoms-empty v-else image="" height="100" message=" " class="mt-2">
                    <atoms-text caption>No Regular amenities</atoms-text></atoms-empty
                  >
                </n-tab-pane>
              </n-tabs>
            </div>
            <atoms-empty v-else message="None of facilities" image=""></atoms-empty>
          </n-card>
          <br />
          <n-card>
            <template #header>
              <atoms-text strong>Policies</atoms-text>
            </template>
            <!-- <section
              v-if="$clientData?.result?.policies?.length > 0"
              class="grid md:grid-cols-3 gap-2"
            >
              <div
                v-for="(_policy, _ipolicy) in $clientData?.result?.policies || []"
                :key="_ipolicy"
              >
                <atoms-text span strong class="!text-primary capitalize">{{
                  _policy.category
                }}</atoms-text>
                <atoms-text>{{ _policy.title }}</atoms-text>
              </div>
            </section>
            <atoms-empty v-else message="None of policies" image=""></atoms-empty> -->
            <div>
              <!-- <atoms-text strong class="!text-primary mb-1">Policies</atoms-text> -->
              <div v-if="$clientData?.result?.policies?.length > 0" class="space-y-5">
                <div
                  v-for="(_policy, i_policy) in $clientData?.result?.policies || []"
                  :key="i_policy"
                >
                  <atoms-text span strong
                    ><span class="!text-primary">{{ _policy.title }}</span></atoms-text
                  >
                  <atoms-text span v-html="_policy.details"></atoms-text>
                </div>
              </div>
              <atoms-empty v-else image="" height="100" message=" " class="mt-2">
                <atoms-text caption>No Policies</atoms-text></atoms-empty
              >
            </div>
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
          <div class="flex items-center gap-1">
            <atoms-icon name="map-marker" flat class="!text-inherit"></atoms-icon>
            <atoms-text span class="!text-inherit"
              >Address : {{ $clientData?.result?.clientLocation?.address }}</atoms-text
            >
          </div>
          <br />
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
        <n-tab-pane :name="$tabs.rooms" :tab="$tabs.rooms">
          <div
            v-if="$local.mainLoading || !$local.dataRooms || $local.dataRooms?.length <= 0"
            class="space-y-3"
          >
            <n-skeleton card height="100px" :repeat="5"></n-skeleton>
          </div>
          <div v-else class="space-y-5">
            <div
              v-for="(_item, _iitem) in $local.dataRooms"
              class="shadow-xl hover:shadow-sm rounded-md overflow-hidden cursor-pointer transition-all duration-300 ease-out bg-white dark:bg-black"
            >
              <section class="grid grid-cols-5">
                <atoms-image-native
                  :src="_item.pictures?.[0]?.picture"
                  class="col-span-full md:col-span-1 min-h-[200px]"
                  ><template #none
                    ><n-space
                      class="h-full bg-white-smoke dark:bg-black-pure w-full"
                      justify="center"
                      align="center"
                    >
                      <atoms-icon
                        flat
                        size="25"
                        name="domain"
                        class="!text-primary" /></n-space></template
                ></atoms-image-native>
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
                    <atoms-text v-if="_item.amenities?.length > 5" caption>and more...</atoms-text>
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
                    <n-button type="primary" @click.stop="$local.showBooking = _item"
                      >Book Now</n-button
                    >
                  </div>
                </div>
              </section>
            </div>
            <n-button
              v-if="!Boolean($local.dataRooms?.length >= $local.rawRooms?.count)"
              ref="$refProductLoadBtn"
              :disabled="$local.rawRooms?.pages < 1 || $local.moreLoading"
              @click="
                () => {
                  if ($local.rawRooms?.pages > 1) {
                    $onFetchProduct({ limit: $local.dataRooms?.length + 5, noLoading: true });
                  }
                }
              "
              >{{ $local.moreLoading ? "Loading..." : "Load More" }}</n-button
            >
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
