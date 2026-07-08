<script setup>
import {
  NCard,
  NButton,
  NTag,
  NDivider,
  NSpace,
  NSkeleton,
  NAlert,
  NPagination,
  useNotification,
  useMessage,
} from "naive-ui";
import moment from "moment";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const $notification = useNotification();
const $message = useMessage();
const router = useRouter();
const { $addSeparator } = useNuxtApp();
const { $api } = useApi();
const { $createError } = useErrorHandler();

const $statusFilters = {
  All: "1=1",
  Pending: "orders.status='process'",
  Accepted: "orders.status='progress'",
  Completed: "orders.status='done'",
  Declined: "orders.status='cancelled'",
};

const $local = reactive({
  mainLoading: false,
  data: null,
  raw: null,
  page: 1,
  selectedFilter: $statusFilters.All,
  actionLoading: null,
});

const $statusColor = (status) => {
  const map = {
    unpaid: "warning",
    process: "warning",
    progress: "info",
    done: "success",
    cancelled: "error",
  };
  return map[status] || "default";
};

const $statusLabel = (status) => {
  const map = {
    unpaid: "Unpaid",
    process: "Waiting for Confirmation",
    progress: "On Progress",
    done: "Completed",
    cancelled: "Declined / Cancelled",
  };
  return map[status] || status;
};

