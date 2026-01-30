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
import * as uuid from "uuid";
import { useVuelidate } from "@vuelidate/core";
import { required, email, minValue } from "@vuelidate/validators";
import moment from "moment";
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
const $setShowBooking = inject("$setShowBooking");

const $filterArrByCustom = (payload, target, by = "category") =>
  payload?.filter((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

const $findArrByCustom = (payload, target, by = "title") =>
  payload?.find((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

const $props = defineProps({
  data: null,
  pending: null,
});

const $scrollNaive = (top = 0) => {
  const _target = document.getElementById("lhr-layout-container").parentNode;
  _target.scrollTo({
    behavior: "smooth",
    top: 0,
  });
};

onMounted(() => {
  $scrollNaive();
});
</script>
<template>
  <atoms-container class="!pt-0">
    <atoms-image
      :alt="`image of ${$props?.data?.title}`"
      :src="$props?.data?.client?.picture"
      class="w-full h-[250px]"
      position="left bottom"
    >
      <template #none
        ><n-space
          class="bg-white-smoke dark:bg-black-pure w-full h-full"
          justify="center"
          align="center"
        >
          <atoms-icon flat size="25" name="camera" class="!text-primary" /></n-space
      ></template>
      <section class="absolute top-0 left-0 grid grid-cols-2 w-full h-full">
        <div></div>
        <div class="grid grid-cols-2 overflow-hidden h-full">
          <atoms-image-native
            v-for="(_picture, i_picture) in Array.from(Array(4).keys())?.map(
              (_item) => $props?.data?.pictures?.[_item - 1] || _item
            )"
            :key="i_picture"
            :src="$props.data.picture"
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
                  name="camera"
                  class="!text-primary" /></n-space></template
          ></atoms-image-native>
        </div>
      </section>
    </atoms-image>
    <br />
    <section
      class="space-y-2 flex flex-col md:flex-row flex-wrap items-start md:items-center gap-5"
    >
      <div class="flex-none ring-5">
        <atoms-avatar
          ref="$refPicture"
          :src="$props?.data?.pictures?.[0]?.picture"
          class="cursor-pointer dark:!bg-black bg-white"
          sizes="150"
          nickname="account"
        />
      </div>
      <div
        class="w-full md:w-auto flex-1 gap-5 gap-y-10 flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between"
      >
        <div>
          <atoms-heading h2 class="capitalize mb-1">
            {{ $props?.data?.title }}
          </atoms-heading>
          <atoms-text> {{ $props.data.client?.name }}</atoms-text>
          <br />
          <div class="flex gap-2 items-center">
            <atoms-text>Price : </atoms-text>
            <n-tag type="primary"
              ><atoms-text>
                IDR {{ $addSeparator($props?.data?.price || 0) }} / per night</atoms-text
              ></n-tag
            >
          </div>
          <!-- <n-tag v-if="$props?.data?.availability" type="primary" size="small">Available</n-tag>
            <n-tag v-else type="error" size="small">Not Available</n-tag> -->
          <!-- <section class="flex flex-wrap items-end gap-5">
              <div>
                <atoms-text caption>Price </atoms-text>
                <atoms-text> IDR {{ $addSeparator($props?.data?.price || 0) }} / per night</atoms-text>
              </div>
              <div>
                <atoms-text caption>Hotel </atoms-text>
                <atoms-text> {{ $props.data.client?.name }}</atoms-text>
              </div>
            </section> -->
        </div>
        <div class="w-full md:w-auto flex flex-wrap gap-2">
          <n-button @click="router.back()" class="w-full md:w-auto">Back</n-button>
          <n-button type="primary" class="w-full md:w-auto" @click="$setShowBooking($props.data)"
            >Check Availability</n-button
          >
        </div>
      </div>
    </section>

    <n-divider />

    <section class="space-y-5">
      <div>
        <atoms-text strong class="!text-primary">About the room</atoms-text>
        <div class="p-5 mt-2 bg-white shadow-md dark:bg-black rounded-md">
          <atoms-text span v-html="$props.data.description || '-'"></atoms-text>
        </div>
      </div>
      <div>
        <atoms-text v-if="$props?.data?.details?.length > 0" strong class="!text-primary"
          >Includes</atoms-text
        >
        <div class="p-5 mt-2 bg-white shadow-md dark:bg-black rounded-md">
          <div v-for="(_detail, i_detail) in $props?.data?.details || []" :key="i_detail">
            <atoms-text span>- {{ _detail.title }} ({{ _detail?.amount }}x)</atoms-text>
          </div>
        </div>
      </div>
      <div>
        <atoms-text strong class="!text-primary">Amenities</atoms-text>
        <div class="p-5 mt-2 bg-white shadow-md dark:bg-black rounded-md">
          <div v-if="$props?.data?.amenities?.length > 0">
            <n-tabs type="line" animated>
              <n-tab-pane name="0" tab="Halal">
                <section
                  v-if="$filterArrByCustom($props?.data?.amenities, 'halal')?.length > 0"
                  class="grid md:grid-cols-3 gap-2"
                >
                  <div
                    v-for="(_amenity, i_amenity) in $filterArrByCustom(
                      $props?.data?.amenities,
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
                  v-if="$filterArrByCustom($props?.data?.amenities, 'regular')?.length > 0"
                  class="grid md:grid-cols-3 gap-2"
                >
                  <div
                    v-for="(_amenity, i_amenity) in $filterArrByCustom(
                      $props?.data?.amenities,
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
          <atoms-empty v-else image="" height="100" message=" " class="mt-2">
            <atoms-text caption>No Amenities showed</atoms-text></atoms-empty
          >
        </div>
      </div>

      <div>
        <atoms-text strong class="!text-primary mb-1">Policies</atoms-text>
        <div class="p-5 mt-2 bg-white shadow-md dark:bg-black rounded-md">
          <div
            v-if="$props?.data?.policies?.length > 0"
            v-for="(_policy, i_policy) in $props?.data?.policies || []"
            :key="i_policy"
          >
            <atoms-text span strong>{{ _policy.title }} ({{ _policy?.description }})</atoms-text>
            <atoms-text span v-html="_policy.details"></atoms-text>
          </div>
          <atoms-empty v-else image="" height="100" message=" " class="mt-2">
            <atoms-text caption>Room have no policies</atoms-text></atoms-empty
          >
        </div>
      </div>
    </section>

    <br />

    <section v-if="$props.data.client">
      <atoms-text strong class="!text-primary mb-2">More About</atoms-text>
      <div
        class="shadow-xl hover:shadow-sm rounded-md overflow-hidden transition-all duration-300 ease-out bg-white dark:bg-black"
      >
        <section class="grid grid-cols-5">
          <atoms-image-native
            :src="$props.data.client?.picture"
            :height="$breakpoint.smAndDown ? '100px' : 'auto'"
            class="col-span-full md:col-span-1"
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
            <div class="grid md:grid-cols-2 gap-5 h-full">
              <div class="col-span-1 flex flex-col h-full">
                <div>
                  <atoms-heading h4>{{ $props.data.client.name }}</atoms-heading>
                </div>
              </div>
              <div
                v-if="!$breakpoint.smAndDown"
                class="col-span-1 flex gap-2 md:flex-col items-end"
              >
                <div>
                  <n-button
                    :disabled="$dataUser?.scope?.includes('admin')"
                    @click="
                      router.push(
                        `/hotel/${$props.data.client?.id}`?.replaceAll('car-rent', 'rental')
                      )
                    "
                    >More about the {{ $props.data.client?.title }}</n-button
                  >
                </div>
              </div>
              <div class="col-span-full">
                <atoms-text span v-html="$props.data.client?.description || ''"></atoms-text>
              </div>
              <div v-if="$breakpoint.smAndDown" class="col-span-1 flex gap-2 md:flex-col items-end">
                <div>
                  <n-button
                    :disabled="$dataUser?.scope?.includes('admin')"
                    @click="
                      router.push(
                        `/hotel/${$props.data.client?.id}`?.replaceAll('car-rent', 'rental')
                      )
                    "
                    >More about the {{ $props.data.client?.title }}</n-button
                  >
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  </atoms-container>
</template>
