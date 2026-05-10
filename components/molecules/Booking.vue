<script setup>
import { useUserStore } from "@/store/user";
import { useClientStore } from "@/store/client";
import { storeToRefs } from "pinia";

import {
  NSkeleton,
  NCalendar,
  NTabs,
  NTabPane,
  NAlert,
  NCard,
  NDivider,
  NScrollbar,
  NSpace,
  NButton,
  NTag,
  useNotification,
} from "naive-ui";
import moment from "moment/min/moment-with-locales";
import useVuelidate from "@vuelidate/core";
import {
  required,
  email,
  minLength,
  helpers,
  requiredIf,
  not,
  sameAs,
  minValue,
} from "@vuelidate/validators";
// moment.locale("id");

const { $useDbStorage } = useStorage();
const $notification = useNotification();
const $userStore = useUserStore();
const $clientStore = useClientStore();
const { data: $dataUser } = storeToRefs($userStore);

const $classified = {
  Halal: "halal",
  Regular: "regular",
  Excluded: "excluded",
};
const router = useRouter();
const { $api } = useApi();
const $onClose = inject("$onClose");
const { $createError } = useError();
const { $roles, $amongIncludes, $dateAddition, $dateEdit, $dateHours, $dateSubstract } =
  useNuxtApp();
const $props = defineProps({
  target: {
    type: Object,
    default: null,
  },
});

const $local = reactive({
  mainLoading: false,
  data: null,
  raw: null,
  term: null,
  page: 1,
  quantity: 1,
  checkIn: $dateHours(new Date(), 12),
  checkOut: $dateHours(new Date($dateEdit(new Date(), 1)), 12),
});

const $isRental = computed(() => ($props.target?.client?.title?.includes("car") ? true : false));

const $getSpesificAmenities = (_items, _target) =>
  _items.amenities?.filter((_item) =>
    _item?.category?.toLowerCase()?.includes(_target?.toLowerCase()),
  ) || [];

const $form = useVuelidate(
  {
    checkOut: {
      required: helpers.withParams({ _field_: "Check Out Date" }, required),
      custom: helpers.withParams(
        { _field_: "Check Out Date" },
        helpers.withMessage(
          () => `Your data check-in/out invalid`,
          (_value) => Number(moment($local.checkOut).diff(moment($local.checkIn), "days")) > 0,
        ),
      ),
    },
  },
  $local,
);