const $onFetchOrders = async (_payload) => {
  $local.mainLoading = true;
  try {
    $local.page = _payload?.page || 1;
    const _resp = await $api.get("/orders", {
      params: {
        filter: JSON.stringify({
          where: $local.selectedFilter.toLowerCase(),
          order: "_created_date DESC",
        }),
        page: $local.page,
        limit: _payload?.limit || 10,
      },
    });
    $local.data = _resp?.result;
    $local.raw = _resp;
  } catch (error) {
    $local.data = null;
    $local.raw = null;
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

const $onAcceptOrder = async (orderId) => {
  if (!confirm("Are you sure you want to accept this order?")) return;
  $local.actionLoading = orderId;
  try {
    await $api.put(`/orders/${orderId}/confirmation/progress`);
    $notification.success({
      title: "Success",
      content: "Order accepted. The tourist will be notified.",
    });
    await $onFetchOrders({ page: $local.page });
  } catch (error) {
    $createError(error);
  } finally {
    $local.actionLoading = null;
  }
};

const $onDeclineOrder = async (orderId) => {
  if (!confirm("Are you sure you want to decline this order? The funds will be refunded to the tourist's balance."))
    return;
  $local.actionLoading = orderId;
  try {
    await $api.put(`/orders/${orderId}/confirmation/cancelled`);
    $notification.success({
      title: "Success",
      content: "Order declined. Funds have been refunded to the tourist's balance.",
    });
    await $onFetchOrders({ page: $local.page });
  } catch (error) {
    $createError(error);
  } finally {
    $local.actionLoading = null;
  }
};

watch(
  () => $local.selectedFilter,
  () => {
    $local.page = 1;
    $onFetchOrders();
  }
);

onMounted(() => {
  $onFetchOrders();
});

definePageMeta({
  order: 1,
  label: "Orders",
  title: "Tour Orders",
  navigator: ({ _user }) => {
    if (
      !_user?.scope?.includes("admin") ||
      !_user?.client?.type?.toLowerCase()?.includes("tour")
    )
      return false;
    return true;
  },
  validation: ({ _user }) => {
    if (
      !_user?.scope?.includes("admin") ||
      !_user?.client?.type?.toLowerCase()?.includes("tour")
    )
      return "/";
  },
});
</script>

<template>
  <div class="pb-20">
    <Head><Title>Incoming Orders - Tour Agent</Title></Head>
    <atoms-container>
      <br />
      <atoms-heading h2>Incoming Orders</atoms-heading>
      <atoms-text caption class="mb-4"
        >Manage incoming orders from tourists for your tour packages.</atoms-text
      >
      <br />

      <!-- Filter Tabs -->
      <n-space class="mb-4">
        <n-button
          v-for="([_key, _val], _i) in Object.entries($statusFilters)"
          :key="_i"
          :type="$local.selectedFilter === _val ? 'primary' : undefined"
          @click="$local.selectedFilter = _val"
          >{{ _key }}</n-button
        >
      </n-space>

      <!-- Loading -->
      <section v-if="$local.mainLoading" class="space-y-4">
        <n-skeleton height="120px" :repeat="4" />
      </section>

      <!-- Order Cards -->
      <section v-else-if="$local.data?.length > 0" class="space-y-4">
        <n-card v-for="(_order, _i) in $local.data" :key="_i" size="small">
          <template #header>
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <atoms-text span strong class="!uppercase"
                  >ORD{{
                    String(_order.id)?.slice(0, 3) +
                    moment(_order.start_date).format("DDMMYY") +
                    moment(_order._created_date).format("HHmmss")
                  }}</atoms-text
                >
              </div>
              <n-tag :type="$statusColor(_order.status)" size="small">
                {{ $statusLabel(_order.status) }}
              </n-tag>
            </div>
          </template>

          <section class="grid md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <div>
                <atoms-text caption strong class="!text-primary">Tourist</atoms-text>
                <atoms-text>{{ _order.user?.first_name ? (_order.user.first_name + ' ' + (_order.user.last_name || '')) : (_order.user?.username || _order.user_details?.first_name || "-") }}</atoms-text>
              </div>
              <div>
                <atoms-text caption strong class="!text-primary">Date</atoms-text>
                <atoms-text
                  >{{ moment(_order.start_date).format("DD MMM YYYY") }} -
                  {{ moment(_order.end_date).format("DD MMM YYYY") }}</atoms-text
                >
              </div>
            </div>
            <div class="space-y-2">
              <div>
                <atoms-text caption strong class="!text-primary">Item</atoms-text>
                <div v-for="(_item, _ii) in _order.items" :key="_ii">
                  <atoms-text caption
                    >{{ _item?.product?.title || _item?.title || "-" }} ({{
                      _item?.quantity || 1
                    }}x)</atoms-text
                  >
                  <div v-if="_item?.hotel" class="mt-1 pl-2 border-l-2 border-primary">
                    <atoms-text caption class="block text-gray-500">
                      Hotel: {{ _item.hotel.name }} 
                      (IDR {{ $addSeparator(Number(_item.hotel.price_per_night || 0)) }}/night)
                    </atoms-text>
                    <atoms-text caption class="block text-gray-500">
                      Hotel Total: IDR {{ $addSeparator(Number(_item.hotel.price_per_night || 0) * Math.max(1, moment(_order.end_date).diff(moment(_order.start_date), 'days')) * Math.ceil((_item.quantity || 1) / 2)) }}
                      ({{ Math.ceil((_item.quantity || 1) / 2) }} room(s) x {{ Math.max(1, moment(_order.end_date).diff(moment(_order.start_date), 'days')) }} night(s))
                    </atoms-text>
                  </div>
                  <atoms-text v-if="_item?.pickup_location" caption class="block text-gray-500 mt-1"
                    >📍 Pickup: {{ _item.pickup_location }}</atoms-text
                  >
                  <div v-if="_item?.review" class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <atoms-text caption strong class="!text-primary">Review ({{ _item.review.review_rate }} ⭐)</atoms-text>
                    <atoms-text caption class="block italic">"{{ _item.review.review_content }}"</atoms-text>
                  </div>
                </div>
              </div>
              <div>
                <atoms-text caption strong class="!text-primary">Total</atoms-text>
                <atoms-text strong>IDR {{ $addSeparator(Number(_order.total || 0)) }}</atoms-text>
              </div>
            </div>
          </section>

          <n-divider class="!my-3" />

          <!-- Actions only for 'process' status -->
          <n-space v-if="_order.status === 'process'">
            <n-button
              type="success"
              :loading="$local.actionLoading === _order.id"
              :disabled="$local.actionLoading !== null"
              @click="$onAcceptOrder(_order.id)"
              >Accept</n-button
            >
            <n-button
              type="error"
              :loading="$local.actionLoading === _order.id"
              :disabled="$local.actionLoading !== null"
              @click="$onDeclineOrder(_order.id)"
              >Decline</n-button
            >
          </n-space>

          <n-space v-else>
            <atoms-text caption class="italic">Order {{ $statusLabel(_order.status)?.toLowerCase() }}</atoms-text>
          </n-space>

          <template #footer>
            <atoms-text caption
              >Created: {{ moment(_order._created_date).format("DD MMM YYYY, HH:mm") }}</atoms-text
            >
          </template>
        </n-card>

        <n-pagination
          class="flex flex-wrap gap-y-5 mt-4"
          :disabled="$local.mainLoading"
          v-model:page="$local.page"
          :page-count="$local.raw?.pages || 1"
          @update:page="(_val) => $onFetchOrders({ page: _val })"
        />
      </section>

      <atoms-empty
        v-else
        image=""
        message="No incoming orders at the moment."
        class="bg-white dark:bg-black"
      />
      <br />
    </atoms-container>
  </div>
</template>
