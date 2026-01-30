<!-- pages/super-admin/hospitality-config/facilities.vue -->
<script setup>
import {
  NButton,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  useMessage,
  useNotification,
} from "naive-ui";
import { ref, reactive, onMounted, h, computed } from "vue";
import { useUserStore } from "@/store/user";

definePageMeta({
  path: "/super-admin/hospitality-config/facilities",
  label: "Facilities",
  hidden: true,
  icon: "building",
  order: 4,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const $message = useMessage();
const $notification = useNotification();
const $userStore = useUserStore();

/* ---------- constants ---------- */
const FACILITIES_BASE = "/facilities";
const TYPES_ENDPOINT = "/facilities/types"; // ⬅️ ambil dari data type yang SUDAH ADA
const CATEGORY_OPTIONS = [
  { label: "halal", value: "halal" },
  { label: "regular", value: "regular" },
];

/* ---------- state ---------- */
const loading = ref(false);
const saving = ref(false);
const facilities = ref([]);
const modalVisible = ref(false);
const isEditMode = ref(false);

const form = reactive({
  id: null,
  type: "",
  title: "",
  category: "",
});

const search = ref("");
const filterType = ref(null);
const filterCategory = ref(null);

/* type options dari server / fallback dari facilities */
const typeOptions = ref([]);
const typeOptionsLoading = ref(false);
const allowFreeType = ref(false); // true jika tidak ada data type sama sekali

/* ---------- utils ---------- */
const dash = (v) => (v === null || v === undefined || String(v).trim() === "" ? "—" : v);
const formatDate = (val) =>
  val ? new Date(val).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

/** Ambil ID aman dari berbagai bentuk field */
const getItemId = (row) =>
  row?.id || row?.facility_id || row?.facilityId || row?.facilityID || null;

/** Normalisasi respons list facilities */
const parseFacilities = (res) => {
  if (Array.isArray(res?.data?.facilities)) return res.data.facilities;
  if (Array.isArray(res?.result?.facilities)) return res.result.facilities;
  if (Array.isArray(res?.result)) return res.result;
  if (Array.isArray(res)) return res;
  return [];
};

/** Normalisasi respons types → array of label string */
const parseTypesAsLabels = (res) => {
  const rows = Array.isArray(res?.result?.types)
    ? res.result.types
    : Array.isArray(res?.data?.types)
    ? res.data.types
    : Array.isArray(res?.result)
    ? res.result
    : Array.isArray(res)
    ? res
    : [];
  return rows
    .map((x) => x?.title ?? x?.name ?? x?.value ?? (typeof x === "string" ? x : null))
    .filter(Boolean);
};

/** Ubah array label -> unique select options (preserve case) */
const toSelectOptions = (labels = []) => {
  const uniq = Array.from(new Set(labels.map((s) => String(s))));
  return uniq.map((label) => ({ label, value: label }));
};

/* ---------- fetch ---------- */
const fetchFacilities = async () => {
  loading.value = true;
  try {
    const res = await $userStore.get(FACILITIES_BASE);
    facilities.value = parseFacilities(res);
  } catch (e) {
    console.error(e);
    $message.error("Gagal memuat facilities.");
    facilities.value = [];
  } finally {
    loading.value = false;
  }
};

/* Ambil daftar type dari server; jika kosong/gagal → fallback dari facilities */
const buildTypeOptionsFromFacilities = () => {
  const labels = (facilities.value || []).map((f) => f?.type).filter(Boolean);
  typeOptions.value = toSelectOptions(labels);
  allowFreeType.value = typeOptions.value.length === 0;
};

const fetchTypes = async () => {
  typeOptionsLoading.value = true;
  try {
    const res = await $userStore.get(TYPES_ENDPOINT);
    const labels = parseTypesAsLabels(res);
    typeOptions.value = toSelectOptions(labels);
    // Jika endpoint kosong, fallback dari facilities
    if (typeOptions.value.length === 0) {
      buildTypeOptionsFromFacilities();
    } else {
      allowFreeType.value = false;
    }
  } catch (e) {
    // gagal ambil types → fallback dari facilities
    buildTypeOptionsFromFacilities();
  } finally {
    typeOptionsLoading.value = false;
  }
};

/* ---------- modal handlers ---------- */
const openAddModal = () => {
  isEditMode.value = false;
  Object.assign(form, { id: null, type: "", title: "", category: "" });
  modalVisible.value = true;
};

const openEditModal = (row) => {
  isEditMode.value = true;
  Object.assign(form, {
    id: getItemId(row),
    type: row?.type ?? "",
    title: row?.title ?? "",
    category: row?.category ?? "",
  });
  // Pastikan nilai type yang sedang diedit ada di options
  if (form.type && !typeOptions.value.some((o) => o.value === form.type)) {
    typeOptions.value = [{ label: form.type, value: form.type }, ...typeOptions.value];
  }
  modalVisible.value = true;
};

const closeModal = () => {
  modalVisible.value = false;
};

/* ---------- CRUD ---------- */
const submitFacility = async () => {
  if (!form.type || !form.title || !form.category) {
    $message.warning("Type, Title, dan Category wajib diisi");
    return;
  }
  saving.value = true;
  try {
    if (isEditMode.value) {
      const res = await $userStore.put(`${FACILITIES_BASE}/${form.id}`, {
        type: form.type,
        title: form.title,
        category: form.category,
      });
      const id = getItemId(res?.result) || form.id || "-";
      const title = res?.result?.title || form.title || "-";
      $notification.success({
        title: "Facility updated",
        content: `ID: ${id}\nTitle: ${title}`,
        duration: 2500,
      });
    } else {
      const res = await $userStore.post(FACILITIES_BASE, {
        type: form.type,
        title: form.title,
        category: form.category,
      });
      const createdId =
        res?.result?.facilityId || res?.data?.facilityId || getItemId(res?.result) || "-";
      $notification.success({
        title: "Facility added",
        content: `Title: ${form.title}\nID: ${createdId}`,
        duration: 2500,
      });
    }
    closeModal();
    await fetchFacilities();
    // refresh type options juga (kalau user menambah type baru via free text)
    await fetchTypes();
  } catch (e) {
    console.error(e);
    $notification.error({
      title: isEditMode.value ? "Update failed" : "Create failed",
      content: e?.response?.data?.message || "Terjadi kesalahan pada server.",
      duration: 3500,
    });
  } finally {
    saving.value = false;
  }
};

const deleteFacility = async (row) => {
  const id = getItemId(row);
  if (!id) {
    $message.error("ID facility tidak ditemukan.");
    return;
  }
  if (!confirm("Hapus facility ini?")) return;
  try {
    await $userStore.del(`${FACILITIES_BASE}/${id}`);
    $notification.success({
      title: "Facility deleted",
      content: `ID: ${id}`,
      duration: 2200,
    });
    await fetchFacilities();
    // setelah delete, opsi type tetap valid; tidak perlu refetch types
  } catch (e) {
    console.error(e);
    $notification.error({
      title: "Delete failed",
      content: e?.response?.data?.message || "Terjadi kesalahan pada server.",
      duration: 3500,
    });
  }
};

/* ---------- search + filters (client-side) ---------- */
const filtered = computed(() => {
  const q = (search.value || "").trim().toLowerCase();
  const t = (filterType.value || "").toString().trim().toLowerCase();
  const c = (filterCategory.value || "").toString().trim().toLowerCase();

  return facilities.value.filter((f) => {
    const inSearch = q
      ? [f?.title, f?.id, f?.category, f?.type].some((x) =>
          String(x || "")
            .toLowerCase()
            .includes(q)
        )
      : true;
    const inType = t ? String(f?.type || "").toLowerCase() === t : true;
    const inCat = c ? String(f?.category || "").toLowerCase() === c : true;
    return inSearch && inType && inCat;
  });
});

/* ---------- table ---------- */
const columns = [
  { title: "Type", key: "type", render: (r) => dash(r.type) },
  { title: "Title", key: "title", render: (r) => dash(r.title) },
  { title: "Category", key: "category", render: (r) => dash(r.category) },
  {
    title: "Created At",
    key: "_created_date",
    render(row) {
      return h("span", formatDate(row._created_date));
    },
  },
  {
    title: "Updated At",
    key: "_updated_date",
    render(row) {
      return h("span", formatDate(row._updated_date));
    },
  },
  {
    title: "Action",
    key: "actions",
    render(row) {
      return [
        h(NButton, { size: "small", onClick: () => openEditModal(row) }, { default: () => "Edit" }),
        h(
          NButton,
          { size: "small", type: "error", class: "ml-2", onClick: () => deleteFacility(row) },
          { default: () => "Delete" }
        ),
      ];
    },
  },
];

onMounted(async () => {
  // Urutan penting: load facilities dulu (untuk fallback types), lalu load types
  await fetchFacilities();
  await fetchTypes();
});
</script>

<template>
  <atoms-container>
    <atoms-heading h3 class="mb-4">Facilities Configuration</atoms-heading>

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <n-button type="primary" @click="openAddModal">Add Facility</n-button>

      <!-- Filter Type -->
      <n-select
        v-if="!allowFreeType"
        v-model:value="filterType"
        :options="typeOptions"
        :loading="typeOptionsLoading"
        clearable
        class="w-56"
        placeholder="Filter type…"
      />

      <!-- Filter Category -->
      <n-select
        v-model:value="filterCategory"
        :options="CATEGORY_OPTIONS"
        clearable
        class="w-44"
        placeholder="Filter category…"
      />

      <!-- Search -->
      <n-input v-model:value="search" placeholder="Search title/type/id…" class="w-72" clearable />
      <span v-if="loading" class="text-xs text-gray-500">Loading…</span>
    </div>

    <n-data-table :columns="columns" :data="filtered" :loading="loading" striped />

    <n-modal v-model:show="modalVisible" title="Facility Form" preset="dialog">
      <n-form :model="form" label-placement="top">
        <n-form-item label="Type" required>
          <!-- Jika punya daftar type → select; jika tidak ada → input bebas -->
          <n-select
            v-if="!allowFreeType"
            v-model:value="form.type"
            :options="typeOptions"
            :loading="typeOptionsLoading"
            placeholder="Choose type"
            clearable
          />
          <n-input v-else v-model:value="form.type" placeholder="Type (e.g., Hotel)" clearable />
        </n-form-item>

        <n-form-item label="Title" required>
          <n-input v-model:value="form.title" placeholder="Facility title (e.g., Musholla)" />
        </n-form-item>

        <n-form-item label="Category" required>
          <n-select
            v-model:value="form.category"
            :options="CATEGORY_OPTIONS"
            placeholder="Choose category"
            clearable
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-button @click="closeModal">Cancel</n-button>
        <n-button type="primary" class="ml-2" :loading="saving" @click="submitFacility">
          {{ isEditMode ? "Update" : "Create" }}
        </n-button>
      </template>
    </n-modal>
  </atoms-container>
</template>
