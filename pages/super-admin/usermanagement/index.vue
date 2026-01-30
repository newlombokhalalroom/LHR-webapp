<!-- pages/super-admin/usermanagement/index.vue -->
<script setup>
import {
  NButton,
  NDataTable,
  NPagination,
  NModal,
  NForm,
  NFormItem,
  NInput,
  useMessage,
  NSelect,
} from "naive-ui";
import { h, reactive, ref, computed, onMounted, watch, resolveComponent } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";

/* ========== META & GUARD ========== */
definePageMeta({
  path: "/super-admin/usermanagement",
  label: "User Management",
  title: "User Management",
  order: 0,
  icon: "account",
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

/* ========== ROUTER & STORE ========== */
const router = useRouter();
const $userStore = useUserStore();
const $message = useMessage();

/* ========== STATE ========== */
const $local = reactive({
  page: 1,
  itemsPerPage: 10,
  search: "",
});
const loading = ref(false);
const users = ref([]); // data 1 halaman dari server
const pages = ref(1); // total halaman server
const totalAll = ref(0); // total seluruh data (jika backend mengirim)

/* ========== HELPERS ========== */
const dash = (v) => (v === null || v === undefined || String(v).trim() === "" ? "-" : v);
const fmtDate = (v) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

const normalizePic = (p) => {
  const s = (p ?? "").toString().trim().toLowerCase();
  // anggap "", "null", "undefined" sebagai ketiadaan gambar -> null (agar placeholder dipakai)
  if (!s || s === "null" || s === "undefined") return null;
  return p;
};

const cryptoRandomId = () =>
  (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 16);

/** Normalisasi 1 baris user agar field konsisten */
const mapRow = (u) => ({
  id: u?.id ?? u?.user_id ?? u?._id ?? cryptoRandomId(),
  picture: normalizePic(u?.picture ?? u?.avatar),
  username: u?.username ?? u?.name ?? "",
  email: u?.email ?? "",
  phone: u?.phone ?? u?.phone_number ?? "",
  role:
    u?.role?.title ??
    u?.role?.name ??
    u?.role ??
    u?.roles?.[0]?.title ??
    (Array.isArray(u?.roles) ? u.roles.join(", ") : "") ??
    "",
  user_created_date: u?.user_created_date ?? u?.created_at ?? u?.createdAt ?? null,
  user_updated_date: u?.user_updated_date ?? u?.updated_at ?? u?.updatedAt ?? null,
});

/* ========== FETCH (server-side pagination) ========== */
const fetchUsers = async () => {
  loading.value = true;
  try {
    // Hanya role 'user'
    const filter = JSON.stringify({ where: "roles.title = 'user'" });

    const res = await $userStore.get(null, {
      params: {
        limit: $local.itemsPerPage,
        page: $local.page,
        filter,
      },
    });

    const arr = Array.isArray(res?.result)
      ? res.result
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

    users.value = arr.map(mapRow);
    pages.value = Number(res?.pages ?? 1);
    if (typeof res?.count === "number") totalAll.value = res.count;
    else if (typeof res?.meta?.total === "number") totalAll.value = res.meta.total;
  } catch (e) {
    console.error("fetch users error:", e);
    users.value = [];
    pages.value = 1;
  } finally {
    loading.value = false;
  }
};

/* ========== SEARCH (client-side pada halaman aktif) ========== */
const filteredUsers = computed(() => {
  const q = $local.search.trim().toLowerCase();
  if (!q) return users.value;
  return users.value.filter((u) => {
    const username = (u.username || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const phone = (u.phone || "").toLowerCase();
    const role = (u.role || "").toLowerCase();
    return username.includes(q) || email.includes(q) || phone.includes(q) || role.includes(q);
  });
});

/* Data untuk tabel memakai hasil filter (halaman aktif) */
const tableData = computed(() => filteredUsers.value);

/* Pagination mengikuti dari backend */
const pageCount = computed(() => pages.value);

/* ========== TABLE COLUMNS ========== */
/** Penting: resolve komponen agar h() menerima objek komponennya, bukan string tag */
const AtomsAvatar = resolveComponent("atoms-avatar");

const columns = [
  {
    title: "User",
    key: "user",
    minWidth: 220,
    render(row) {
      return h("div", { class: "flex items-center gap-3" }, [
        h("div", { class: "shrink-0" }, [
          h(AtomsAvatar, {
            src: row.picture, // null => placeholder avatar bawaan akan tampil
            sizes: "36",
            zoom: false,
            nickname: row.username || "user",
          }),
        ]),
        h("div", { class: "min-w-0" }, [
          h("div", { class: "font-medium truncate" }, row.username || "-"),
          h("div", { class: "text-xs text-gray-500 truncate" }, row.email || "-"),
        ]),
      ]);
    },
  },
  { title: "Phone", key: "phone", render: (r) => h("span", dash(r.phone)) },
  {
    title: "Created",
    key: "user_created_date",
    render: (r) => h("span", fmtDate(r.user_created_date)),
  },
  {
    title: "Updated",
    key: "user_updated_date",
    render: (r) => h("span", fmtDate(r.user_updated_date)),
  },
  {
    title: "Action",
    key: "actions",
    width: 120,
    render(row) {
      return h(
        NButton,
        { size: "small", onClick: () => handleDetail(row.id) },
        { default: () => "Detail" },
      );
    },
  },
];

/* ========== MODAL ADD USER (dummy) ========== */
const modalVisible = ref(false);
const submitting = ref(false);

const roleOptions = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
];

const form = reactive({
  role: "user",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});
const openAddModal = () => {
  Object.assign(form, { role: "user", username: "", email: "", password: "", confirmPassword: "" });
  modalVisible.value = true;
};

const closeModal = () => {
  modalVisible.value = false;
  submitting.value = false;
};
const submitUser = async () => {
  if (!form.username || !form.email || !form.password || !form.confirmPassword) {
    return $message.warning("Semua field wajib diisi");
  }
  if (form.password !== form.confirmPassword) {
    return $message.error("Password tidak cocok");
  }

  submitting.value = true;
  try {
    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      picture: null,
      // if be  menerima:
      // phone: null,
      // first_name: null,
      // last_name: null,
    };

    const res = await $userStore.postSuperAdminUserByRole(form.role, payload);

    $message.success(res?.message || `Berhasil menambahkan ${form.role}`);
    closeModal();
    $local.page = 1;
    await fetchUsers();
  } catch (e) {
    console.error("❌ create user error:", e);
    const msg =
      e?.response?.data?.message || e?.data?.message || e?.message || "Gagal menambahkan user";
    $message.error(msg);
  } finally {
    submitting.value = false;
  }
};

/* ========== EVENTS ========== */
const handleDetail = (id) => {
  router.push(`/super-admin/usermanagement/${id}`);
};

/* ganti halaman => refetch server-side */
watch(
  () => $local.page,
  () => fetchUsers(),
);

/* INIT */
onMounted(fetchUsers);
</script>

<template>
  <atoms-container>
    <section class="flex items-center justify-between gap-3 mb-4">
      <atoms-heading h3 class="mb-0">User Management</atoms-heading>
      <div class="flex items-center gap-3">
        <n-input
          v-model:value="$local.search"
          placeholder="Search username / email / phone / role…"
          class="w-72"
          clearable
        />
        <n-button type="primary" @click="openAddModal">Add User</n-button>
      </div>
    </section>

    <n-data-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :bordered="true"
      striped
      size="small"
      :row-key="(r) => r.id"
    />

    <div class="flex items-center justify-between mt-6">
      <span class="text-sm text-gray-500">
        Showing {{ tableData.length }} of {{ totalAll || tableData.length }} users
      </span>
      <n-pagination v-model:page="$local.page" :page-count="pageCount" />
    </div>

    <n-modal v-model:show="modalVisible" title="Add New User" preset="dialog">
      <n-form :model="form" label-placement="top">
        <n-form-item label="Role">
          <n-select v-model:value="form.role" :options="roleOptions" placeholder="Pilih role" />
        </n-form-item>

        <n-form-item label="Username">
          <n-input v-model:value="form.username" placeholder="Enter username" />
        </n-form-item>

        <n-form-item label="Email">
          <n-input v-model:value="form.email" placeholder="Enter email" />
        </n-form-item>

        <n-form-item label="Password">
          <n-input v-model:value="form.password" placeholder="Enter password" type="password" />
        </n-form-item>

        <n-form-item label="Confirm Password">
          <n-input
            v-model:value="form.confirmPassword"
            placeholder="Confirm password"
            type="password"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-button @click="closeModal" :disabled="submitting">Cancel</n-button>
        <n-button type="primary" class="ml-2" @click="submitUser" :loading="submitting">
          Submit
        </n-button>
      </template>
    </n-modal>
  </atoms-container>
</template>
