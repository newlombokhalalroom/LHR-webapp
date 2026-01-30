<!-- pages/super-admin/hospitality-config/policy.vue -->
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
  NPagination,
} from "naive-ui";
import { ref, reactive, computed, onMounted, h } from "vue";
import { useUserStore } from "@/store/user";

definePageMeta({
  path: "/super-admin/hospitality-config/policy",
  label: "Policy",
  icon: "bed",
  hidden: true,
  order: 1,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const $userStore = useUserStore();
const $message = useMessage();
const $notify = useNotification();

/* -------------------- Endpoints -------------------- */
const POLICIES = "/policies"; // <— hanya gunakan ini untuk GET/POST/PUT/DELETE
const TYPES_SA = "/types"; // <— ambil type seperti biasa (untuk dropdown)

/* -------------------- UI & State -------------------- */
const loading = ref(false);
const saving = ref(false);

const list = ref([]);
const search = ref("");
const page = ref(1);
const pageSize = ref(10);

const types = ref([]); // dari /super-admin/types
const typeIdToTitle = computed(() => {
  const m = new Map();
  (types.value || []).forEach((t) => {
    const title = t?.title ?? t?.name ?? t?.type ?? "-";
    const id = t?.id ?? t?._id ?? t?.uuid ?? null;
    if (id) m.set(id, title);
  });
  return m;
});
const typeNameOptions = computed(() =>
  (types.value || [])
    .map((t) => {
      const title = t?.title ?? t?.name ?? t?.type ?? "";
      return title ? { label: title, value: title } : null; // kirim nama type (string)
    })
    .filter(Boolean)
);

/* Category fixed */
const categoryOptions = [
  { label: "Halal", value: "halal" },
  { label: "Regular", value: "regular" },
];

/* -------------------- Modal Form -------------------- */
const modalVisible = ref(false);
const isEdit = ref(false);
const original = ref(null);

const form = reactive({
  id: null,
  type: "", // nama type (string)
  category: "", // 'halal' | 'regular'
  title: "",
  description: "",
  snapshot: null, // ringkasan data saat edit
});

/* -------------------- Utils -------------------- */
const dash = (v) => (v === null || v === undefined || String(v).trim() === "" ? "—" : v);
const formatDate = (val) =>
  val ? new Date(val).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

/* Normalize list response yang mungkin bervariasi */
const parsePolicies = (res) => {
  if (Array.isArray(res?.result)) return res.result;
  if (Array.isArray(res?.data?.policies)) return res.data.policies;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};

/* Title type untuk render baris (row.type atau mapping type_id -> title) */
const resolveTypeTitle = (row) => {
  if (row?.type) return row.type;
  if (row?.type_id && typeIdToTitle.value.has(row.type_id)) {
    return typeIdToTitle.value.get(row.type_id);
  }
  return "-";
};

/* -------------------- Fetchers -------------------- */
const fetchTypes = async () => {
  try {
    const res = await $userStore.get(TYPES_SA);
    types.value = Array.isArray(res?.result) ? res.result : Array.isArray(res) ? res : [];
  } catch (e) {
    console.error(e);
    types.value = [];
  }
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await $userStore.get(POLICIES);
    list.value = parsePolicies(res);
  } catch (e) {
    console.error(e);
    list.value = [];
    $message.error("Gagal memuat policy.");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchTypes(), fetchList()]);
});

/* -------------------- Filters & Paging -------------------- */
const filtered = computed(() => {
  const q = (search.value || "").trim().toLowerCase();
  if (!q) return list.value;
  return list.value.filter((r) =>
    [r?.title, r?.category, r?.description, resolveTypeTitle(r)]
      .map((x) => String(x || "").toLowerCase())
      .some((s) => s.includes(q))
  );
});
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));
const paginated = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

/* -------------------- Modal handlers -------------------- */
const openAdd = () => {
  isEdit.value = false;
  Object.assign(form, {
    id: null,
    type: "",
    category: "",
    title: "",
    description: "",
    snapshot: null,
  });
  original.value = null;
  modalVisible.value = true;
};

const openEdit = (row) => {
  isEdit.value = true;

  const currentTypeName = row?.type || resolveTypeTitle(row) || "";

  const snapshot = {
    id: row?.id ?? null,
    title: row?.title ?? "",
    category: row?.category ?? "",
    type: currentTypeName,
    description: row?.description ?? "",
  };

  Object.assign(form, { ...snapshot, snapshot });
  original.value = { ...snapshot };
  modalVisible.value = true;
};

