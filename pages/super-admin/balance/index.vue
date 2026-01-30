<!-- pages/super-admin/balance.vue -->
<script setup>
import {
  NCard,
  NButton,
  NSkeleton,
  NPagination,
  NTabs,
  NTabPane,
  NDataTable,
  NTag,
  useNotification,
  useLoadingBar,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { onMounted, watch, computed, h, reactive } from "vue";
import moment from "moment/min/moment-with-locales";
import { useUserStore } from "@/store/user";
import useApi from "@/composables/useApi";

moment.locale("id");

const router = useRouter();
const route = useRoute();
const $loadingBar = useLoadingBar();
const $notification = useNotification();
const { $api } = useApi();
const { $createError } = useError?.() || { $createError: () => {} };
const { data: $dataUser } = storeToRefs(useUserStore());

/* ================= Meta & Route ================= */
const $meta = reactive({
  href: `${route.fullPath}`,
  title: "Balance",
  description: "Super Admin Balance overview with Withdraw, Refund, and Orders activity.",
});

definePageMeta({
  path: "/super-admin/balance",
  label: "Balance",
  icon: "wallet",
  order: 1,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

useHead({
  title: $meta.title,
  meta: [
    { name: "description", content: $meta.description },
    { property: "og:title", content: $meta.title },
    { property: "og:description", content: $meta.description },
    { property: "og:url", content: $meta.href },
    { name: "twitter:title", content: $meta.title },
    { name: "twitter:description", content: $meta.description },
  ],
  link: [{ rel: "canonical", href: $meta.href }],
});
const isEmpty = (v) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

const safeText = (v) => (isEmpty(v) ? "-" : v);

const fmtDate = (val) =>
  val ? new Date(val).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

const fmtRp = (v) =>
  v !== null && v !== undefined && String(v).trim() !== ""
    ? "Rp " + Number(v).toLocaleString("id-ID")
    : "-";

const statusTagType = (s) => {
  switch ((s || "").toString().toLowerCase()) {
    case "paid":
    case "success":
    case "approved":
    case "done":
      return "success";
    case "process":
    case "progress":
    case "pending":
      return "warning";
    case "unpaid":
    case "rejected":
    case "canceled":
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

const PLACEHOLDER_AVATAR = null;
const EMPTY_IMAGE = "";

/* ================= Local State ================= */
const $local = reactive({
  // balance box
  balanceLoading: false,
  balance: null,

  // tabs
  tab: "withdrawals", // withdrawals | refunds | orders

  // list (withdraw/refund)
  mainLoading: false,
  list: [],
  raw: null,
  page: 1,
  limit: 10,

  // orders table
  ordersLoading: false,
  orders: [],
  ordersMeta: { page: 1, limit: 10, total: 0 },
  ordersPage: 1,
  ordersLimit: 10,
});

/* ================= Caches ================= */
const cardCache = new Map(); // cardId -> card detail
const userCache = new Map(); // userId -> user detail

/* ================= Fetch helpers ================= */
const fetchCardById = async (cardId) => {
  if (!cardId) return null;
  if (cardCache.has(cardId)) return cardCache.get(cardId);
  try {
    const resp = await $api.get(`/cards/${cardId}`);
    const lvl1 = resp?.result ?? resp?.data ?? resp;
    const card = lvl1?.card ?? lvl1 ?? null;
    if (card) cardCache.set(cardId, card);
    return card;
  } catch {
    return null;
  }
};

const fetchUserById = async (userId) => {
  if (!userId) return null;
  if (userCache.has(userId)) return userCache.get(userId);
  try {
    const resp = await $api.get(`/super-admin/users/${userId}`);
    const user = resp?.result ?? resp?.data ?? resp ?? null;
    if (user) userCache.set(userId, user);
    return user;
  } catch {
    return null;
  }
};

/* ================= Enrich Withdrawal/Refund Row ================= */
const enrichWithdrawalRow = async (row) => {
  try {
    const card = await fetchCardById(row?.card_id);
    const userId = card?.user_id || card?.user?.id || null;
    const user = userId ? await fetchUserById(userId) : null;

    const roleName = (user?.role?.name || user?.role?.title || user?.role_title || "")
      .toString()
      .toLowerCase();

    return {
      id: row?.id,
      amount: row?.amount,
      status: row?.status,
      created_at: row?.createdDate || row?._created_date || null,
      updated_at: row?.updatedDate || row?._updated_date || null,
      card: {
        id: card?.id || row?.card_id,
        cardNumber: card?.card_number || card?.cardNumber || null,
        cardHolder: card?.card_holder || card?.cardHolder || null,
        bankId: card?.bank_id || card?.bankId || null,
        bank: card?.bank
          ? {
              id: card.bank?.id ?? card?.bank_id ?? null,
              title: card.bank?.title ?? null,
              icon: card.bank?.icon ?? null,
              code: card.bank?.code ?? null,
            }
          : null,
      },
      user: user
        ? {
            id: user?.id || userId || null,
            username:
              user?.username ||
              user?.fullname ||
              user?.name ||
              (user?.email ? user.email.split("@")[0] : null) ||
              "-",
            picture: user?.picture || user?.avatar || PLACEHOLDER_AVATAR,
            role: {
              id: user?.role?.id || user?.role_id || null,
              name: roleName || null,
            },
          }
        : {
            id: null,
            username: "-",
            picture: PLACEHOLDER_AVATAR,
            role: { id: null, name: null },
          },
      role_name: roleName || "",
    };
  } catch {
    return {
      id: row?.id,
      amount: row?.amount,
      status: row?.status,
      created_at: row?.createdDate || row?._created_date || null,
      updated_at: row?.updatedDate || row?._updated_date || null,
      card: { id: row?.card_id },
      user: {
        id: null,
        username: "-",
        picture: PLACEHOLDER_AVATAR,
        role: { id: null, name: null },
      },
      role_name: "",
    };
  }
};

/* ================= Balance ================= */
const fetchTotalLiability = async () => {
  $local.balanceLoading = true;
  try {
    // lebih aman pakai $api untuk absolute endpoint
    const resp = await $api.get("/super-admin/balance");
    const payload = resp?.data ?? resp?.result ?? resp;

    // fleksibel: backend bisa pakai total_liability atau total_amount
    const total =
      payload?.total_liability ??
      payload?.total_amount ??
      payload?.data?.total_liability ??
      payload?.data?.total_amount ??
      payload?.result?.total_liability ??
      payload?.result?.total_amount ??
      0;

    // simpan ke state yg dipakai template
    $local.balance = {
      amount: Number(total || 0),
      _updated_date:
        payload?._updated_date ??
        payload?.updated_at ??
        payload?.data?._updated_date ??
        payload?.result?._updated_date ??
        new Date().toISOString(),
    };

    return $local.balance.amount;
  } catch (err) {
    $createError(err);
    $local.balance = { amount: 0, _updated_date: new Date().toISOString() };
    return 0;
  } finally {
    $local.balanceLoading = false;
  }
};

/* ================= Withdraw/Refund (list) ================= */
const _pagingParams = () => ({ page: $local.page, limit: $local.limit });

const $onFetchList = async () => {
  if ($local.tab === "orders") return; // orders pakai fetch sendiri
  $local.mainLoading = true;
  try {
    const params = { ..._pagingParams(), filter: JSON.stringify({ order: "_created_date DESC" }) };
    const resp = await $api.get(`/withdrawals`, { params });
    const rows = resp?.result || resp?.data || [];
    const enriched = await Promise.all(rows.map(enrichWithdrawalRow));

    const filtered =
      $local.tab === "withdrawals"
        ? enriched.filter((x) => x.role_name === "admin")
        : enriched.filter((x) => x.role_name === "user");

    $local.list = filtered;
    $local.raw = {
      pages: resp?.pages || 1,
      total: resp?.total || filtered.length,
      count: filtered.length,
    };
  } catch (err) {
    $createError(err);
    $local.list = [];
    $local.raw = { pages: 1, total: 0, count: 0 };
  } finally {
    $local.mainLoading = false;
  }
};

/* ================= Orders (DataTable) ================= */
const mapOrderRow = (o) => {
  const u = o?.user || {};
  const first = u?.first_name ?? u?.firstname ?? "";
  const last = u?.last_name ?? u?.lastname ?? "";
  const nameCombo = [first, last].filter(Boolean).join(" ");
  const username =
    (!isEmpty(nameCombo) && nameCombo) ||
    u?.full_name ||
    u?.fullname ||
    u?.display_name ||
    u?.username ||
    o?.username ||
    "-";

  return {
    id: o?.id,
    username,
    client_name: o?.client?.name ?? o?.client_name ?? "-",
    start_date: o?.start_date ?? o?.startDate ?? null,
    end_date: o?.end_date ?? o?.endDate ?? null,
    total: o?.total ?? null,
    status: o?.status ?? null,
    _created_date: o?._created_date ?? o?.created_at ?? null,
    _updated_date: o?._updated_date ?? o?.updated_at ?? null,
  };
};

const fetchOrders = async () => {
  $local.ordersLoading = true;
  try {
    const res = await useUserStore().get("/super-admin/orders", {
      params: { page: $local.ordersPage, limit: $local.ordersLimit },
    });
    const arr = Array.isArray(res?.result) ? res.result : (res?.data ?? []);
    $local.orders = arr.map(mapOrderRow);
    const m = res?.meta || {};
    $local.ordersMeta = {
      page: m.page ?? $local.ordersPage,
      limit: m.limit ?? $local.ordersLimit,
      total: m.total ?? arr.length,
    };
  } catch (e) {
    $notification.error({ title: "Orders", content: "Gagal memuat orders." });
    $local.orders = [];
    $local.ordersMeta = { page: 1, limit: $local.ordersLimit, total: 0 };
  } finally {
    $local.ordersLoading = false;
  }
};

const ordersPageCount = computed(() =>
  Math.max(1, Math.ceil(($local.ordersMeta.total || 0) / ($local.ordersMeta.limit || 10) || 1)),
);

const gotoOrderDetail = (id) => router.push(`/super-admin/orders/${id}`);
const deleteOrder = async (row) => {
  if (!confirm("Delete this order? This action is irreversible.")) return;
  try {
    await useUserStore().del(`/super-admin/orders/${row.id}`);
    $notification.success({ title: "Orders", content: "Order deleted." });
    await fetchOrders();
  } catch (e) {
    $notification.error({ title: "Orders", content: "Failed to delete order." });
  }
};

const orderColumns = [
  { title: "User", key: "username", render: (r) => safeText(r.username) },
  { title: "Client", key: "client_name", render: (r) => safeText(r.client_name) },
  { title: "Start", key: "start_date", render: (r) => fmtDate(r.start_date) },
  { title: "End", key: "end_date", render: (r) => fmtDate(r.end_date) },
  { title: "Total", key: "total", render: (r) => fmtRp(r.total) },
  {
    title: "Status",
    key: "status",
    render: (row) =>
      h(
        NTag,
        { type: statusTagType(row.status), round: true, bordered: false },
        { default: () => (row.status || "-").toString().toUpperCase() },
      ),
  },
  { title: "Created", key: "_created_date", render: (r) => fmtDate(r._created_date) },
  { title: "Updated", key: "_updated_date", render: (r) => fmtDate(r._updated_date) },
  {
    title: "Action",
    key: "actions",
    render: (row) =>
      h("div", { class: "flex gap-2" }, [
        h(
          NButton,
          { size: "small", onClick: () => gotoOrderDetail(row.id) },
          { default: () => "Detail" },
        ),
        h(
          NButton,
          { size: "small", type: "error", tertiary: true, onClick: () => deleteOrder(row) },
          { default: () => "Delete" },
        ),
      ]),
  },
];

/* ================= Loaders → LoadingBar konsisten ================= */
watch(
  [() => $local.mainLoading, () => $local.balanceLoading, () => $local.ordersLoading],
  (vals) => {
    if (vals.some(Boolean)) $loadingBar.start();
    else setTimeout(() => $loadingBar.finish(), 180);
  },
);

/* ================= Tabs & Pagination Watchers ================= */
watch(
  () => $local.tab,
  async () => {
    if ($local.tab === "orders") {
      $local.ordersPage = 1;
      await fetchOrders();
    } else {
      $local.page = 1;
      await $onFetchList();
    }
  },
);

watch(
  () => $local.page,
  async () => {
    if ($local.tab !== "orders") await $onFetchList();
  },
);

watch(
  () => $local.ordersPage,
  async () => {
    if ($local.tab === "orders") await fetchOrders();
  },
);

/* ================= Mount ================= */
onMounted(async () => {
  await fetchTotalLiability();
  await $onFetchList();
});

/* ================= Open detail ================= */
const openTxnDetail = (row) => {
  if ($local.tab === "withdrawals") {
    router.push(`/super-admin/withdrawals/${row?.id}`);
  } else if ($local.tab === "refunds") {
    router.push(`/super-admin/refunds/${row?.id}`);
  } else {
    $notification.info({ content: `Refund ID: ${row?.id || "-"}`, duration: 2200 });
  }
};
</script>
..
<template>
  <atoms-container>
    <!-- BALANCE BOX -->
    <n-card class="mb-4 shadow-sm rounded-2xl">
      <template #header>
        <section class="flex items-center gap-3">
          <atoms-icon name="wallet" flat :size="22" />
          <atoms-heading h4 class="mb-0">System Liability</atoms-heading>
        </section>
      </template>

      <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="space-y-1">
          <atoms-text caption strong>Current Balance</atoms-text>
          <atoms-heading h3 class="flex items-center gap-2">
            <atoms-icon
              :size="18"
              flat
              name="refresh"
              class="cursor-pointer"
              @click="fetchTotalLiability"
            />
            {{ $local.balanceLoading ? "Loading..." : fmtRp($local.balance?.amount || 0) }}
          </atoms-heading>
        </div>

        <div class="space-y-1">
          <atoms-text caption strong>Last Updated</atoms-text>
          <atoms-text>
            {{
              $local.balanceLoading
                ? "—"
                : $local.balance?._updated_date
                  ? moment($local.balance?._updated_date).format("DD MMMM YYYY, HH:mm")
                  : moment().format("DD MMMM YYYY, HH:mm")
            }}
          </atoms-text>
        </div>
      </section>
    </n-card>

    <!-- TABS + CONTENT -->
    <n-card class="shadow-sm rounded-2xl">
      <template #header>
        <NTabs v-model:value="$local.tab" type="segment">
          <NTabPane name="withdrawals" tab="Withdraw" />
          <NTabPane name="refunds" tab="Refund" />
          <NTabPane name="orders" tab="Orders" />
        </NTabs>
      </template>

      <section class="flex items-center justify-between mb-3">
        <atoms-text caption class="text-gray-600">
          {{
            $local.tab === "withdrawals"
              ? "List of withdrawals (admin only)"
              : $local.tab === "refunds"
                ? "List of refunds (user only)"
                : "List of orders"
          }}
        </atoms-text>
        <n-button
          size="small"
          secondary
          @click="$local.tab === 'orders' ? fetchOrders() : $onFetchList()"
        >
          Refresh
        </n-button>
      </section>

      <!-- ORDERS (DataTable konsisten) -->
      <section v-if="$local.tab === 'orders'">
        <n-data-table
          :columns="orderColumns"
          :data="$local.orders"
          :loading="$local.ordersLoading"
          :bordered="true"
          striped
          size="small"
          :row-key="(r) => r.id"
        />
        <div class="flex items-center justify-between mt-6">
          <span class="text-sm text-gray-500">
            Page {{ $local.ordersMeta.page }} · Showing {{ $local.orders.length }} of
            {{ $local.ordersMeta.total }} orders
          </span>
          <n-pagination
            v-model:page="$local.ordersPage"
            :page-count="ordersPageCount"
            :disabled="$local.ordersLoading"
          />
        </div>
      </section>

      <!-- WITHDRAW / REFUND (Cards konsisten) -->
      <section v-else>
        <n-skeleton v-if="$local.mainLoading" type="card" height="120px" :repeat="2" />

        <section v-else>
          <section v-if="$local.list?.length > 0" class="space-y-3">
            <n-card
              v-for="(row, i) in $local.list"
              :key="row?.id || i"
              class="cursor-pointer rounded-xl"
              :segmented="{ content: true, footer: true }"
              @click="openTxnDetail(row)"
            >
              <template #header>
                <section class="flex items-center justify-between w-full">
                  <div>
                    <atoms-text class="!text-primary capitalize">{{
                      safeText(row?.status)
                    }}</atoms-text>
                    <atoms-text caption>{{ fmtDate(row?.created_at) }}</atoms-text>
                  </div>
                  <atoms-heading h5 class="mb-0">{{ fmtRp(row?.amount) }}</atoms-heading>
                </section>
              </template>

              <section class="grid grid-cols-2 gap-3 md:grid-cols-6">
                <div class="col-span-2 md:col-span-2">
                  <atoms-text caption strong>User</atoms-text>
                  <div class="flex items-center gap-2">
                    <atoms-avatar
                      :src="row?.user?.picture || PLACEHOLDER_AVATAR"
                      :zoom="false"
                      sizes="28"
                      :nickname="row?.user?.username || 'user'"
                    />
                    <div class="flex flex-col">
                      <atoms-text>{{ safeText(row?.user?.username) }}</atoms-text>
                      <atoms-text caption>{{ safeText(row?.user?.role?.name) }}</atoms-text>
                    </div>
                  </div>
                </div>

                <div>
                  <atoms-text caption strong>Card</atoms-text>
                  <atoms-text>
                    {{
                      row?.card?.cardNumber ? "**** " + String(row.card.cardNumber).slice(-4) : "-"
                    }}
                  </atoms-text>
                  <atoms-text caption>{{ safeText(row?.card?.cardHolder) }}</atoms-text>
                </div>

                <div>
                  <atoms-text caption strong>Bank ID</atoms-text>
                  <atoms-text>{{ safeText(row?.card?.bankId) }}</atoms-text>
                </div>

                <div>
                  <atoms-text caption strong>ID</atoms-text>
                  <atoms-text>{{ safeText(row?.id) }}</atoms-text>
                </div>

                <div class="flex items-start md:items-center md:justify-end">
                  <n-button size="small" type="primary" @click.stop="openTxnDetail(row)">
                    Detail
                  </n-button>
                </div>
              </section>
            </n-card>
          </section>

          <atoms-empty v-else :message="'No data found'" :image="EMPTY_IMAGE" />
          <section class="mt-4">
            <n-pagination
              v-model:page="$local.page"
              :page-count="$local.raw?.pages || 1"
              :page-size="$local.limit"
              :disabled="$local.mainLoading"
              class="flex flex-wrap gap-y-4"
            />
          </section>
        </section>
      </section>
    </n-card>
  </atoms-container>
</template>
