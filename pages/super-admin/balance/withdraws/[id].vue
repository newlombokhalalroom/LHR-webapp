<!-- pages/super-admin/withdrawals/[id].vue -->
<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { NCard, NButton, NSelect, NTag, NSkeleton, useMessage, useLoadingBar } from "naive-ui";
import { useUserStore } from "@/store/user";
import useApi from "@/composables/useApi";

const { $api } = useApi();

definePageMeta({
  path: "/super-admin/withdrawals/:id",
  label: "Withdrawal Detail",
  title: "Withdrawal Detail",
  icon: "wallet",
  hidden: true,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const route = useRoute();
const router = useRouter();
const $message = useMessage();
const $loadingBar = useLoadingBar();
const $userStore = useUserStore();

const wid = computed(() => String(route.params.id || "").trim());

const isEmpty = (v) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");
const safeText = (v) => (isEmpty(v) ? "-" : v);

const fmtRp = (v) =>
  v === null || v === undefined || v === "" ? "-" : "Rp " + Number(v).toLocaleString("id-ID");
const fmtDate = (v) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

const maskCard = (num) => {
  if (!num) return "-";
  const s = String(num);
  return s.length <= 4 ? s : "**** " + s.slice(-4);
};

const statusTagType = (s) => {
  switch ((s || "").toString().toLowerCase()) {
    case "success":
    case "approved":
    case "done":
      return "success";
    case "pending":
    case "process":
    case "progress":
    case "procces":
      return "warning";
    case "cancelled":
    case "canceled":
    case "rejected":
      return "error";
    default:
      return "default";
  }
};

/* ============== State ============== */
const loading = ref(false);
const saving = ref(false);
const refreshing = ref(false);

const item = reactive({
  id: "",
  amount: null,
  status: "",
  _created_date: null,
  _updated_date: null,
  card: {
    id: "",
    bank_id: "",
    card_number: "",
    card_holder: "",
    bank: { id: "", code: "", title: "", icon: null },
    user: { id: "", username: "", role_title: "", picture: null },
  },
});
const statusSel = ref(null);

/* Balance (Platform + Aktor penarik dana) */
const superBalanceLoading = ref(false);
const superBalance = ref(null);

const actorBalanceLoading = ref(false);
const actorBalance = ref(null); // akan berisi object balance {id, user_id, amount, _created_date, _updated_date}

/* ============== Mappers ============== */
const mapDetail = (x) => {
  const card = x?.card || {};
  const bank = card?.bank || {};
  const u = card?.user || {};
  return {
    id: x?.id ?? "",
    amount: x?.amount ?? null,
    status: x?.status ?? "",
    _created_date: x?._created_date ?? x?.createdDate ?? null,
    _updated_date: x?._updated_date ?? x?.updatedDate ?? null,
    card: {
      id: card?.id ?? x?.card_id ?? "",
      bank_id: card?.bank_id ?? "",
      card_number: card?.card_number ?? "",
      card_holder: card?.card_holder ?? "",
      bank: {
        id: bank?.id ?? "",
        code: bank?.code ?? "",
        title: bank?.title ?? "",
        icon: bank?.icon ?? null,
      },
      user: {
        id: u?.id ?? "",
        username:
          u?.username ||
          u?.fullname ||
          u?.name ||
          (u?.email ? String(u.email).split("@")[0] : "") ||
          "",
        role_title: u?.role_title ?? "",
        picture: u?.picture || u?.avatar || null,
      },
    },
  };
};

/* ============== API ============== */
const canMutate = computed(() => (item.status || "").toLowerCase() === "pending");

const STATUS_OPTIONS = [
  { label: "Cancelled", value: "cancelled" },
  { label: "Success", value: "success" },
];

const fetchDetail = async () => {
  if (!wid.value) return;
  loading.value = true;
  $loadingBar.start();
  try {
    // ✅ pakai $api (withdrawals resource)
    const res = await $api.get(`/withdrawals/${wid.value}`);
    const raw = res?.result ?? res?.data ?? res;
    if (!raw?.id) throw new Error("Data tidak ditemukan");

    const mapped = mapDetail(raw);
    Object.assign(item, mapped);

    // default pilihan status: kosong dulu (biar user pilih)
    statusSel.value = null;
  } catch (e) {
    console.error(e);
    $message.error(e?.response?.data?.message || e?.message || "Gagal memuat detail withdrawal.");
  } finally {
    loading.value = false;
    $loadingBar.finish();
  }
};

const fetchSuperBalance = async () => {
  superBalanceLoading.value = true;
  try {
    // ini balance milik user login (super-admin)
    const resp = await $userStore.get("balances");
    superBalance.value = resp?.result ?? resp?.data ?? resp ?? null;
  } catch (e) {
    superBalance.value = null;
  } finally {
    superBalanceLoading.value = false;
  }
};

const fetchActorBalance = async () => {
  actorBalanceLoading.value = true;
  try {
    const uid = item?.card?.user?.id;
    if (!uid) {
      actorBalance.value = null;
      return;
    }

    // sesuaikan dengan endpoint kamu:
    const resp = await $api.get(`/super-admin/balances/${uid}`);
    const bal = resp?.result?.balance ?? resp?.result ?? resp?.balance ?? resp?.data ?? null;
    actorBalance.value = bal;
  } catch (e) {
    actorBalance.value = null;
  } finally {
    actorBalanceLoading.value = false;
  }
};

const refreshAll = async () => {
  refreshing.value = true;
  try {
    await fetchDetail();
    await Promise.all([fetchSuperBalance(), fetchActorBalance()]);
  } finally {
    refreshing.value = false;
  }
};

const updateStatus = async () => {
  if (!item.id) return;

  // ✅ hanya boleh ubah kalau pending
  if (!canMutate.value) {
    $message.warning("Status hanya bisa diubah saat masih pending.");
    return;
  }

  // ✅ status harus dipilih
  if (!statusSel.value) {
    $message.warning("Pilih status terlebih dahulu.");
    return;
  }

  // ✅ konfirmasi
  if (!confirm(`Yakin ubah status menjadi "${statusSel.value}"?`)) return;

  saving.value = true;
  $loadingBar.start();
  try {
    // ✅ pakai $api untuk withdrawals
    const res = await $api.put(`/withdrawals/${item.id}`, { status: statusSel.value });

    $message.success(res?.message || "Status updated.");

    // refresh detail + balances (refund terjadi server-side jika cancelled)
    await refreshAll();
  } catch (e) {
    console.error(e);
    const msg =
      e?.response?.data?.message || e?.data?.message || e?.message || "Gagal mengubah status.";
    $message.error(msg);
  } finally {
    saving.value = false;
    $loadingBar.finish();
  }
};

/* ============== Lifecycle ============== */
onMounted(refreshAll);
watch(
  () => wid.value,
  () => refreshAll(),
);
</script>

<template>
  <atoms-container>
    <!-- Status & ID -->
    <section class="flex flex-wrap items-center justify-between gap-3 mb-2">
      <div class="flex items-center gap-2">
        <atoms-text caption strong>ID:</atoms-text>
        <atoms-text>{{ safeText(item.id) }}</atoms-text>
      </div>
      <n-tag :type="statusTagType(item.status)" round :bordered="false">
        {{ (item.status || "-").toUpperCase() }}
      </n-tag>
    </section>

    <n-card class="shadow-sm rounded-2xl" :segmented="{ content: true, footer: true }">
      <n-skeleton v-if="loading" text :repeat="8" />
      <template v-else>
        <!-- GRID: Summary / User+Card / Balances -->
        <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <!-- Summary -->
          <n-card size="small" class="rounded-xl">
            <template #header>
              <atoms-heading h5 class="mb-0">Summary</atoms-heading>
            </template>
            <div class="space-y-2">
              <div>
                <atoms-text caption strong>Amount</atoms-text>
                <atoms-text>{{ fmtRp(item.amount) }}</atoms-text>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <atoms-text caption strong>Created</atoms-text>
                  <atoms-text>{{ fmtDate(item._created_date) }}</atoms-text>
                </div>
                <div>
                  <atoms-text caption strong>Updated</atoms-text>
                  <atoms-text>{{ fmtDate(item._updated_date) }}</atoms-text>
                </div>
              </div>
            </div>
          </n-card>

          <n-card size="small" class="rounded-xl">
            <div class="flex items-start gap-3 mb-3">
              <template v-if="item.card?.user?.picture">
                <atoms-avatar
                  :src="item.card.user.picture"
                  :zoom="false"
                  sizes="44"
                  :nickname="item.card?.user?.username || 'user'"
                />
              </template>
              <template v-else>
                <div class="flex items-center justify-center bg-gray-100 rounded-full w-11 h-11">
                  <atoms-icon name="account" :size="22" class="text-gray-400" />
                </div>
              </template>

              <div class="min-w-0">
                <atoms-text class="truncate">{{ safeText(item.card?.user?.username) }}</atoms-text>
                <div class="flex items-center gap-2">
                  <n-tag
                    v-if="item.card?.user?.role_title"
                    size="small"
                    :type="
                      (item.card?.user?.role_title || '').toLowerCase() === 'admin'
                        ? 'success'
                        : 'default'
                    "
                    round
                    :bordered="false"
                  >
                    {{ item.card?.user?.role_title }}
                  </n-tag>
                  <atoms-text caption>ID: {{ safeText(item.card?.user?.id) }}</atoms-text>
                </div>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <template v-if="item.card?.bank?.icon">
                <img :src="item.card.bank.icon" alt="bank" class="object-cover w-10 h-10 rounded" />
              </template>
              <template v-else>
                <div class="flex items-center justify-center w-10 h-10 bg-gray-100 rounded">
                  <atoms-icon name="credit-card" :size="18" class="text-gray-400" />
                </div>
              </template>

              <div class="min-w-0">
                <atoms-text caption strong>Bank</atoms-text>
                <atoms-text>
                  {{ safeText(item.card?.bank?.title) }}
                  <span v-if="item.card?.bank?.code"> ({{ item.card.bank.code }})</span>
                </atoms-text>
                <atoms-text caption>Card: {{ item.card?.card_number }}</atoms-text>
                <atoms-text caption>Holder: {{ safeText(item.card?.card_holder) }}</atoms-text>
                <atoms-text caption>ID: {{ safeText(item.card?.id) }}</atoms-text>
              </div>
            </div>
          </n-card>

          <!-- Balances -->
          <section class="flex flex-col gap-4">
            <!-- Platform Balance (plain text, tanpa font tambahan) -->
            <n-card size="small" class="rounded-xl">
              <template #header>
                <atoms-heading h5 class="mb-0">Platform Balance</atoms-heading>
              </template>
              <div class="space-y-1">
                <atoms-text caption strong>Current</atoms-text>
                <atoms-text>
                  {{ superBalanceLoading ? "Loading..." : fmtRp(superBalance?.amount || 0) }}
                </atoms-text>
                <atoms-text caption>Updated: {{ fmtDate(superBalance?._updated_date) }}</atoms-text>
              </div>
            </n-card>

            <!-- Actor Balance (tanpa font tambahan) -->
            <n-card v-if="actorBalanceLoading" size="small" class="rounded-xl">
              <NSkeleton text :repeat="3" />
            </n-card>

            <n-card v-else-if="actorBalance" size="small" class="rounded-xl border-primary/20">
              <template #header>
                <atoms-heading h5 class="mb-0">Actor Balance (Requester)</atoms-heading>
              </template>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <atoms-text caption strong>Available</atoms-text>
                  <atoms-text>{{ fmtRp(actorBalance?.amount) }}</atoms-text>
                </div>
                <div>
                  <atoms-text caption strong>Updated</atoms-text>
                  <atoms-text>{{ fmtDate(actorBalance?._updated_date) }}</atoms-text>
                </div>
              </div>
            </n-card>

            <n-card v-else size="small" class="rounded-xl">
              <atoms-text>Balance tidak tersedia.</atoms-text>
            </n-card>
          </section>
        </section>

        <atoms-divider class="my-4" />

        <!-- Single place to update status -->
        <section class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-3">
            <atoms-text caption strong>Change Status</atoms-text>
            <n-select
              v-model:value="statusSel"
              :options="STATUS_OPTIONS"
              style="min-width: 220px"
              :disabled="saving || !canMutate"
            />

            <n-button
              type="primary"
              :loading="saving"
              :disabled="!statusSel || !canMutate"
              @click="updateStatus"
            >
              Update
            </n-button>

            <n-alert v-if="!canMutate" type="warning" class="mt-2">
              Status sudah <b>{{ item.status }}</b
              >. Perubahan hanya diizinkan saat <b>pending</b>.
            </n-alert>
          </div>
        </section>
      </template>

      <template #footer>
        <div class="flex items-center justify-between">
          <atoms-text caption>Pastikan perubahan status sesuai SOP keuangan.</atoms-text>
          <div class="flex items-center gap-2">
            <n-button size="small" secondary :loading="refreshing" @click="refreshAll"
              >Refresh</n-button
            >
            <n-button size="small" quaternary @click="router.back()">Back</n-button>
          </div>
        </div>
      </template>
    </n-card>
  </atoms-container>
</template>
