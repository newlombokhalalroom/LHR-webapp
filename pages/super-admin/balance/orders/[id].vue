<!-- pages/super-admin/orders/[id].vue -->
<script setup>
import { useRoute, useRouter } from "vue-router";
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NButton,
  NImage,
  NDataTable,
  NTag,
  useMessage,
} from "naive-ui";
import { ref, reactive, computed, onMounted } from "vue";
import { useUserStore } from "@/store/user";

definePageMeta({
  path: "/super-admin/orders/:id",
  title: "Order Detail",
  label: "Order Detail",
  order: 0,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const route = useRoute();
const router = useRouter();
const $message = useMessage();
const $userStore = useUserStore();
const orderId = computed(() => String(route.params.id || "").trim());

// utils
const safe = (v) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "") ? "-" : v;
const fmtDate = (val) =>
  val ? new Date(val).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";
const fmtRp = (v) =>
  v === null || v === undefined ? "-" : "Rp " + Number(v).toLocaleString("id-ID");
const statusType = (s) => {
  switch ((s || "").toLowerCase()) {
    case "process":
    case "progress":
      return "warning";
    case "done":
      return "success";
    case "canceled":
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

// state
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const data = reactive({
  id: "",
  user_details_id: "",
  client_details_id: "",
  start_date: "",
  end_date: "",
  _created_date: "",
  _updated_date: "",
  status: "",
  total: 0,
  // nested
  items: [],
  user: { first_name: "", last_name: "", picture: null },
  client: {
    id: "",
    type_id: "",
    name: "",
    title: "", // type title seperti "hotel"
    email: "",
    phone: "",
    picture: null,
    description: "",
  },
});

const statusSel = ref(null);
const statusOptions = [
  { label: "process", value: "process" },
  { label: "progress", value: "progress" },
  { label: "done", value: "done" },
  { label: "canceled", value: "canceled" },
];

// map & fetch
const mapOrder = (o) => ({
  id: o?.id ?? "",
  user_details_id: o?.user_details_id ?? "",
  client_details_id: o?.client_details_id ?? "",
  start_date: o?.start_date ?? "",
  end_date: o?.end_date ?? "",
  _created_date: o?._created_date ?? "",
  _updated_date: o?._updated_date ?? "",
  status: o?.status ?? "",
  total: Number(o?.total ?? 0),
  items: Array.isArray(o?.items) ? o.items : [],
  user: {
    first_name: o?.user?.first_name ?? "",
    last_name: o?.user?.last_name ?? "",
    picture: o?.user?.picture ?? null,
  },
  client: {
    id: o?.client?.id ?? "",
    type_id: o?.client?.type_id ?? "",
    name: o?.client?.name ?? "",
    title: o?.client?.title ?? "",
    email: o?.client?.email ?? "",
    phone: o?.client?.phone ?? "",
    picture: o?.client?.picture ?? null,
    description: o?.client?.description ?? "",
  },
});

const fetchOrder = async () => {
  if (!orderId.value) return;
  loading.value = true;
  try {
    const res = await $userStore.get(`/super-admin/orders/${orderId.value}`);
    const raw = res?.result ?? res?.data ?? res;
    if (!raw?.id) throw new Error("Order not found");
    Object.assign(data, mapOrder(raw));
    statusSel.value = data.status || null;
  } catch (e) {
    console.error(e);
    $message.error("Failed to fetch order.");
  } finally {
    loading.value = false;
  }
};

// update: HANYA status
const submit = async () => {
  if (!data.id) return;
  if (!statusSel.value || statusSel.value === data.status) {
    $message.warning("Tidak ada perubahan status.");
    return;
  }
  saving.value = true;
  try {
    await $userStore.put(`/super-admin/orders/${data.id}`, { status: statusSel.value });
    $message.success("Order status updated.");
    await fetchOrder();
  } catch (e) {
    console.error(e);
    $message.error("Failed to update status.");
  } finally {
    saving.value = false;
  }
};

const del = async () => {
  if (!data.id) return;
  if (!confirm("Delete this order? This action is irreversible.")) return;
  deleting.value = true;
  try {
    await $userStore.del(`/super-admin/orders/${data.id}`);
    $message.success("Order deleted.");
    router.push("/super-admin/orders");
  } catch (e) {
    console.error(e);
    $message.error("Failed to delete order.");
  } finally {
    deleting.value = false;
  }
};

onMounted(fetchOrder);

// computed for view
const userFullname = computed(() => {
  const f = data.user.first_name?.trim() || "";
  const l = data.user.last_name?.trim() || "";
  return (f + " " + l).trim() || "-";
});

// items table
const itemColumns = [
  {
    title: "Image",
    key: "picture",
    render: (row) =>
      h(NImage, {
        src: row?.picture || "",
        width: 90,
        height: 60,
        objectFit: "cover",
        previewDisabled: true,
        style: "border-radius:8px;",
      }),
  },
  { title: "Title", key: "title" },
  { title: "Qty", key: "quantity", render: (r) => safe(r.quantity) },
  { title: "Total", key: "total", render: (r) => fmtRp(r.total) },
];
</script>

<template>
  <atoms-container>
    <n-card
      class="mb-4 border border-primary bg-primary/5"
      :title="data?.id ? `Order — ${data.id}` : 'Order Detail'"
    >
      <div v-if="loading">
        <p class="text-gray-500">Loading...</p>
      </div>

      <div v-else>
        <!-- Header Summary -->
        <section class="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
          <n-card size="small">
            <atoms-text caption strong>Total</atoms-text>
            <atoms-heading h4>{{ fmtRp(data.total) }}</atoms-heading>
          </n-card>
          <n-card size="small">
            <atoms-text caption strong>Period</atoms-text>
            <div>{{ fmtDate(data.start_date) }} → {{ fmtDate(data.end_date) }}</div>
          </n-card>
          <n-card size="small" class="flex items-center justify-between">
            <div>
              <atoms-text caption strong>Status</atoms-text>
              <n-tag :type="statusType(data.status)" round :bordered="false">
                {{ (data.status || "-").toUpperCase() }}
              </n-tag>
            </div>
            <div class="flex items-center gap-2">
              <n-select
                v-model:value="statusSel"
                :options="statusOptions"
                style="min-width: 140px"
              />
              <n-button type="primary" :loading="saving" @click="submit">Update</n-button>
            </div>
          </n-card>
        </section>

        <!-- Client & User -->
        <section class="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
          <n-card size="small">
            <template #header><b>Client</b></template>
            <div class="flex items-start gap-3">
              <n-image
                :src="data.client.picture || ''"
                width="64"
                height="64"
                preview-disabled
                style="border-radius: 10px; object-fit: cover"
              />
              <div class="space-y-1">
                <div>
                  <b>{{ safe(data.client.name) }}</b>
                </div>
                <div class="text-sm text-gray-600">Type: {{ safe(data.client.title) }}</div>
                <div class="text-sm text-gray-600">Email: {{ safe(data.client.email) }}</div>
                <div class="text-sm text-gray-600">Phone: {{ safe(data.client.phone) }}</div>
              </div>
            </div>
          </n-card>

          <n-card size="small">
            <template #header><b>User</b></template>
            <div class="flex items-start gap-3">
              <n-image
                :src="data.user.picture || ''"
                width="64"
                height="64"
                preview-disabled
                style="border-radius: 10px; object-fit: cover"
              />
              <div class="space-y-1">
                <div>
                  <b>{{ userFullname }}</b>
                </div>
                <div class="text-sm text-gray-600">
                  User Details ID: {{ safe(data.user_details_id) }}
                </div>
              </div>
            </div>
          </n-card>
        </section>

        <!-- Items -->
        <n-card size="small" class="mb-4">
          <template #header><b>Items</b></template>
          <n-data-table
            :columns="itemColumns"
            :data="data.items"
            :bordered="true"
            striped
            size="small"
            :row-key="(r) => r.id"
          />
        </n-card>

        <!-- Meta -->
        <section class="grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
          <div><b>Client Details ID:</b> {{ safe(data.client_details_id) }}</div>
          <div><b>Created:</b> {{ fmtDate(data._created_date) }}</div>
          <div><b>Updated:</b> {{ fmtDate(data._updated_date) }}</div>
        </section>

        <!-- Actions -->
        <div class="mt-4">
          <n-button @click="router.back()">Back</n-button>
          <n-button type="error" tertiary class="ml-2" :loading="deleting" @click="del">
            Delete
          </n-button>
        </div>
      </div>
    </n-card>
  </atoms-container>
</template>
