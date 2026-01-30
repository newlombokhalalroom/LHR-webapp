<!-- pages/super-admin/hospitality-config/details.vue -->
<script setup>
import { ref, reactive, computed, onMounted, h } from "vue";
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

definePageMeta({
  path: "/super-admin/hospitality-config/details",
  label: "Details",
  hidden: true,
  icon: "check",
  order: 2,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const $userStore = useUserStore();
const $message = useMessage();

/* ---------------- UI & State ---------------- */
const $local = reactive({
  loading: false,
  saving: false,
  search: "",
  page: 1,
  itemsPerPage: 10,
});

const list = ref([]); // data GET /details
const typeOptions = ref([]); // [{label: "Hotel", value: "Hotel"}]
const typeIdIndex = ref(new Map()); // id -> name
const categoryOptions = ref([]); // [{label: "tes5", value: "tes5"}]
const catIdIndex = ref(new Map()); // id -> title

/* ---------------- Form & Modal ---------------- */
const modalVisible = ref(false);
const isEdit = ref(false);
const original = ref(null);
const form = reactive({
  id: null,
  title: "",
  category: "", // string nama kategori (ex: "tes5")
  type: null, // string nama type (ex: "hotel")
  currentSnapshot: null,
});

/* ---------------- Utils ---------------- */
const dash = (v) => (v === null || v === undefined || String(v).trim() === "" ? "—" : v);
const formatDate = (v) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

/* ---------------- Fetchers ---------------- */
const fetchList = async () => {
  $local.loading = true;
  try {
    const res = await $userStore.get("/details");
    // Toleran terhadap berbagai bentuk respon
    const arr = Array.isArray(res?.result)
      ? res.result
      : Array.isArray(res?.data?.details)
      ? res.data.details
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    list.value = arr;
  } catch (e) {
    console.error(e);
    $message.error(e?.response?.data?.message || "Gagal memuat details.");
  } finally {
    $local.loading = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await $userStore.get("/details/categories");
    // Bentuk yang kamu kirim:
    // { status: "success", data: { categories: [{ id, title, ...}, ...] } }
    const arr = Array.isArray(res?.data?.categories) ? res.data.categories : [];
    const idToTitle = new Map();
    categoryOptions.value = arr
      .map((c) => {
        const id = c?.id || null;
        const title = c?.title || null;
        if (!id || !title) return null;
        idToTitle.set(String(id), String(title));
        return { label: String(title), value: String(title) }; // value = NAMA kategori
      })
      .filter(Boolean);
    catIdIndex.value = idToTitle; // untuk resolving category_id -> name
  } catch (e) {
    console.error(e);
    categoryOptions.value = [];
    catIdIndex.value = new Map();
  }
};

const fetchTypes = async () => {
  try {
    const res = await $userStore.get("/types");
    const arr = Array.isArray(res?.result) ? res.result : Array.isArray(res) ? res : [];
    const idToName = new Map();
    typeOptions.value = arr
      .map((t) => {
        const name = t?.title ?? t?.name ?? t?.type ?? null;
        const id = t?.id ?? t?.type_id ?? t?._id ?? t?.uuid ?? null;
        if (!name) return null;
        if (id) idToName.set(String(id), String(name));
        return { label: String(name), value: String(name) }; // value = NAMA type
      })
      .filter(Boolean);
    typeIdIndex.value = idToName; // untuk resolving type_id -> name
  } catch (e) {
    console.error(e);
    typeOptions.value = [];
    typeIdIndex.value = new Map();
  }
};

onMounted(async () => {
  await Promise.all([fetchTypes(), fetchCategories(), fetchList()]);
});

/* ---------------- Resolver untuk display ---------------- */
const resolveTypeName = (row) => {
  if (row?.type && typeof row.type === "string") return row.type;
  if (row?.type_title && typeof row.type_title === "string") return row.type_title;
  if (row?.type_id && typeIdIndex.value.size) {
    return typeIdIndex.value.get(String(row.type_id)) || "";
  }
  return "";
};

const resolveCategoryName = (row) => {
  if (row?.category && typeof row.category === "string") return row.category;
  if (row?.category_title && typeof row.category_title === "string") return row.category_title;
  if (row?.category_id && catIdIndex.value.size) {
    return catIdIndex.value.get(String(row.category_id)) || "";
  }
  return "";
};

/* ---------------- Filter & Paging ---------------- */
const filtered = computed(() => {
  const q = ($local.search || "").toLowerCase().trim();
  if (!q) return list.value;
  return list.value.filter((r) =>
    [r?.title, resolveCategoryName(r), resolveTypeName(r)]
      .map((x) => String(x || "").toLowerCase())
      .some((txt) => txt.includes(q))
  );
});

const pageCount = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / $local.itemsPerPage))
);

