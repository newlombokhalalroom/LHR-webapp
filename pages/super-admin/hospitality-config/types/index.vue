<!-- pages/super-admin/hospitality-config/types.vue -->
<script setup>
import {
  NButton,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NPagination,
  useMessage,
  useNotification,
} from "naive-ui";
import { ref, reactive, computed, onMounted, h } from "vue";
import { useUserStore } from "@/store/user";

definePageMeta({
  path: "/super-admin/hospitality-config/types",
  label: "Types",
  icon: "list",
  hidden: true,
  order: 5,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const $userStore = useUserStore();
const $msg = useMessage();
const $notify = useNotification();

/* -------------------- Endpoints -------------------- */
const TYPES_PUBLIC = "/types";
const TYPES_SA = "/types";

/* -------------------- State -------------------- */
const loading = ref(false);
const saving = ref(false);
const items = ref([]); // list types
const search = ref("");
const page = ref(1);
const pageSize = ref(10);

const modalVisible = ref(false);
const isEdit = ref(false);
const form = reactive({
  id: null,
  title: "",
  description: "",
});

/* -------------------- Utils -------------------- */
const dash = (v) => (v === null || v === undefined || String(v).trim() === "" ? "—" : v);
const fmtDate = (v) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

/* Robust parser untuk variasi response */
const parseTypesList = (res) => {
  // contoh kamu: { status: true, result: [ ... ] }
  if (Array.isArray(res?.result)) return res.result;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};

/* -------------------- Fetch -------------------- */
const fetchList = async () => {
  loading.value = true;
  try {
    const res = await $userStore.get(TYPES_PUBLIC);
    items.value = parseTypesList(res);
  } catch (e) {
    console.error(e);
    items.value = [];
    $msg.error("Gagal memuat types.");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchList);

/* -------------------- Filter & Paging -------------------- */
const filtered = computed(() => {
  const q = (search.value || "").toLowerCase().trim();
  if (!q) return items.value;
  return items.value.filter((r) =>
    [r?.title, r?.description].map((x) => String(x || "").toLowerCase()).some((s) => s.includes(q))
  );
});
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));
const paginated = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

/* -------------------- Modal handlers -------------------- */
const openAddModal = () => {
  isEdit.value = false;
  Object.assign(form, { id: null, title: "", description: "" });
  modalVisible.value = true;
};
const openEditModal = (row) => {
  isEdit.value = true;
  Object.assign(form, {
    id: row?.id ?? null,
    title: row?.title ?? "",
    description: row?.description ?? "",
  });
  modalVisible.value = true;
};
const closeModal = () => (modalVisible.value = false);

/* -------------------- CRUD via /super-admin/types -------------------- */
const submitType = async () => {
  if (!form.title || !form.description) {
    $msg.warning("Harap isi Title dan Description.");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value && form.id) {
      const res = await $userStore.put(`${TYPES_SA}/${form.id}`, {
        title: form.title,
        description: form.description,
      });
      const out = res?.result || res?.data || {};
      $notify.success({
        title: "Type updated",
        content: `ID: ${out?.id || form.id}\nTitle: ${out?.title || form.title}`,
        duration: 2500,
      });
    } else {
      const res = await $userStore.post(TYPES_SA, {
        title: form.title,
        description: form.description,
      });
      const id =
        res?.result?.id || res?.result?.typeId || res?.result?.clientTypeId || res?.data?.id || "-";
      $notify.success({
        title: "Type added",
        content: `Title: ${form.title}\nID: ${id}`,
        duration: 2500,
      });
    }
    closeModal();
    await fetchList();
  } catch (e) {
    console.error(e);
    $notify.error({
      title: isEdit.value ? "Update failed" : "Create failed",
      content: e?.response?.data?.message || "Terjadi kesalahan pada server.",
      duration: 3500,
    });
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (id) => {
  if (!id) return;
  if (!confirm("Hapus type ini?")) return;
  try {
    await $userStore.del(`${TYPES_SA}/${id}`);
    $notify.success({ title: "Type deleted", content: `ID: ${id}`, duration: 2000 });
    await fetchList();
  } catch (e) {
    console.error(e);
    $notify.error({
      title: "Delete failed",
      content: e?.response?.data?.message || "Terjadi kesalahan pada server.",
      duration: 3500,
    });
  }
};

/* -------------------- Table -------------------- */
const columns = [
  { title: "Title", key: "title", render: (r) => dash(r.title) },
  { title: "Description", key: "description", render: (r) => dash(r.description) },
  {
    title: "Created At",
    key: "_created_date",
    render: (row) => h("span", fmtDate(row._created_date)),
  },
  {
    title: "Updated At",
    key: "_updated_date",
    render: (row) => h("span", fmtDate(row._updated_date)),
  },
  {
    title: "Action",
    key: "actions",
    render: (row) => [
      h(NButton, { size: "small", onClick: () => openEditModal(row) }, { default: () => "Edit" }),
      h(
        NButton,
        { size: "small", type: "error", class: "ml-2", onClick: () => confirmDelete(row.id) },
        { default: () => "Delete" }
      ),
    ],
  },
];
</script>

<template>
  <atoms-container>
    <atoms-heading h3 class="mb-4">Types Configuration</atoms-heading>

    <div class="flex flex-wrap items-center gap-3 mb-4">
      <n-button type="primary" @click="openAddModal">Add Type</n-button>
      <n-input
        v-model:value="search"
        class="w-72"
        placeholder="Search title/description..."
        clearable
      />
      <span v-if="loading" class="text-xs text-gray-500">Loading…</span>
    </div>

    <n-data-table
      :columns="columns"
      :data="paginated"
      :loading="loading"
      striped
      :bordered="true"
      size="small"
      :row-key="(r) => r.id"
    />

    <div class="flex items-center justify-between mt-6">
      <span class="text-sm text-gray-500">
        Page {{ page }} · Showing {{ paginated.length }} of {{ filtered.length }} types
      </span>
      <n-pagination v-model:page="page" :page-count="pageCount" />
    </div>

    <!-- Modal Form -->
    <n-modal v-model:show="modalVisible" title="Type Form" preset="dialog">
      <n-form :model="form" label-placement="top">
        <n-form-item label="Title">
          <n-input v-model:value="form.title" placeholder="Type name (e.g., Hotel, Villa)" />
        </n-form-item>
        <n-form-item label="Description">
          <n-input
            v-model:value="form.description"
            type="textarea"
            placeholder="Type description"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="closeModal">Cancel</n-button>
        <n-button type="primary" class="ml-2" :loading="saving" @click="submitType">
          {{ isEdit ? "Update" : "Create" }}
        </n-button>
      </template>
    </n-modal>
  </atoms-container>
</template>