const $filterArrByCustom = (payload, target, by = "category") =>
  payload?.filter((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

const $findArrByCustom = (payload, target, by = "title") =>
  payload?.find((_item) => _item?.[by?.toLowerCase()]?.toLowerCase() == target?.toLowerCase()) ||
  null;

const $dateCheckIn = computed({
  get() {
    return new Date($local.checkIn).getTime();
  },
  set(_value) {
    $local.checkIn = $dateHours(new Date(_value), 12);
  },
});

const $dateCheckOut = computed({
  get() {
    return new Date($local.checkOut).getTime();
  },
  set(_value) {
    $local.checkOut = $dateHours(new Date(_value), 12);
    $form.value?.$validate().then((_res) => {
      if (_res) {
        $local.quantity = Number(moment($local.checkOut).diff(moment($local.checkIn), "days"));
      }
    });
  },
});

const $onSubmitBooking = async (_payload) => {
  $local.mainLoading = true;
  try {
    if (!confirm("Are you sure to proceed?")) {
      return;
    }

    let lastBooking = await $useDbStorage("booking");

    let isAlreadyExists = Object.assign(
      {},
      lastBooking?.find((_booking) => _booking?.client?.id === _payload?.client?.id),
    );
    let isItemAlreadyExists = Object.assign(
      {},
      isAlreadyExists?.orderItems?.find((_item) => _item?.id === _payload?.id),
    );

    if (isAlreadyExists) {
      lastBooking = lastBooking?.filter(
        (_booking) => _booking?.client?.id !== isAlreadyExists?.client?.id,
      );
    }

    if (isItemAlreadyExists) {
      isAlreadyExists.orderItems = isAlreadyExists.orderItems?.filter(
        (_item) => _item.id !== isItemAlreadyExists?.id,
      );
    }

    let newbody = {
      ...(isAlreadyExists || {}),
      client: _payload?.client,
      orderItems: [...(isAlreadyExists.orderItems || []), _payload],
    };

    console.log("body", newbody);

    await $useDbStorage("booking", [...(lastBooking || []), newbody]);

    $notification.success({
      title: "Success",
      content: "Your booking was successfully added",
    });
    navigateTo({ path: "/booking" });
    $onClose();
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};
</script>
<template>
  <client-only>
    <div v-if="$props.target">
      <template v-if="!$isRental">
        <n-alert type="info">
          <div class="flex items-center gap-1">
            <atoms-text class="!inline" caption>You can add more room on </atoms-text>
            <atoms-text href="/booking" class="!inline" caption>booking page</atoms-text>
          </div>
        </n-alert>
        <br />
      </template>
      <template v-else-if="$isRental">
        <n-alert type="info">
          <div class="flex items-center gap-1">
            <atoms-text class="!inline" caption>You can add more rental on </atoms-text>
            <atoms-text href="/booking" class="!inline" caption>booking page</atoms-text>
          </div>
        </n-alert>
        <br />
      </template>
      <n-alert type="info"
        ><atoms-text caption
          >You might have to put your information in the next step</atoms-text
        ></n-alert
      >
      <br />
      <atoms-text span>You are about to {{ $isRental ? "rent" : "booking" }},</atoms-text>
      <br />
      <n-card v-if="$isRental" size="small">
        <section class="grid grid-cols-12 gap-5">
          <div class="w-[100px] h-[100px] col-span-full lg:col-span-1 overflow-hidden">
            <atoms-image-native
              :src="$props.target?.pictures?.[0]?.picture"
              class="col-span-full lg:col-span-1 w-full min-h-[100px]"
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
          </div>
          <div class="col-span-full md:col-span-11">
            <atoms-heading h3>{{ $props.target?.title }}</atoms-heading>
            <atoms-text span>{{
              $props.target?.details?.find((_detail) =>
                _detail?.title?.toLowerCase()?.includes("driver"),
              )?.amount == 1
                ? "With Driver"
                : "Without Driver"
            }}</atoms-text>
            <n-divider class="!my-3"></n-divider>
            <div class="flex gap-x-10 gap-y-2">
              <div class="flex gap-2">
                <atoms-icon name="briefcase" size="20" flat></atoms-icon>
                <atoms-text span>
                  {{
                    $props.target?.details?.find((_detail) =>
                      _detail?.title?.toLowerCase()?.includes("payload"),
                    )?.amount || 1
                  }}
                </atoms-text>
                <atoms-text span>Baggage</atoms-text>
              </div>
              <div class="flex gap-2">
                <atoms-icon name="account-group" size="20" flat></atoms-icon>
                <atoms-text span>
                  {{
                    $props.target?.details?.find((_detail) =>
                      _detail?.title?.toLowerCase()?.includes("passenger"),
                    )?.amount || 1
                  }}
                </atoms-text>
                <atoms-text span>Passenger</atoms-text>
              </div>
              <div class="flex gap-2">
                <atoms-icon name="cog" size="20" flat></atoms-icon>
                <atoms-text span>
                  {{
                    $props.target?.details?.find((_detail) =>
                      _detail?.title?.toLowerCase()?.includes("manual"),
                    )?.amount == 1
                      ? "Manual"
                      : "Automatic"
                  }}
                  Gear
                </atoms-text>
              </div>
            </div>
          </div>
        </section>
        <section></section>
      </n-card>
      <n-card v-else size="small">
        <section class="grid grid-cols-12 gap-5">
          <div class="w-[100px] h-[100px] col-span-full lg:col-span-1 overflow-hidden">
            <atoms-image-native
              :src="$props.target?.pictures?.[0]?.picture"
              class="col-span-full lg:col-span-1 w-full min-h-[100px]"
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
          </div>
          <div class="col-span-full md:col-span-11">
            <atoms-heading h3>{{ $props.target?.title }}</atoms-heading>
            <atoms-text span>{{ $props.target?.client?.name }}</atoms-text>
          </div>
        </section>
        <section></section>
      </n-card>
      <!-- <atoms-heading> {{ $props.target?.title }}</atoms-heading> -->
      <!-- <atoms-text> {{ $props.target?.title }}</atoms-text> -->
      <n-divider title-placement="left"><atoms-text span>From</atoms-text></n-divider>
      <!-- todo : detail -->
      <section class="md:grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <atoms-text caption strong class="!text-primary capitalize"
            >{{ $props.target?.client?.title || "Name" }}
          </atoms-text>
          <atoms-text class="capitalize">{{ $props.target?.client?.name || "-" }}</atoms-text>
        </div>
        <div class="space-y-1">
          <atoms-text caption strong class="!text-primary capitalize">Email </atoms-text>
          <atoms-text>{{ $props.target?.client?.email || "-" }}</atoms-text>
        </div>
        <div class="space-y-1">
          <atoms-text caption strong class="!text-primary capitalize">Customer Call</atoms-text>
          <atoms-text class="capitalize">{{ $props.target?.client?.phone || "-" }}</atoms-text>
        </div>
        <div class="space-y-1">
          <atoms-text caption strong class="!text-primary capitalize">Certified </atoms-text>
          <n-space gap="2">
            <n-tag>Halal</n-tag>
            <n-tag>Verified Partner</n-tag>
          </n-space>
        </div>
        <div class="col-span-full space-y-1">
          <atoms-text caption strong class="!text-primary capitalize">Description</atoms-text>
          <atoms-text class="capitalize">{{ $props.target?.description || "-" }}</atoms-text>
        </div>
      </section>
      <n-divider title-placement="left">
        <atoms-text span>To ({{ $isRental ? "Rent" : "Room" }})</atoms-text>
      </n-divider>

      <n-scrollbar x-scrollable v-if="$props.target.pictures?.length > 0">
        <div class="flex flex-nowrap gap-2 bg-white-smoke dark:bg-black p-2 overflow-x-auto">
          <atoms-image-native
            v-for="(_file, _ifile) in $props.target.pictures"
            :key="_ifile"
            :src="_file.picture"
            width="300px"
            height="200px"
          ></atoms-image-native>
        </div>
      </n-scrollbar>
      <br />
      <template v-if="!$isRental">
        <n-card size="small" v-if="$props.target?.amenities?.length > 0" title="Amenities">
          <!-- <section class="md:grid grid-cols-3 gap-5">
            <div
              v-for="(_amenity, _iamenity) in $props.target?.amenities"
              :key="_iamenity"
              class="space-y-1"
            >
              <atoms-text caption strong class="!text-primary capitalize"
                >{{ _amenity.category }}
              </atoms-text>
              <atoms-text class="capitalize">{{ _amenity.title || "-" }}</atoms-text>
            </div>
          </section> -->
          <n-tabs type="line" animated>
            <n-tab-pane name="0" tab="Halal">
              <section
                v-if="$filterArrByCustom($props.target?.amenities, 'halal')?.length > 0"
                class="grid md:grid-cols-3 gap-2"
              >
                <div
                  v-for="(_amenity, i_amenity) in $filterArrByCustom(
                    $props.target?.amenities,
                    'halal',
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
                <atoms-text caption>None Halal amenities</atoms-text></atoms-empty
              >
            </n-tab-pane>
            <n-tab-pane name="1" tab="Regular">
              <section
                v-if="$filterArrByCustom($props.target?.amenities, 'regular')?.length > 0"
                class="grid md:grid-cols-3 gap-2"
              >
                <div
                  v-for="(_amenity, i_amenity) in $filterArrByCustom(
                    $props.target?.amenities,
                    'regular',
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
                <atoms-text caption>None Regular amenities</atoms-text></atoms-empty
              >
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </template>
      <template v-else>
        <n-card size="small" title="Rental Includes/Excludes">
          <n-tabs type="line" animated>
            <n-tab-pane name="0" tab="Includes">
              <section
                v-if="$filterArrByCustom($props.target?.amenities, $classified.Regular)?.length > 0"
                class="grid md:grid-cols-3 gap-2"
              >
                <div
                  v-for="(_amenity, i_amenity) in $filterArrByCustom(
                    $props.target?.amenities,
                    $classified.Regular,
                  ) || []"
                  :key="i_amenity"
                >
                  <atoms-text>{{ _amenity.title }}</atoms-text>
                </div>
              </section>
              <atoms-empty v-else image="" height="100" message=" " class="mt-2">
                <atoms-text caption>None Includes</atoms-text></atoms-empty
              >
            </n-tab-pane>
            <n-tab-pane name="1" tab="Excludes">
              <section
                v-if="
                  $filterArrByCustom($props.target?.amenities, $classified.Excluded)?.length > 0
                "
                class="grid md:grid-cols-3 gap-2"
              >
                <div
                  v-for="(_amenity, i_amenity) in $filterArrByCustom(
                    $props.target?.amenities,
                    $classified.Excluded,
                  ) || []"
                  :key="i_amenity"
                >
                  <atoms-text>{{ _amenity?.title }} </atoms-text>
                </div>
              </section>
              <atoms-empty v-else image="" height="100" message=" " class="mt-2">
                <atoms-text caption>None Excludes</atoms-text></atoms-empty
              >
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </template>
      <br />
      <n-card size="small" title="Policies">
        <div v-if="$props.target?.policies?.length > 0" class="">
          <div v-for="(_policy, i_policy) in $props?.target?.policies || []" :key="i_policy">
            <atoms-text span strong>{{ _policy.title }} ({{ _policy?.description }})</atoms-text>
            <atoms-text span v-html="_policy.details"></atoms-text>
          </div>
        </div>
        <atoms-empty v-else image="" height="100" message=" " class="">
          <atoms-text caption>None Policies</atoms-text></atoms-empty
        >
      </n-card>
      <br />
      <n-card size="small" title="Status">
        <section>
          <div class="space-y-1">
            <atoms-text caption strong class="!text-primary capitalize">Price</atoms-text>
            <atoms-text class="capitalize"
              >IDR {{ $addSeparator($props.target?.price || 0) || "-" }}</atoms-text
            >
          </div>
          <br />
          <div class="space-y-1">
            <atoms-text caption strong class="!text-primary capitalize"
              >(1x) per {{ $props.target?.units || "-" }}</atoms-text
            >
            <atoms-text class="capitalize">{{ $props.target?.title || "-" }}</atoms-text>
          </div>
          <br />
          <n-alert type="warning"
            ><atoms-text caption>Select any date you're about to book</atoms-text></n-alert
          >
          <br /><template v-if="!$isRental">
            <n-alert type="warning"
              ><atoms-text caption
                >Multiple dates will count as quantity of your booking</atoms-text
              ></n-alert
            >
            <br />
          </template>
          <div class="grid md:grid-cols-2 md:gap-5">
            <div class="space-y-1">
              <atoms-text caption strong class="!text-primary capitalize">{{
                $isRental ? "Pick-up Date" : "Check-in Date"
              }}</atoms-text>
              <atoms-input-date
                :is-date-disabled="(ts) => ts <= $dateEdit(new Date(), -1)"
                v-model:value="$dateCheckIn"
                type="date"
                format="dd MMMM yyyy"
                class="w-full"
                :isError="$form.checkOut.$error"
                :errors="$form.checkOut.$errors"
              />
            </div>
            <div class="space-y-1">
              <atoms-text caption strong class="!text-primary capitalize">{{
                $isRental ? "Drop-of Date" : "Check-out Date"
              }}</atoms-text>

              <atoms-input-date
                :is-date-disabled="(ts) => ts <= $dateEdit(new Date($dateCheckIn))"
                v-model:value="$dateCheckOut"
                type="date"
                format="dd MMMM yyyy"
                class="w-full"
                :isError="$form.checkOut.$error"
                :errors="$form.checkOut.$errors"
              />
            </div>
          </div>
          <div class="bg-gradient p-5 grid md:grid-cols-2 md:gap-5 rounded-md">
            <div class="space-y-1">
              <atoms-text caption strong class="!text-primary capitalize">Quantity</atoms-text>
              <atoms-text class="capitalize"
                >IDR {{ $addSeparator($props.target?.price || 0) || "-" }} x ({{ $local.quantity }})
                {{ $props.target?.units || "" }}
              </atoms-text>
            </div>
            <div class="space-y-1">
              <atoms-text caption strong class="!text-primary capitalize">Total Price</atoms-text>
              <atoms-text class="capitalize"
                >IDR
                {{
                  $addSeparator(($props.target?.price || 0) * $local.quantity) || "-"
                }}</atoms-text
              >
            </div>
          </div>
          <br />
          <div class="flex items-center gap-1">
            <atoms-text caption>📌 Next step you will be directly move to</atoms-text>
            <atoms-text href="/booking" caption>booking page</atoms-text>
            <atoms-text caption>to confirm your booking</atoms-text>
          </div>
          <br />
        </section>
      </n-card>

      <br />
      <n-button
        :disabled="$local.mainLoading || $form.checkOut?.$errors?.length > 0"
        class="w-full"
        type="primary"
        @click="
          () => {
            $onSubmitBooking({
              ...$props.target,
              price: Number($props.target?.price),
              amount: $local.quantity,
              startDate: new Date($local.checkIn),
              endDate: new Date($local.checkOut),
            });
          }
        "
        >Book Now</n-button
      >
      <!-- {{ $props.target?.amenities }} -->
    </div>
  </client-only>
</template>