const paginated = computed(() => {
  const start = ($local.page - 1) * $local.itemsPerPage;
  return filtered.value.slice(start, start + $local.itemsPerPage);
});

/* ---------------- Modal Ops ---------------- */
const openAdd = () => {
  isEdit.value = false;
  Object.assign(form, {
    id: null,
    title: "",
    category: "", // pilih dari dropdown categories (nama)
    type: null, // pilih dari dropdown types (nama)
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
    category: resolveCategoryName(row), // nama kategori dari id map
    type: resolveTypeName(row), // nama type dari id map
  };
  Object.assign(form, { ...current, currentSnapshot: { ...current } });
  original.value = { ...current };
  modalVisible.value = true;
};

const closeModal = () => (modalVisible.value = false);

/* ---------------- Submit (POST/PUT) ---------------- */
const submitDetail = async () => {
  if (!form.title) return $message.warning("Title wajib diisi");
  if (!form.category) return $message.warning("Category wajib diisi");
  if (!form.type) return $message.warning("Type wajib diisi");

  $local.saving = true;
  try {
    if (isEdit.value) {
      // Kirim hanya field yang berubah (server terima NAMA untuk type & category)
      const payload = {};
      if (form.title !== original.value?.title) payload.title = form.title;
      if (form.category !== original.value?.category) payload.category = form.category; // nama
      if (form.type !== original.value?.type) payload.type = String(form.type); // nama

      if (Object.keys(payload).length === 0) {
        $message.warning("Tidak ada perubahan untuk disimpan.");
        $local.saving = false;
        return;
      }

      await $userStore.put(`/details/${form.id}`, payload);
      $message.success("Detail berhasil diperbarui.");
    } else {
      const payload = {
        title: form.title,
        category: form.category, // nama kategori
        type: String(form.type), // nama type
      };
      await $userStore.post("/details", payload);
      $message.success("Detail berhasil ditambahkan.");
    }

    closeModal();
    await fetchList();
  } catch (e) {
    console.error(e);
    $message.error(
      e?.response?.data?.message ||
        (isEdit.value ? "Gagal memperbarui detail." : "Gagal menambahkan detail.")
    );
  } finally {
    $local.saving = false;
  }
};

const deleteDetail = async (row) => {
  if (!confirm(`Hapus detail "${row?.title}"?`)) return;
  try {
    await $userStore.del(`/details/${row.id}`);
    $message.success("Detail berhasil dihapus.");
    await fetchList();
  } catch (e) {
    console.error(e);
    $message.error(e?.response?.data?.message || "Gagal menghapus detail.");
  }
};

/* ---------------- Table Columns ---------------- */
const columns = [
  { title: "Title", key: "title", render: (r) => dash(r.title) },
  { title: "Category", key: "category", render: (r) => dash(resolveCategoryName(r)) },
  { title: "Type", key: "type", render: (r) => dash(resolveTypeName(r)) },
  { title: "Created", key: "_created_date", render: (r) => formatDate(r._created_date) },
  { title: "Updated", key: "_updated_date", render: (r) => formatDate(r._updated_date) },
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
          { size: "small", type: "error", secondary: true, onClick: () => deleteDetail(row) },
          { default: () => "Delete" }
        ),
      ]);
    },
  },
];
</script>

<template>
  <atoms-container>
    <atoms-heading h3 class="mb-4">Details Configuration</atoms-heading>

    <div class="flex items-center justify-between gap-3 mb-4">
      <n-button type="primary" @click="openAdd">Add Detail</n-button>
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
        Showing {{ paginated.length }} of {{ filtered.length }} details
      </span>
      <n-pagination v-model:page="$local.page" :page-count="pageCount" />
    </div>

    <n-modal
      v-model:show="modalVisible"
      preset="dialog"
      :title="isEdit ? 'Edit Detail' : 'Add Detail'"
    >
      <n-form :model="form" label-placement="top">
        <n-form-item label="Title">
          <n-input v-model:value="form.title" placeholder="Detail title" />
        </n-form-item>

        <!-- Category dari GET /details/categories; value = NAMA kategori -->
        <n-form-item label="Category">
          <n-select
            v-model:value="form.category"
            :options="categoryOptions"
            placeholder="Pilih kategori"
            filterable
            clearable
          />
        </n-form-item>

        <!-- Type dari GET /super-admin/types; value = NAMA type -->
        <n-form-item label="Type">
          <n-select
            v-model:value="form.type"
            :options="typeOptions"
            placeholder="Pilih type (mis. hotel)"
            filterable
            clearable
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-button @click="closeModal">Cancel</n-button>
        <n-button type="primary" class="ml-2" :loading="$local.saving" @click="submitDetail">
          {{ isEdit ? "Update" : "Create" }}
        </n-button>
      </template>
    </n-modal>
  </atoms-container>
</template>
