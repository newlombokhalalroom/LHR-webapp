<!-- pages/super-admin/destinations/index.vue -->
<script setup>
import { ref, reactive, computed, h, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { NDataTable, NImage, NButton, NInput, NPagination, useMessage } from "naive-ui";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";
import useApi from "@/composables/useApi";

definePageMeta({
  path: "/super-admin/destinations",
  title: "Destinations",
  label: "Destination",
  order: 8,
  icon: "map",
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const router = useRouter();
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);
const $message = useMessage();
const { $api } = useApi();

/** redirect jika bukan super-admin */
watch(
  () => $dataUser.value,
  (u) => {
    if (u && !u?.scope?.includes?.("super-admin")) router.replace("/");
  },
  { immediate: true }
);

/** local ui state */
const $local = reactive({
  page: 1,
  itemsPerPage: 10,
  search: "",
  loading: false,
  raw: [],
});

/** --- helpers umum --- */
const dash = (v) => (v === null || v === undefined || v === "" ? "-" : v);
const fmtDate = (v) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

/** --- deteksi “ini kelihatannya URL gambar” --- */
const isLikelyImageUrl = (url) => {
  if (!url) return false;
  const u = String(url).trim();
  // skip halaman HTML
  if (/\.html?(?:[#?].*)?$/i.test(u)) return false;
  // data/blobs juga ok
  if (/^(data:image\/|blob:|filesystem:)/i.test(u)) return true;
  // ekstensi umum gambar (boleh tanpa query params)
  if (/\.(png|jpe?g|gif|webp|bmp|svg)(?:[#?].*)?$/i.test(u)) return true;
  // kadang CDN tak ada ekstensi, tetap coba (kembalikan true agar dicoba dulu)
  if (/^https?:\/\//i.test(u)) return true;
  return false;
};

/** satu placeholder SVG (inline) saat gambar gagal dimuat/hotlink */
const PLACEHOLDER_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'>
      <rect width='120' height='80' fill='#f3f4f6'/>
      <g fill='none' stroke='#cbd5e1' stroke-width='3'>
        <rect x='10' y='10' width='100' height='60' rx='6'/>
        <path d='M22 58l18-22 14 16 10-12 24 30'/>
        <circle cx='46' cy='30' r='6' fill='#cbd5e1' stroke='none'/>
      </g>
    </svg>`
  );

/** normalisasi field gambar dari row */
const pickImage = (row) => {
  // 1) field langsung
  if (isLikelyImageUrl(row?.picture)) return row.picture;

  // 2) array pictures (string atau object umum)
  if (Array.isArray(row?.pictures)) {
    for (const it of row.pictures) {
      const candidate =
        typeof it === "string"
          ? it
          : it?.picture || it?.url || it?.src || it?.path || it?.image || it?.thumb;
      if (isLikelyImageUrl(candidate)) return candidate;
    }
  }

  // 3) kemungkinan field lain yang dipakai backend
  const altFields = [row?.image, row?.thumbnail, row?.cover];
  for (const cand of altFields) {
    if (isLikelyImageUrl(cand)) return cand;
  }

  return ""; // tidak ketemu
};

/** fetch list */
const fetchDestinations = async () => {
  $local.loading = true;
  try {
    const res = await $api.get("/super-admin/destinations");
    const list = Array.isArray(res?.result) ? res.result : Array.isArray(res) ? res : [];
    $local.raw = list;
  } catch (e) {
    console.error(e);
    $message.error("Tidak ada data destination");
  } finally {
    $local.loading = false;
  }
};

/** search client-side */
const filteredData = computed(() => {
  const q = ($local.search || "").toLowerCase().trim();
  if (!q) return $local.raw;
  return $local.raw.filter((d) =>
    [d?.title, d?.description, d?.city, d?.province, d?.category].some((v) =>
      String(v || "")
        .toLowerCase()
        .includes(q)
    )
  );
});

/** paginate client-side */
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredData.value.length / $local.itemsPerPage))
);
const paginatedData = computed(() => {
  const start = ($local.page - 1) * $local.itemsPerPage;
  return filteredData.value.slice(start, start + $local.itemsPerPage);
});

/** hapus data */
const handleDelete = async (row) => {
  if (!confirm("Yakin hapus destination ini?")) return;
  try {
    await $api.delete(`/super-admin/destinations/${row.id}`);
    $message.success("Destination berhasil dihapus");
    await fetchDestinations();
  } catch (e) {
    console.error(e);
    $message.error("Gagal hapus destination");
  }
};

/** cell gambar yang robust dengan fallback */
const renderImageCell = (row) => {
  const src = pickImage(row);
  // jika kosong, langsung pakai placeholder
  if (!src) {
    return h(
      "div",
      { class: "w-[96px] h-[64px] bg-gray-100 rounded flex items-center justify-center" },
      [h("i", { class: "mdi mdi-image-outline text-gray-400 text-xl" })]
    );
  }
  // pakai NImage + fallback SVG + no-referrer
  return h(NImage, {
    src,
    width: 96,
    height: 64,
    objectFit: "cover",
    previewDisabled: true,
    // jika NImage gagal load (403/404/hotlink), set ke placeholder
    imgProps: {
      referrerpolicy: "no-referrer",
      onError: (e) => {
        if (e?.target) e.target.src = PLACEHOLDER_SVG;
      },
    },
    // beberapa versi Naive UI mendukung fallbackSrc:
    fallbackSrc: PLACEHOLDER_SVG,
  });
};

/** kolom table */
const columns = [
  { title: "Title", key: "title", render: (r) => dash(r.title) },
  { title: "Category", key: "category", render: (r) => dash(r.category) },
  { title: "City", key: "city", render: (r) => dash(r.city) },
  { title: "Province", key: "province", render: (r) => dash(r.province) },
  { title: "Created", key: "_created_date", render: (r) => fmtDate(r?._created_date) },
  {
    title: "Action",
    key: "actions",
    render(row) {
      return h("div", { class: "flex gap-2" }, [
        h(
          NButton,
          {
            size: "small",
            tertiary: true,
            onClick: () => router.push(`/super-admin/destinations/${row.id}`),
          },
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

onMounted(fetchDestinations);
</script>

<template>
  <atoms-container>
    <atoms-heading h3 class="mb-4">Destinations</atoms-heading>

    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <n-button type="primary" @click="router.push('/super-admin/destinations/submit')">
          Add Destination
        </n-button>
        <n-input
          v-model:value="$local.search"
          placeholder="Search title/desc/city/category..."
          class="w-72"
          clearable
        />
      </div>
    </div>

    <n-data-table
      :columns="columns"
      :data="paginatedData"
      :loading="$local.loading"
      :bordered="true"
      striped
      size="small"
      :row-key="(r) => r.id"
    />

    <div class="flex items-center justify-between mt-6">
      <span class="text-sm text-gray-500">
        Showing {{ paginatedData.length }} of {{ filteredData.length }} destinations
      </span>
      <n-pagination v-model:page="$local.page" :page-count="pageCount" />
    </div>
  </atoms-container>
</template>
