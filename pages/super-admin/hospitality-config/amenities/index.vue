<!-- pages/super-admin/hospitality-configurations/amenities.vue -->
<script setup>
import { ref, reactive, computed, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  useMessage,
  NPagination,
} from "naive-ui";
import { useUserStore } from "@/store/user";

/* -------------------- Meta -------------------- */
definePageMeta({
  path: "/super-admin/hospitality-config/amenities",
  icon: "bed",
  hidden: true,
  navigator: () => false,
  validation: ({ _user }) => (!_user ? true : _user?.scope?.includes("super-admin") ? true : "/"),
});

/* -------------------- Instances -------------------- */
const router = useRouter();
const $userStore = useUserStore();
const $message = useMessage();

/* -------------------- UI State -------------------- */
const $local = reactive({
  loading: false,
  saving: false,
  search: "",
  page: 1,
  itemsPerPage: 10,
});

/* -------------------- Data -------------------- */
const list = ref([]); // GET /amenities
const typeOptions = ref([]); // dari /super-admin/types  (value = NAMA type, bukan id)
const typeIdIndex = ref(new Map()); // bantu render jika list hanya punya type_id
// Category tidak diambil dari backend — fix menjadi dua opsi tetap
const categoryOptions = ref([
  { label: "Halal", value: "halal" },
  { label: "Regular", value: "regular" },
  { label: "Excluded", value: "excluded" },
]);

/* -------------------- Modal Form -------------------- */
const modalVisible = ref(false);
const isEdit = ref(false);
const original = ref(null);

const form = reactive({
  id: null,
  title: "",
  category: "halal", // default supaya langsung valid
  type: null, // BERISI NAMA TYPE (mis. "hotel")
  typeLabel: "",
  currentSnapshot: null,
});

/* -------------------- Utils -------------------- */
const dash = (v) => (v === null || v === undefined || String(v).trim() === "" ? "—" : v);

/* -------------------- Fetchers -------------------- */
const fetchList = async () => {
  $local.loading = true;
  try {
    const res = await $userStore.get("/amenities");
    const arr = Array.isArray(res?.result) ? res.result : Array.isArray(res) ? res : [];
    list.value = arr;
  } catch (e) {
    console.error(e);
    $message.error(e?.response?.data?.message || "Gagal memuat daftar amenities.");
  } finally {
    $local.loading = false;
  }
};

const fetchTypes = async () => {
  try {
    const res = await $userStore.get("/types");
    const arr = Array.isArray(res?.result) ? res.result : Array.isArray(res) ? res : [];

    // Normalisasi: server ingin "type" = NAMA type (string). Value NSelect juga harus NAMA.
    const idToName = new Map();
    typeOptions.value = arr
      .map((t) => {
        const name = t?.title ?? t?.name ?? t?.type ?? null; // ambil nama
        const id = t?.id ?? t?.type_id ?? t?._id ?? t?.uuid ?? null;
        if (id && name) idToName.set(String(id), String(name));
        return name ? { label: String(name), value: String(name) } : null;
      })
      .filter(Boolean);

    typeIdIndex.value = idToName;
  } catch (e) {
    console.error(e);
    typeOptions.value = [];
    typeIdIndex.value = new Map();
  }
};

onMounted(async () => {
  await Promise.all([fetchTypes(), fetchList()]);
});

/* -------------------- Filter & Paging -------------------- */
const filtered = computed(() => {
  const q = ($local.search || "").toLowerCase().trim();
  if (!q) return list.value;
  return list.value.filter((r) =>
    [r?.title, r?.category, r?.type, r?.type_title].some((x) =>
      String(x || "")
        .toLowerCase()
        .includes(q)
    )
  );
});

const pageCount = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / $local.itemsPerPage))
);

const paginated = computed(() => {
  const start = ($local.page - 1) * $local.itemsPerPage;
  return filtered.value.slice(start, start + $local.itemsPerPage);
});

/* -------------------- Helper: resolve type name from row -------------------- */
const resolveTypeNameFromRow = (row) => {
  // Urutan prioritas: row.type (nama) -> row.type_title (nama) -> lookup dari row.type_id
  if (row?.type && typeof row.type === "string") return row.type;
  if (row?.type_title && typeof row.type_title === "string") return row.type_title;
  if (row?.type_id && typeIdIndex.value.size) {
    const name = typeIdIndex.value.get(String(row.type_id));
    if (name) return name;
  }
  return "";
};

/* -------------------- Modal handlers -------------------- */
const openAdd = () => {
  isEdit.value = false;
  Object.assign(form, {
    id: null,
    title: "",
    category: "halal",
    type: null, // user akan pilih nama type
    typeLabel: "",
    currentSnapshot: null,
  });
  original.value = null;
  modalVisible.value = true;
};

const openEdit = (row) => {
  isEdit.value = true;

  const current = {
    id: row?.id ?? null,
    title: row?.title ?? "",
    category: row?.category ?? "halal",
    typeLabel: resolveTypeNameFromRow(row), // nama type utk ringkasan
  };

  Object.assign(form, {
    id: current.id,
    title: current.title,
    category: current.category,
    type: current.typeLabel || null, // form.type harus NAMA type
    typeLabel: current.typeLabel,
    currentSnapshot: { ...current },
  });

  original.value = {
    title: current.title,
    category: current.category,
    type: current.typeLabel || null, // simpan nama utk pembanding
  };

  modalVisible.value = true;
};