const closeModal = () => (modalVisible.value = false);

/* -------------------- CRUD (semua ke /policies) -------------------- */
const submitPolicy = async () => {
  if (!form.title || !form.category || !form.type) {
    $message.warning("Mohon isi Type, Category, dan Title.");
    return;
  }
  const allowed = ["halal", "regular"];
  if (!allowed.includes(String(form.category).toLowerCase())) {
    $message.warning('Category hanya boleh "halal" atau "regular".');
    return;
  }

  const payload = {
    type: form.type, // nama type (string)
    category: form.category, // 'halal' | 'regular'
    title: form.title,
    description: form.description || "",
  };

  saving.value = true;
  try {
    if (isEdit.value && form.id) {
      const res = await $userStore.put(`${POLICIES}/${form.id}`, payload);
      const out = res?.result || res?.data || {};
      $notify.success({
        title: "Policy updated",
        content: `ID: ${out?.id || form.id}\nTitle: ${out?.title || form.title}`,
        duration: 2500,
      });
    } else {
      const res = await $userStore.post(POLICIES, payload);
      const id =
        res?.result?.policy?.id || res?.result?.id || res?.data?.id || res?.data?.policy?.id || "-";
      $notify.success({
        title: "Policy added",
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

const deletePolicy = async (row) => {
  if (!row?.id) return;
  if (!confirm("Hapus policy ini?")) return;
  try {
    await $userStore.del(`${POLICIES}/${row.id}`);
    $notify.success({
      title: "Policy deleted",
      content: `ID: ${row.id}`,
      duration: 2200,
    });
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

/* -------------------- Table Columns -------------------- */
const columns = [
  { title: "Title", key: "title", render: (r) => dash(r.title) },
  { title: "Category", key: "category", render: (r) => dash(r.category) },
  {
    title: "Type",
    key: "type",
    render: (row) => h("span", resolveTypeTitle(row)),
  },
  {
    title: "Description",
    key: "description",
    render: (row) => h("span", dash(row.description)),
  },
  {
    title: "Created At",
    key: "_created_date",
    render: (row) => h("span", formatDate(row._created_date || row?.createdDate)),
  },
  {
    title: "Updated At",
    key: "_updated_date",
    render: (row) => h("span", formatDate(row._updated_date || row?.updatedDate)),
  },
  {
    title: "Action",
    key: "actions",
    render: (row) => [
      h(NButton, { size: "small", onClick: () => openEdit(row) }, { default: () => "Edit" }),
      h(
        NButton,
        { size: "small", type: "error", class: "ml-2", onClick: () => deletePolicy(row) },
        { default: () => "Delete" }
      ),
    ],
  },
];
</script>

<template>
  <atoms-container>
    <atoms-heading h3 class="mb-4">Policy Configuration</atoms-heading>

    <div class="flex flex-wrap items-center gap-3 mb-4">
      <n-button type="primary" @click="openAdd">Add Policy</n-button>
      <n-input
        v-model:value="search"
        placeholder="Search title/type/category..."
        class="w-72"
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
        Page {{ page }} · Showing {{ paginated.length }} of {{ filtered.length }} policies
      </span>
      <n-pagination v-model:page="page" :page-count="pageCount" />
    </div>

    <!-- Modal -->
    <n-modal v-model:show="modalVisible" title="Policy Form" preset="dialog">
      <n-form :model="form" label-placement="top">
        <n-form-item label="Type">
          <n-select
            v-model:value="form.type"
            :options="typeNameOptions"
            placeholder="Select a type"
            filterable
            clearable
          />
        </n-form-item>

        <n-form-item label="Category">
          <n-select
            v-model:value="form.category"
            :options="[
              { label: 'Halal', value: 'halal' },
              { label: 'Regular', value: 'regular' },
            ]"
            placeholder="Select category"
          />
        </n-form-item>

        <n-form-item label="Title">
          <n-input v-model:value="form.title" placeholder="Policy title" />
        </n-form-item>

        <n-form-item label="Description">
          <n-input
            v-model:value="form.description"
            type="textarea"
            placeholder="Policy description"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-button @click="closeModal">Cancel</n-button>
        <n-button type="primary" class="ml-2" :loading="saving" @click="submitPolicy">
          {{ isEdit ? "Update" : "Create" }}
        </n-button>
      </template>
    </n-modal>
  </atoms-container>
</template>
