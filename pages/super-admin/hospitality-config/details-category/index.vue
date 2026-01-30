<!-- pages/super-admin/hospitality-config/details-category.vue -->
<script setup>
import {
  NButton,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  useMessage,
  useNotification,
} from "naive-ui";
import { ref, reactive, onMounted, h, computed } from "vue";
import { useUserStore } from "@/store/user";

definePageMeta({
  path: "/super-admin/hospitality-config/details-category",
  label: "Details Category",
  hidden: true,
  icon: "history",
  order: 3,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const $message = useMessage();
const $notification = useNotification();
const $userStore = useUserStore();

const CATEGORY_BASE = "/details/categories";

/* ---------- state ---------- */
const loading = ref(false);
const saving = ref(false);
const categories = ref([]);
const modalVisible = ref(false);
const isEditMode = ref(false);

const form = reactive({
  id: null,
  title: "",
});

const search = ref("");

/* ---------- utils ---------- */
const dash = (v) => (v === null || v === undefined || String(v).trim() === "" ? "—" : v);
const formatDate = (val) =>
  val ? new Date(val).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

/** Normalisasi respons list:
 *  Ekspektasi: { status: "success", data: { categories: [...] } }
 *  Tetap toleran ke bentuk lain (result / array langsung) agar robust.
 */
const parseList = (res) => {
  if (Array.isArray(res?.data?.categories)) return res.data.categories;
  if (Array.isArray(res?.result)) return res.result;
  if (Array.isArray(res)) return res;
  return [];
};

/* ---------- fetch ---------- */
const fetchCategories = async () => {
  loading.value = true;
  try {
    const res = await $userStore.get(CATEGORY_BASE);
    categories.value = parseList(res);
  } catch (e) {
    console.error(e);
    $message.error("Gagal memuat kategori.");
    categories.value = [];
  } finally {
    loading.value = false;
  }
};

/* ---------- modal handlers ---------- */
const openAddModal = () => {
  isEditMode.value = false;
  Object.assign(form, { id: null, title: "" });
  modalVisible.value = true;
};

const openEditModal = (row) => {
  isEditMode.value = true;
  Object.assign(form, { id: row?.id ?? null, title: row?.title ?? "" });
  modalVisible.value = true;
};

const closeModal = () => {
  modalVisible.value = false;
};

/* ---------- CRUD (semua via /details/categories) ---------- */
const submitCategory = async () => {
  if (!form.title) {
    $message.warning("Title is required");
    return;
  }
  saving.value = true;
  try {
    if (isEditMode.value) {
      const res = await $userStore.put(`${CATEGORY_BASE}/${form.id}`, { title: form.title });
      const id = res?.result?.id || form.id || "-";
      const title = res?.result?.title || form.title || "-";
      $notification.success({
        title: "Category updated",
        content: `ID: ${id}\nTitle: ${title}`,
        duration: 2500,
      });
    } else {
      const res = await $userStore.post(CATEGORY_BASE, { title: form.title });
      const id = res?.result?.id || res?.data?.id || "-";
      $notification.success({
        title: "Category added",
        content: `Title: ${form.title}\nID: ${id}`,
        duration: 2500,
      });
    }
    closeModal();
    await fetchCategories();
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

const deleteCategory = async (id) => {
  if (!confirm("Hapus kategori ini?")) return;
  try {
    await $userStore.del(`${CATEGORY_BASE}/${id}`);
    $notification.success({
      title: "Category deleted",
      content: `ID: ${id}`,
      duration: 2200,
    });
    await fetchCategories();
  } catch (e) {
    console.error(e);
    $notification.error({
      title: "Delete failed",
      content: e?.response?.data?.message || "Terjadi kesalahan pada server.",
      duration: 3500,
    });
  }
};

/* ---------- search (client-side) ---------- */
const filtered = computed(() => {
  const q = (search.value || "").trim().toLowerCase();
  if (!q) return categories.value;
  return categories.value.filter((c) =>
    [c?.title, c?.id].some((x) =>
      String(x || "")
        .toLowerCase()
        .includes(q)
    )
  );
});

/* ---------- table ---------- */
const columns = [
  { title: "Title", key: "title", render: (r) => dash(r.title) },
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
          { size: "small", type: "error", class: "ml-2", onClick: () => deleteCategory(row.id) },
          { default: () => "Delete" }
        ),
      ];
    },
  },
];

onMounted(fetchCategories);
</script>

<template>
  <atoms-container>
    <atoms-heading h3 class="mb-4">Details Category Configuration</atoms-heading>

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <n-button type="primary" @click="openAddModal">Add Category</n-button>
      <n-input v-model:value="search" placeholder="Search title/id..." class="w-72" clearable />
      <span v-if="loading" class="text-xs text-gray-500">Loading…</span>
    </div>

    <n-data-table :columns="columns" :data="filtered" :loading="loading" striped />

    <n-modal v-model:show="modalVisible" title="Category Form" preset="dialog">
      <n-form :model="form" label-placement="top">
        <n-form-item label="Title">
          <n-input v-model:value="form.title" placeholder="Category title" />
        </n-form-item>
      </n-form>

      <template #action>
        <n-button @click="closeModal">Cancel</n-button>
        <n-button type="primary" class="ml-2" :loading="saving" @click="submitCategory">
          {{ isEditMode ? "Update" : "Create" }}
        </n-button>
      </template>
    </n-modal>
  </atoms-container>
</template>