const closeModal = () => (modalVisible.value = false);

/* -------------------- CRUD -------------------- */
const handleSubmit = async () => {
  // Validasi basic
  if (!form.title) {
    $message.warning("Mohon isi Title.");
    return;
  }
  if (!form.category) {
    $message.warning("Mohon pilih Category.");
    return;
  }
  if (!isEdit.value && !form.type) {
    $message.warning("Mohon pilih Type.");
    return;
  }

  $local.saving = true;
  try {
    if (isEdit.value) {
      // Kirim hanya field yang berubah
      const payload = {};
      if (form.title !== original.value?.title) payload.title = form.title;
      if (form.category !== original.value?.category) payload.category = form.category;
      if (form.type && form.type !== original.value?.type) payload.type = String(form.type); // NAMA

      if (Object.keys(payload).length === 0) {
        $message.warning("Tidak ada perubahan untuk disimpan.");
        $local.saving = false;
        return;
      }

      await $userStore.put(`/super-admin/amenities/${form.id}`, payload);
      $message.success("Amenity berhasil diubah.");
    } else {
      // CREATE: server minta type = NAMA (bukan id)
      const payload = {
        type: String(form.type),
        title: form.title,
        category: form.category,
      };
      await $userStore.post("/super-admin/amenities", payload);
      $message.success("Amenity berhasil ditambahkan.");
    }

    closeModal();
    await fetchList();
  } catch (e) {
    console.error(e);
    const msg =
      e?.response?.data?.message ||
      (isEdit.value ? "Gagal memperbarui amenity." : "Gagal menambahkan amenity.");
    $message.error(msg);
  } finally {
    $local.saving = false;
  }
};

const handleDelete = async (row) => {
  if (!confirm(`Hapus amenity "${row?.title}"?`)) return;
  try {
    await $userStore.del(`/super-admin/amenities/${row.id}`);
    $message.success("Amenity berhasil dihapus.");
    await fetchList();
  } catch (e) {
    console.error(e);
    $message.error(e?.response?.data?.message || "Gagal menghapus amenity.");
  }
};

/* -------------------- Columns -------------------- */
const columns = [
  { title: "Title", key: "title", render: (r) => dash(r.title) },
  { title: "Category", key: "category", render: (r) => dash(r.category) },
  {
    title: "Type",
    key: "type",
    render: (r) => {
      const byName = r?.type ?? r?.type_title ?? "";
      if (byName) return dash(byName);
      if (r?.type_id && typeIdIndex.value.size) {
        return dash(typeIdIndex.value.get(String(r.type_id)));
      }
      return "—";
    },
  },
  {
    title: "Action",
    key: "actions",
    render(row) {
      return h("div", { class: "flex gap-2" }, [
        h(
          NButton,
          { size: "small", tertiary: true, onClick: () => openEdit(row) },
          { default: () => "Edit" }
        ),
        h(
          NButton,
          { size: "small", type: "error", secondary: true, onClick: () => handleDelete(row) },
          { default: () => "Delete" }
        ),
      ]);
    },
  },
];
</script>

<template>
  <atoms-container>
    <atoms-heading h3 class="mb-4">Amenities Configuration</atoms-heading>

    <div class="flex items-center justify-between gap-3 mb-4">
      <n-button type="primary" @click="openAdd">Add Amenity</n-button>
      <n-input
        v-model:value="$local.search"
        placeholder="Search title/category/type..."
        class="w-72"
        clearable
      />
    </div>

    <n-data-table
      :columns="columns"
      :data="paginated"
      :loading="$local.loading"
      striped
      :bordered="true"
      size="small"
      :row-key="(r) => r.id"
    />

    <div class="flex items-center justify-between mt-6">
      <span class="text-sm text-gray-500">
        Showing {{ paginated.length }} of {{ filtered.length }} amenities
      </span>
      <n-pagination v-model:page="$local.page" :page-count="pageCount" />
    </div>

    <!-- Modal -->
    <n-modal
      v-model:show="modalVisible"
      preset="dialog"
      :title="isEdit ? 'Edit Amenity' : 'Add Amenity'"
    >
      <n-form :model="form" label-placement="top">
        <!-- TYPE: kirim NAMA type (server akan konversi ke id) -->
        <n-form-item label="Type">
          <n-select
            v-model:value="form.type"
            :options="typeOptions"
            placeholder="Select type (e.g. hotel)"
            filterable
            clearable
          />
        </n-form-item>

        <!-- CATEGORY: opsi tetap -->
        <n-form-item label="Category">
          <n-select
            v-model:value="form.category"
            :options="categoryOptions"
            placeholder="Select category"
            filterable
            clearable
          />
        </n-form-item>

        <n-form-item label="Title">
          <n-input v-model:value="form.title" placeholder="Amenity title" />
        </n-form-item>
      </n-form>

      <template #action>
        <n-button @click="closeModal">Cancel</n-button>
        <n-button type="primary" class="ml-2" :loading="$local.saving" @click="handleSubmit">
          {{ isEdit ? "Update" : "Create" }}
        </n-button>
      </template>
    </n-modal>
  </atoms-container>
</template>
