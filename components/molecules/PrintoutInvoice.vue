<script setup>
import { useOrderStore } from "@/store/order";
import { useUserStore } from "@/store/user";
import { useClientStore } from "@/store/client";
import { storeToRefs } from "pinia";

import {
  NSkeleton,
  NAlert,
  NCard,
  NDivider,
  NScrollbar,
  NSpace,
  NButton,
  NTag,
  NTable,
  useNotification,
} from "naive-ui";
import moment from "moment/min/moment-with-locales";

const $orderStore = useOrderStore();
const $userStore = useUserStore();
const $clientStore = useClientStore();
const { data: $dataUser } = storeToRefs($userStore);

const { $useDbStorage } = useStorage();
const $notification = useNotification();

const router = useRouter();
const { $api } = useApi();
const $onClose = inject("$onClose");
const { $createError } = useError();
const { $roles, $amongIncludes, $dateAddition, $dateEdit, $dateHours, $dateSubstract, $window } =
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
  checkIn: new Date(),
  checkOut: new Date($dateEdit(new Date(), 1)),
});

const $onFetchInvoice = async (_payload) => {
  $local.mainLoading = true;
  try {
    const _resp = await $orderStore.get(`${_payload?.id}/invoice`);
    if (_resp?.status) {
      $local.data = _resp?.result;
      console.log($local.data);
    }
  } catch (error) {
    throw new Error("Cannot find invoice id");
  } finally {
    $local.mainLoading = false;
  }
};

onMounted(async () => {
  $local.mainLoading = true;
  try {
    if (!$props.target || !$props.target?.id) {
      throw new Error("Failed to load invoice");
    }
    await $onFetchInvoice($props.target);
  } catch (error) {
    $createError(error);
    $onClose();
  }
});
</script>
<template>
  <ClientOnly>
    <n-skeleton v-if="$local.mainLoading" height="300px" />
    <div id="printer" v-else-if="$props.target && $local.data" class="!bg-white !text-black p-5">
      <section class="flex gap-5 flex-wrap justify-between items-start">
        <div class="col-span-1 flex gap-5 items-center">
          <atoms-image src="/logo.png" height="50" :zoom="false" />
          <atoms-heading h2 class="!text-inherit">Lombok Halal Room</atoms-heading>
        </div>
        <div class="md:text-right col-span-1">
          <atoms-heading h5 class="!text-inherit">Invoice</atoms-heading>
          <atoms-text span class="!text-inherit">{{ $local.data?.id }}</atoms-text>
          <atoms-text span class="!text-inherit"
            >Status : {{ $local.data?.status || "done" }}</atoms-text
          >
          <atoms-text span class="!text-inherit"
            >Date :
            {{ moment($local.data?._created_date).format("DD MMMM YYYY") || "done" }}</atoms-text
          >
        </div>
      </section>
      <br />
      <div class="p-2 px-5 bg-primary-darken rounded-sm">
        <atoms-text strong>Customer Detail</atoms-text>
      </div>
      <br />
      <section class="px-5">
        <atoms-text class="!text-inherit"
          >Name : {{ $local.data?.userDetails?.first_name }}</atoms-text
        >
        <atoms-text class="!text-inherit">Email : {{ $local.data?.userDetails?.email }}</atoms-text>
        <atoms-text class="!text-inherit"
          >Contact : {{ $local.data?.userDetails?.phone }}</atoms-text
        >
      </section>
      <br />
      <div class="p-2 px-5 bg-primary-darken rounded-sm">
        <atoms-text strong>Booking Detail</atoms-text>
      </div>
      <br />
      <section class="px-5">
        <atoms-text class="!text-inherit">Name : {{ $local.data?.clientDetails?.name }}</atoms-text>
        <atoms-text class="!text-inherit"
          >Email : {{ $local.data?.clientDetails?.email }}</atoms-text
        >
        <atoms-text class="!text-inherit"
          >Contact : {{ $local.data?.clientDetails?.phone }}</atoms-text
        >
      </section>
      <br />
      <div class="p-2 px-5 bg-primary-darken rounded-sm">
        <atoms-text strong>Purchased Detail</atoms-text>
      </div>
      <br />
      <n-table :bordered="false" :single-line="false">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(_item, _iitem) in $local.data?.orderItems" :key="_iitem">
            <td>{{ _item?.title }}</td>
            <td>{{ _item?.quantity }}</td>
            <td>IDR {{ $addSeparator(+_item?.price || 0) }}</td>
            <td>IDR {{ $addSeparator(+_item?.total || 0) }}</td>
          </tr>
        </tbody>
      </n-table>
      <br />
      <br />
      <section>
        <atoms-heading h2 class="!text-inherit"
          >Total : {{ $addSeparator(+$local.data?.total || 0) }}</atoms-heading
        >
      </section>
      <br />
      <br />
    </div>

    <br />
    <n-button :disabled="$local.mainLoading" type="primary" @click="$window.print()"
      >Print Invoice</n-button
    >
    <br />
    <br />
  </ClientOnly>
</template>
