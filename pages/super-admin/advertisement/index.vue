<script setup>
import { NDataTable, NImage, NButton, NInput, NPagination, NTag, useMessage } from "naive-ui";
import { ref, reactive, computed, h, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";

definePageMeta({
  path: "/super-admin/advertisements",
  label: "Advertisements",
  title: "Advertisements",
  order: 8,
  icon: "megaphone",
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const router = useRouter();
const $userStore = useUserStore();
const $message = useMessage();

const $local = reactive({
  page: 1,
  limit: 10,
  search: "",
});

const loading = ref(false);
const rows = ref([]);
const total = ref(0);
const pages = ref(1);

const safe = (v) => {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string" && v.trim() === "") return "-";
  return v;
};
const formatDate = (val) =>
  val ? new Date(val).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";
const statusTagType = (s) => (String(s).toLowerCase() === "active" ? "success" : "default");

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await $userStore.get("/super-admin/advertisements", {
      params: { page: $local.page, limit: $local.limit, q: $local.search || undefined },
    });
    const arr = Array.isArray(res?.result) ? res.result : res?.data ?? [];
    rows.value = arr;
    total.value = Number(res?.total ?? arr.length);
    pages.value = Number(res?.pages ?? Math.max(1, Math.ceil(total.value / $local.limit)));
  } catch (e) {
    console.error(e);
    $message.error("Gagal memuat advertisements.");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchList);
watch(() => $local.page, fetchList);
watch(
  () => $local.limit,
  () => {
    $local.page = 1;
    fetchList();
  }
);

const filteredData = computed(() => {
  const kw = ($local.search || "").toLowerCase();
  if (!kw) return rows.value;
  return rows.value.filter((x) =>
    String(x?.title || "")
      .toLowerCase()
      .includes(kw)
  );
});

const pageCount = computed(() => pages.value || 1);

const goDetail = (id) => router.push(`/super-admin/advertisements/${id}`);
const handleDelete = async (row) => {
  if (!confirm("Hapus iklan ini? Tindakan tidak dapat dibatalkan.")) return;
  try {
    await $userStore.del(`/super-admin/advertisements/${row.id}`);
    $message.success("Advertisement dihapus.");
    await fetchList();
  } catch (e) {
    console.error(e);
    $message.error("Gagal menghapus advertisement.");
  }
};

const columns = [
  { title: "Title", key: "title", render: (r) => safe(r.title) },
  { title: "Description", key: "description", render: (r) => safe(r.description) },
  { title: "Type", key: "type", render: (r) => safe(r.type) },
  {
    title: "Status",
    key: "status",
    render: (r) =>
      h(
        NTag,
        { type: statusTagType(r.status), round: true, bordered: false },
        { default: () => safe(r.status) }
      ),
  },
  { title: "Start Date", key: "start_date", render: (r) => formatDate(r.start_date) },
  { title: "End Date", key: "end_date", render: (r) => formatDate(r.end_date) },
  {
    title: "Link Target",
    key: "link_target",
    render: (row) =>
      row.link_target
        ? h(
            "a",
            { href: row.link_target, target: "_blank", class: "text-primary underline" },
            row.link_target
          )
        : h("span", {}, "-"),
  },
  { title: "Priority", key: "priority", render: (r) => safe(r.priority) },
  {
    title: "Action",
    key: "actions",
    render(row) {
      return h("div", { class: "flex gap-2" }, [
        h(NButton, { size: "small", onClick: () => goDetail(row.id) }, { default: () => "Detail" }),
        h(
          NButton,
          { size: "small", type: "error", tertiary: true, onClick: () => handleDelete(row) },
          { default: () => "Delete" }
        ),
      ]);
    },
  },
];
</script>

<template>
  <atoms-container>
    <atoms-heading h3 class="mb-4">Advertisement List</atoms-heading>

    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <n-button type="primary" @click="router.push('/super-admin/advertisements/submit')">
          Add new Advertisement
        </n-button>

        <n-input
          v-model:value="$local.search"
          placeholder="Search by title"
          class="w-64"
          clearable
          @keydown.enter="
            () => {
              $local.page = 1;
              fetchList();
            }
          "
          @clear="
            () => {
              $local.page = 1;
              fetchList();
            }
          "
        />
      </div>
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredData"
      :loading="loading"
      :bordered="true"
      striped
      size="small"
      :row-key="(r) => r.id"
    />

    <div class="flex items-center justify-between mt-6">
      <span class="text-sm text-gray-500">
        Page {{ $local.page }} · Showing {{ filteredData.length }} of {{ total }} items
      </span>
      <n-pagination v-model:page="$local.page" :page-count="pageCount" />
    </div>
  </atoms-container>
</template>
