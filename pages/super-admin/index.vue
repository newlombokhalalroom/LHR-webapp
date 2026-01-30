<!-- pages/super-admin/index.vue -->
<script setup>
import { NSkeleton, NCard, NButton, NImage, NTag } from "naive-ui";
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/store/user";
import useApi from "@/composables/useApi";

definePageMeta({
  order: 0,
  title: "Dashboard",
  label: "Dashboard",
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);
const router = useRouter();
const route = useRoute();
const { $api } = useApi();

/* ================= Helpers & Fallbacks ================= */

const isEmptyText = (v) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

const safeText = (v) => (isEmptyText(v) ? "-" : v);

const fmtDate = (val) =>
  val ? new Date(val).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "-";

const fmtMoney = (v) =>
  v === null || v === undefined ? "-" : "IDR " + Number(v).toLocaleString("en-US");

const orderStatusType = (s) => {
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

const wdStatusType = (s) => {
  switch ((s || "").toLowerCase()) {
    case "success":
      return "success";
    case "pending":
      return "warning";
    case "process":
    case "procces":
      return "info";
    case "cancelled":
    case "canceled":
      return "error";
    default:
      return "default";
  }
};

const maskCardNo = (num) => {
  if (!num) return "-";
  const s = String(num);
  return s.length <= 4 ? s : "•••• " + s.slice(-4);
};

/* ================= Counts (Users/Admins) ================= */
const totalAdminRoleOnly = ref(0);
const totalUserRoleOnly = ref(0);

const pickCount = (res) => {
  if (typeof res?.count === "number") return res.count;
  if (typeof res?.result?.count === "number") return res.result.count;
  const arr = Array.isArray(res?.result)
    ? res.result
    : Array.isArray(res?.data)
    ? res.data
    : Array.isArray(res)
    ? res
    : [];
  return arr.length || 0;
};

const countByRole = async (roleTitle) => {
  const filter = JSON.stringify({ where: `roles.title = '${roleTitle}'` });
  const res = await $userStore.get(null, { params: { limit: 1, filter } });
  return pickCount(res);
};

/* ================= UI State ================= */
const selectedStat = ref(null); // "users" | "admins" | "balances" | "bookings"

/* ================= Users (paginated) ================= */
const itemsPerPageUsers = 10;
const currentPageUsers = ref(1);
const usersLoading = ref(false);
const usersList = ref([]);
const usersPages = ref(1);

const mapUserRow = (u) => ({
  id: u?.id ?? u?.user_id ?? u?._id,
  first_name: u?.first_name ?? u?.firstname ?? "",
  last_name: u?.last_name ?? u?.lastname ?? "",
  email: u?.email ?? "",
  phone: u?.phone ?? u?.phone_number ?? "",
  username: u?.username ?? u?.name ?? "",
  registered: fmtDate(u?.user_created_date ?? u?.created_at ?? u?.createdAt ?? null),
});

const fetchUsersPage = async () => {
  usersLoading.value = true;
  try {
    const filter = JSON.stringify({ where: "roles.title = 'user'" });
    const res = await $userStore.get(null, {
      params: { limit: itemsPerPageUsers, page: currentPageUsers.value, filter },
    });
    const arr = Array.isArray(res?.result)
      ? res.result
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    usersList.value = arr.map(mapUserRow);
    usersPages.value = Number(res?.pages ?? 1);
  } catch {
    usersList.value = [];
    usersPages.value = 1;
  } finally {
    usersLoading.value = false;
  }
};

const onClickUsersCard = async () => {
  selectedStat.value = selectedStat.value === "users" ? null : "users";
  currentPageUsers.value = 1;
  if (selectedStat.value === "users") await fetchUsersPage();
};
const prevUsers = async () => {
  if (currentPageUsers.value > 1) {
    currentPageUsers.value--;
    await fetchUsersPage();
  }
};
const nextUsers = async () => {
  if (currentPageUsers.value < usersPages.value) {
    currentPageUsers.value++;
    await fetchUsersPage();
  }
};
const handleDetailUser = (id) => router.push(`/super-admin/usermanagement/${id}`);

/* ================= Admins (paginated) ================= */
const itemsPerPageAdmins = 10;
const currentPageAdmins = ref(1);
const adminsLoading = ref(false);
const adminsList = ref([]);
const adminsPages = ref(1);

const fetchAdminsPage = async () => {
  adminsLoading.value = true;
  try {
    const filter = JSON.stringify({ where: "roles.title = 'admin'" });
    const res = await $userStore.get(null, {
      params: { limit: itemsPerPageAdmins, page: currentPageAdmins.value, filter },
    });
    const arr = Array.isArray(res?.result)
      ? res.result
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    adminsList.value = arr.map(mapUserRow);
    adminsPages.value = Number(res?.pages ?? 1);
  } catch {
    adminsList.value = [];
    adminsPages.value = 1;
  } finally {
    adminsLoading.value = false;
  }
};

const onClickAdminsCard = async () => {
  selectedStat.value = selectedStat.value === "admins" ? null : "admins";
  currentPageAdmins.value = 1;
  if (selectedStat.value === "admins") await fetchAdminsPage();
};
const prevAdmins = async () => {
  if (currentPageAdmins.value > 1) {
    currentPageAdmins.value--;
    await fetchAdminsPage();
  }
};
const nextAdmins = async () => {
  if (currentPageAdmins.value < adminsPages.value) {
    currentPageAdmins.value++;
    await fetchAdminsPage();
  }
};
const handleDetailAdmin = (id) => router.push(`/super-admin/adminmanagement/${id}`);

/* ================= Withdraw & Refund ================= */
const wdLoading = ref(false);
const withdrawList = ref([]); // admin
const refundList = ref([]); // user
const withdrawSum = computed(() => withdrawList.value.reduce((a, b) => a + (+b.amount || 0), 0));
const refundSum = computed(() => refundList.value.reduce((a, b) => a + (+b.amount || 0), 0));
const withdrawTotal = computed(() => withdrawList.value.length);
const refundTotal = computed(() => refundList.value.length);

const cardCache = new Map(); // cardId -> card detail
const userCache = new Map(); // userId -> user detail

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

const enrichWithdrawalRow = async (row) => {
  const cardId = row?.card?.id ?? row?.card_id ?? null;
  const card = await fetchCardById(cardId);
  const userId = card?.user_id || card?.user?.id || row?.card?.user?.id || null;
  const user = userId ? await fetchUserById(userId) : row?.card?.user ?? null;

  const roleName = (user?.role?.name || user?.role?.title || user?.role_title || "")
    .toString()
    .toLowerCase();

  return {
    id: row?.id,
    amount: row?.amount,
    status: row?.status,
    created: row?.createdDate ?? row?._created_date ?? null,
    card: {
      id: card?.id ?? cardId ?? null,
      cardNumber: card?.card_number ?? null,
      cardHolder: card?.card_holder ?? null,
      bankId: card?.bank_id ?? null,
      bank: card?.bank
        ? {
            id: card.bank?.id ?? card?.bank_id ?? null,
            title: card.bank?.title ?? null,
            code: card.bank?.code ?? null,
            icon: card.bank?.icon ?? null,
          }
        : null,
    },
    user: user
      ? {
          id: user?.id ?? null,
          username:
            user?.username ||
            user?.fullname ||
            user?.name ||
            (user?.email ? user.email.split("@")[0] : null) ||
            "-",
          picture: user?.picture || user?.avatar || null,
          role: {
            id: user?.role?.id || user?.role_id || null,
            name: roleName || null,
          },
        }
      : null,
    role_name: roleName || "",
  };
};

const fetchWithdrawRefund = async () => {
  wdLoading.value = true;
  try {
    const resp = await $api.get(`/withdrawals`, {
      params: { limit: 20, page: 1, filter: JSON.stringify({ order: "_created_date DESC" }) },
    });
    const rows = Array.isArray(resp?.result) ? resp.result : resp?.data ?? [];
    const enriched = await Promise.all(rows.map(enrichWithdrawalRow));
    withdrawList.value = enriched.filter((r) => r.role_name === "admin");
    refundList.value = enriched.filter((r) => r.role_name === "user");
  } catch {
    withdrawList.value = [];
    refundList.value = [];
  } finally {
    wdLoading.value = false;
  }
};

/* ================= Orders (Bookings) ================= */
/* — Robust resolve user full name — */
const ordersLoading = ref(false);
const orders = ref([]);
const ordersPage = ref(1);
const ordersLimit = 10;
const ordersTotal = ref(0);
const ordersPages = computed(() => Math.max(1, Math.ceil((ordersTotal.value || 0) / ordersLimit)));

const resolveUserFullname = (o) => {
  const u = o?.user;
  const first = u?.first_name ?? u?.firstname ?? "";
  const last = u?.last_name ?? u?.lastname ?? "";
  const combined = [first, last].filter(Boolean).join(" ");
  return (
    (!isEmptyText(combined) && combined) ||
    u?.full_name ||
    u?.fullname ||
    u?.display_name ||
    u?.username ||
    o?.user_fullname ||
    o?.userName ||
    o?.user_name ||
    "-"
  );
};

const mapOrderRow = (o) => ({
  id: o?.id,
  client_name: safeText(o?.client?.name ?? o?.client_name ?? ""),
  user_fullname: resolveUserFullname(o),
  start_date: o?.start_date,
  end_date: o?.end_date,
  total: o?.total,
  status: o?.status,
});

const fetchOrdersPage = async () => {
  ordersLoading.value = true;
  try {
    const res = await $userStore.get("/super-admin/orders", {
      params: { page: ordersPage.value, limit: ordersLimit },
    });
    const arr = Array.isArray(res?.result) ? res.result : res?.data ?? [];
    orders.value = arr.map(mapOrderRow);
    ordersTotal.value = Number(res?.meta?.total ?? res?.total ?? arr.length);
  } catch {
    orders.value = [];
    ordersTotal.value = 0;
  } finally {
    ordersLoading.value = false;
  }
};

/* ================= Prefetch & Toggle ================= */
const prefetchAll = async () => {
  await Promise.allSettled([
    fetchUsersPage(), // users page 1
    fetchAdminsPage(), // admins page 1
    fetchWithdrawRefund(), // withdraw & refund
    fetchOrdersPage(), // orders page 1
  ]);
};

const onClickBalanceCard = () => {
  const willOpen = selectedStat.value !== "balances";
  selectedStat.value = willOpen ? "balances" : null;
};

const onClickBookingsCard = () => {
  const willOpen = selectedStat.value !== "bookings";
  selectedStat.value = willOpen ? "bookings" : null;
};

const prevOrders = async () => {
  if (ordersPage.value > 1) {
    ordersPage.value--;
    await fetchOrdersPage();
  }
};
const nextOrders = async () => {
  if (ordersPage.value < ordersPages.value) {
    ordersPage.value++;
    await fetchOrdersPage();
  }
};
const gotoOrderDetail = (id) => router.push(`/super-admin/orders/${id}`);

/* ================= Mount ================= */
onMounted(async () => {
  try {
    const [adminCount, userCount] = await Promise.all([countByRole("admin"), countByRole("user")]);
    totalAdminRoleOnly.value = adminCount;
    totalUserRoleOnly.value = userCount;
  } catch {}

  // Prefetch semua data agar klik Balances/Bookings tidak refetch
  await prefetchAll();

  const _scope = $dataUser?.value?.scope;
  if (_scope?.includes?.("super-admin")) {
    if (route.path !== "/super-admin/") router.replace({ path: "/super-admin/" });
  } else {
    router.replace({ path: "/" });
  }
});
</script>

<template>
  <atoms-container>
    <section v-if="!$dataUser?.id">
      <n-skeleton height="150px" />
    </section>

    <section v-else>
      <br />
      <atoms-heading h2 class="mb-4 text-xl font-semibold">
        Welcome to Lombok Halal Room —
        <span class="font-bold text-primary">Super Admin Dashboard</span>,
        <span class="font-bold text-primary">{{
          safeText($dataUser?.username) || "Super Admin"
        }}</span>
      </atoms-heading>

      <!-- Stats -->
      <section class="grid grid-cols-1 gap-5 py-5 md:grid-cols-4">
        <!-- Users -->
        <n-card
          :class="[
            'cursor-pointer transition-all',
            selectedStat === 'users'
              ? 'border-2 border-primary bg-primary/10'
              : 'hover:bg-primary/5',
          ]"
          @click="onClickUsersCard"
        >
          <atoms-icon name="account" size="30" class="text-primary" />
          <atoms-text class="text-xl font-bold">{{ totalUserRoleOnly || 0 }}</atoms-text>
          <atoms-text caption>Total Users</atoms-text>
        </n-card>

        <!-- Admins -->
        <n-card
          :class="[
            'cursor-pointer transition-all',
            selectedStat === 'admins'
              ? 'border-2 border-primary bg-primary/10'
              : 'hover:bg-primary/5',
          ]"
          @click="onClickAdminsCard"
        >
          <atoms-icon name="shield-account" size="30" class="text-primary" />
          <atoms-text class="text-xl font-bold">{{ totalAdminRoleOnly || 0 }}</atoms-text>
          <atoms-text caption>Total Admins</atoms-text>
        </n-card>

        <!-- Balances -->
        <n-card
          :class="[
            'cursor-pointer transition-all',
            selectedStat === 'balances'
              ? 'border-2 border-primary bg-primary/10'
              : 'hover:bg-primary/5',
          ]"
          @click="onClickBalanceCard"
        >
          <atoms-icon name="wallet" size="30" class="text-primary" />
          <atoms-text class="text-lg font-semibold">
            Withdraw: {{ withdrawTotal }} • {{ fmtMoney(withdrawSum) }}
          </atoms-text>
          <atoms-text class="text-lg font-semibold">
            Refund: {{ refundTotal }} • {{ fmtMoney(refundSum) }}
          </atoms-text>
          <atoms-text caption>Balances</atoms-text>
        </n-card>

        <!-- Bookings -->
        <n-card
          :class="[
            'cursor-pointer transition-all',
            selectedStat === 'bookings'
              ? 'border-2 border-primary bg-primary/10'
              : 'hover:bg-primary/5',
          ]"
          @click="onClickBookingsCard"
        >
          <atoms-icon name="calendar-month" size="30" class="text-primary" />
          <atoms-text class="text-xl font-bold">{{ ordersTotal }}</atoms-text>
          <atoms-text caption>Total Orders</atoms-text>
        </n-card>
      </section>

      <!-- Balances panel -->
      <section
        v-if="selectedStat === 'balances'"
        class="p-4 mt-4 border shadow border-primary bg-primary/10 rounded-xl"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <atoms-heading h3 class="mb-0">Withdraw & Refund — Latest</atoms-heading>
          <n-button size="small" @click="fetchWithdrawRefund">Refresh</n-button>
        </div>

        <div v-if="wdLoading" class="space-y-3">
          <n-skeleton height="20px" />
          <n-skeleton height="20px" />
          <n-skeleton height="20px" />
        </div>

        <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- Withdraw (Admin) -->
          <n-card size="small" class="overflow-hidden">
            <template #header>
              <div class="flex items-center justify-between w-full">
                <b>Withdraw (Admin)</b>
                <atoms-text caption
                  >Count: {{ withdrawTotal }} • {{ fmtMoney(withdrawSum) }}</atoms-text
                >
              </div>
            </template>

            <table class="w-full text-sm border border-gray-200">
              <thead>
                <tr class="text-left bg-primary/10">
                  <th class="p-2">User</th>
                  <th class="p-2">Date</th>
                  <th class="p-2">Amount</th>
                  <th class="p-2">Status</th>
                  <th class="p-2">Card</th>
                  <th class="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="w in withdrawList.slice(0, 10)" :key="w.id" class="hover:bg-primary/5">
                  <td class="p-2">
                    <div class="flex items-center gap-2">
                      <atoms-avatar
                        :src="w?.user?.picture || PLACEHOLDER_IMG"
                        :zoom="false"
                        sizes="24"
                        :nickname="w?.user?.username || 'user'"
                      />
                      <div class="flex flex-col">
                        <atoms-text>{{ safeText(w?.user?.username) }}</atoms-text>
                        <atoms-text caption>{{ safeText(w?.user?.role?.name) }}</atoms-text>
                      </div>
                    </div>
                  </td>
                  <td class="p-2">{{ fmtDate(w.created) }}</td>
                  <td class="p-2">{{ fmtMoney(w.amount) }}</td>
                  <td class="p-2">
                    <n-tag :type="wdStatusType(w.status)" round :bordered="false">
                      {{ (w.status || "-").toUpperCase() }}
                    </n-tag>
                  </td>
                  <td class="p-2">
                    <div class="flex flex-col">
                      <atoms-text>{{ maskCardNo(w?.card?.cardNumber) }}</atoms-text>
                      <atoms-text caption>{{ safeText(w?.card?.cardHolder) }}</atoms-text>
                    </div>
                  </td>
                  <td class="p-2">
                    <n-button size="small" @click="router.push(`/super-admin/withdrawals/${w.id}`)"
                      >View</n-button
                    >
                  </td>
                </tr>
                <tr v-if="withdrawList.length === 0">
                  <td colspan="6" class="p-3 text-center text-gray-500">No data.</td>
                </tr>
              </tbody>
            </table>
          </n-card>

          <!-- Refund (User) -->
          <n-card size="small" class="overflow-hidden">
            <template #header>
              <div class="flex items-center justify-between w-full">
                <b>Refund (User)</b>
                <atoms-text caption
                  >Count: {{ refundTotal }} • {{ fmtMoney(refundSum) }}</atoms-text
                >
              </div>
            </template>

            <table class="w-full text-sm border border-gray-200">
              <thead>
                <tr class="text-left bg-primary/10">
                  <th class="p-2">User</th>
                  <th class="p-2">Date</th>
                  <th class="p-2">Amount</th>
                  <th class="p-2">Status</th>
                  <th class="p-2">Card</th>
                  <th class="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in refundList.slice(0, 10)" :key="r.id" class="hover:bg-primary/5">
                  <td class="p-2">
                    <div class="flex items-center gap-2">
                      <atoms-avatar
                        :src="r?.user?.picture || PLACEHOLDER_IMG"
                        :zoom="false"
                        sizes="24"
                        :nickname="r?.user?.username || 'user'"
                      />
                      <div class="flex flex-col">
                        <atoms-text>{{ safeText(r?.user?.username) }}</atoms-text>
                        <atoms-text caption>{{ safeText(r?.user?.role?.name) }}</atoms-text>
                      </div>
                    </div>
                  </td>
                  <td class="p-2">{{ fmtDate(r.created) }}</td>
                  <td class="p-2">{{ fmtMoney(r.amount) }}</td>
                  <td class="p-2">
                    <n-tag :type="wdStatusType(r.status)" round :bordered="false">
                      {{ (r.status || "-").toUpperCase() }}
                    </n-tag>
                  </td>
                  <td class="p-2">
                    <div class="flex flex-col">
                      <atoms-text>{{ maskCardNo(r?.card?.cardNumber) }}</atoms-text>
                      <atoms-text caption>{{ safeText(r?.card?.cardHolder) }}</atoms-text>
                    </div>
                  </td>
                  <td class="p-2">
                    <n-button size="small" @click="router.push(`/super-admin/refunds/${r.id}`)"
                      >View</n-button
                    >
                  </td>
                </tr>
                <tr v-if="refundList.length === 0">
                  <td colspan="6" class="p-3 text-center text-gray-500">No data.</td>
                </tr>
              </tbody>
            </table>
          </n-card>
        </div>
      </section>

      <!-- Users panel -->
      <section
        v-if="selectedStat === 'users'"
        class="p-4 mt-4 shadow border-primary bg-primary/10 rounded-xl"
      >
        <atoms-heading h3 class="mb-4">Users</atoms-heading>

        <div v-if="usersLoading" class="space-y-3">
          <n-skeleton height="20px" />
          <n-skeleton height="20px" />
          <n-skeleton height="20px" />
        </div>

        <table v-else class="w-full text-sm border border-gray-200">
          <thead>
            <tr class="text-left bg-primary/10">
              <th class="p-2">Name</th>
              <th class="p-2">Email</th>
              <th class="p-2">Phone</th>
              <th class="p-2">Username</th>
              <th class="p-2">Registered</th>
              <th class="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in usersList" :key="item.id" class="hover:bg-primary/5">
              <td class="p-2">
                {{ [item.first_name, item.last_name].filter(Boolean).join(" ") || "-" }}
              </td>
              <td class="p-2">{{ safeText(item.email) }}</td>
              <td class="p-2">{{ safeText(item.phone) }}</td>
              <td class="p-2">{{ safeText(item.username) }}</td>
              <td class="p-2">{{ safeText(item.registered) }}</td>
              <td class="flex gap-2 p-2">
                <n-button size="small" tertiary @click="handleDetailUser(item.id)">View</n-button>
              </td>
            </tr>
            <tr v-if="!usersLoading && usersList.length === 0">
              <td colspan="6" class="p-4 text-center text-gray-500">No data.</td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between mt-4">
          <n-button @click="prevUsers" :disabled="currentPageUsers === 1">Previous</n-button>
          <span class="text-sm text-gray-600">Page {{ currentPageUsers }} / {{ usersPages }}</span>
          <n-button @click="nextUsers" :disabled="currentPageUsers >= usersPages">Next</n-button>
        </div>
      </section>

      <!-- Admins panel -->
      <section
        v-if="selectedStat === 'admins'"
        class="p-4 mt-4 shadow border-primary bg-primary/10 rounded-xl"
      >
        <atoms-heading h3 class="mb-4">Admins</atoms-heading>

        <div v-if="adminsLoading" class="space-y-3">
          <n-skeleton height="20px" />
          <n-skeleton height="20px" />
          <n-skeleton height="20px" />
        </div>

        <table v-else class="w-full text-sm border border-gray-200">
          <thead>
            <tr class="text-left bg-primary/10">
              <th class="p-2">Name</th>
              <th class="p-2">Email</th>
              <th class="p-2">Phone</th>
              <th class="p-2">Username</th>
              <th class="p-2">Registered</th>
              <th class="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in adminsList" :key="item.id" class="hover:bg-primary/5">
              <td class="p-2">
                {{ [item.first_name, item.last_name].filter(Boolean).join(" ") || "-" }}
              </td>
              <td class="p-2">{{ safeText(item.email) }}</td>
              <td class="p-2">{{ safeText(item.phone) }}</td>
              <td class="p-2">{{ safeText(item.username) }}</td>
              <td class="p-2">{{ safeText(item.registered) }}</td>
              <td class="flex gap-2 p-2">
                <n-button size="small" tertiary @click="handleDetailAdmin(item.id)">View</n-button>
              </td>
            </tr>
            <tr v-if="!adminsLoading && adminsList.length === 0">
              <td colspan="6" class="p-4 text-center text-gray-500">No data.</td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between mt-4">
          <n-button @click="prevAdmins" :disabled="currentPageAdmins === 1">Previous</n-button>
          <span class="text-sm text-gray-600"
            >Page {{ currentPageAdmins }} / {{ adminsPages }}</span
          >
          <n-button @click="nextAdmins" :disabled="currentPageAdmins >= adminsPages">Next</n-button>
        </div>
      </section>

      <!-- Orders panel -->
      <section
        v-if="selectedStat === 'bookings'"
        class="p-4 mt-4 shadow border-primary bg-primary/10 rounded-xl"
      >
        <div class="flex items-center justify-between mb-3">
          <atoms-heading h3 class="mb-0">Orders</atoms-heading>
          <n-button size="small" @click="fetchOrdersPage">Refresh</n-button>
        </div>

        <div v-if="ordersLoading" class="space-y-3">
          <n-skeleton height="20px" />
          <n-skeleton height="20px" />
          <n-skeleton height="20px" />
        </div>

        <table v-else class="w-full text-sm border border-gray-200">
          <thead>
            <tr class="text-left bg-primary/10">
              <th class="p-2">Client</th>
              <th class="p-2">User</th>
              <th class="p-2">Start</th>
              <th class="p-2">End</th>
              <th class="p-2">Total</th>
              <th class="p-2">Status</th>
              <th class="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in orders" :key="row.id" class="hover:bg-primary/5">
              <td class="p-2">{{ safeText(row.client_name) }}</td>
              <td class="p-2">{{ safeText(row.user_fullname) }}</td>
              <td class="p-2">{{ fmtDate(row.start_date) }}</td>
              <td class="p-2">{{ fmtDate(row.end_date) }}</td>
              <td class="p-2">{{ fmtMoney(row.total) }}</td>
              <td class="p-2">
                <n-tag :type="orderStatusType(row.status)" round :bordered="false">
                  {{ (row.status || "-").toUpperCase() }}
                </n-tag>
              </td>
              <td class="p-2">
                <n-button size="small" type="primary" @click="gotoOrderDetail(row.id)"
                  >View</n-button
                >
              </td>
            </tr>
            <tr v-if="!ordersLoading && orders.length === 0">
              <td colspan="8" class="p-4 text-center text-gray-500">No data.</td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between mt-4">
          <n-button @click="prevOrders" :disabled="ordersPage === 1">Previous</n-button>
          <span class="text-sm text-gray-600">Page {{ ordersPage }} / {{ ordersPages }}</span>
          <n-button @click="nextOrders" :disabled="ordersPage >= ordersPages">Next</n-button>
        </div>
      </section>
    </section>
  </atoms-container>
</template>
