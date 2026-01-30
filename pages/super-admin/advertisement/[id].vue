<script setup>
import { useRoute, useRouter } from "vue-router";
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NDatePicker,
  NButton,
  NImage,
  useMessage,
} from "naive-ui";
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useUserStore } from "@/store/user";

definePageMeta({
  path: "/super-admin/advertisements/:id",
  label: "Advertisement Detail",
  title: "Advertisement Detail",
  order: 8,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const route = useRoute();
const router = useRouter();
const $message = useMessage();
const $userStore = useUserStore();

const { $uploadFile } = useNuxtApp();

const id = route.params.id;

const safe = (v) => {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string" && v.trim() === "") return "-";
  return v;
};
const isoToTs = (iso) => (iso ? Date.parse(iso) : null);
const tsToIso = (ts) => (ts ? new Date(ts).toISOString() : null);

const loading = ref(false);
const original = ref(null);
const adv = ref({
  id: "",
  title: "",
  description: "",
  image: "", // string url dari server
  type: "",
  status: "active",
  start_date: "",
  end_date: "",
  link_target: "",
  priority: 1,
  created_at: "",
  updated_at: "",
});

// untuk NDatePicker (datetime, milisecond timestamp)
const startTs = ref(null);
const endTs = ref(null);

const mapAdv = (x) => ({
  id: x?.id ?? "",
  title: x?.title ?? "",
  description: x?.description ?? "",
  image: x?.image ?? "",
  type: x?.type ?? "",
  status: x?.status ?? "inactive",
  start_date: x?.start_date ?? "",
  end_date: x?.end_date ?? "",
  link_target: x?.link_target ?? "",
  priority: x?.priority ?? 1,
  created_at: x?.created_at ?? "",
  updated_at: x?.updated_at ?? "",
});

/* ==========================
   ✅ Single Photo Picker (Edit)
========================== */
const $uploadImage = ref(null); // input file hidden
const pickedImage = ref(null); // { rawSource: File, source: blobUrl, name }
let _blobToRevoke = null;

const previewImage = computed(() => {
  // prioritas: foto baru -> foto existing
  return pickedImage.value?.source || adv.value?.image || "";
});
const currentImage = computed(() => adv.value?.image || "");
const newImagePreview = computed(() => pickedImage.value?.source || "");

const onPickImage = (event) => {
  const file = event?.target?.files?.[0];
  if (!file) return;

  // cleanup blob sebelumnya
  if (_blobToRevoke) {
    URL.revokeObjectURL(_blobToRevoke);
    _blobToRevoke = null;
  }

  const blob = URL.createObjectURL(file);
  _blobToRevoke = blob;

  pickedImage.value = {
    rawSource: file,
    source: blob,
    name: file.name,
    size: file.size,
  };

  // reset agar bisa pilih file yg sama lagi
  event.target.value = "";
};

const clearPickedImage = () => {
  if (_blobToRevoke) {
    URL.revokeObjectURL(_blobToRevoke);
    _blobToRevoke = null;
  }
  pickedImage.value = null;
};

onBeforeUnmount(() => {
  clearPickedImage();
});

const fetchDetail = async () => {
  loading.value = true;
  try {
    const res = await $userStore.get(`/super-admin/advertisements/${id}`);
    const raw = res?.result ?? res?.data ?? res;

    adv.value = mapAdv(raw);
    original.value = JSON.parse(JSON.stringify(adv.value));

    startTs.value = isoToTs(adv.value.start_date);
    endTs.value = isoToTs(adv.value.end_date);

    // reset pilihan foto baru saat reload data
    clearPickedImage();
  } catch (e) {
    console.error(e);
    $message.error("Gagal memuat advertisement.");
  } finally {
    loading.value = false;
  }
};

const TYPE_OPTIONS = [
  { label: "Homepage", value: "homepage" },
  { label: "Top", value: "top" },
  { label: "Banner", value: "banner" },
  { label: "Sidebar", value: "sidebar" },
  { label: "Popup", value: "popup" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const handleSubmit = async () => {
  // sync datepicker -> ISO
  const next = { ...adv.value };
  next.start_date = tsToIso(startTs.value) ?? "";
  next.end_date = tsToIso(endTs.value) ?? "";

  try {
    loading.value = true;

    // ⬇️ jika user pilih foto baru, upload dulu
    let finalImage = next.image || "";
    if (pickedImage.value?.rawSource) {
      finalImage =
        (await $uploadFile(pickedImage.value.rawSource, `advertisements/${id}`, "image")) || "";
      next.image = finalImage;
    }

    // buat payload diff vs original
    const payload = {};
    Object.keys(next).forEach((k) => {
      if (k === "id" || k === "created_at" || k === "updated_at") return;
      if (next[k] !== original.value[k]) payload[k] = next[k];
    });

    if (Object.keys(payload).length === 0) {
      $message.warning("Tidak ada perubahan untuk disimpan.");
      return;
    }

    await $userStore.put(`/super-admin/advertisements/${id}`, payload);
    $message.success("Advertisement updated successfully!");
    await fetchDetail();
  } catch (e) {
    console.error(e);
    $message.error("Gagal update advertisement.");
  } finally {
    loading.value = false;
  }
};

const handleDelete = async () => {
  if (!confirm("Hapus advertisement ini? Tindakan tidak dapat dibatalkan.")) return;
  try {
    await $userStore.del(`/super-admin/advertisements/${id}`);
    $message.success("Advertisement deleted.");
    router.push("/super-admin/advertisements");
  } catch (e) {
    console.error(e);
    $message.error("Gagal menghapus advertisement.");
  }
};

onMounted(fetchDetail);
</script>

<template>
  <atoms-container>
    <atoms-heading h3 class="mb-4">Advertisement Detail</atoms-heading>

    <n-card class="space-y-6 border border-primary bg-primary/5">
      <div v-if="loading">Loading...</div>

      <n-form v-else :model="adv" label-placement="top" require-mark-placement="right-hanging">
        <n-form-item label="Title">
          <n-input v-model:value="adv.title" placeholder="Title" />
        </n-form-item>

        <n-form-item label="Description">
          <n-input
            v-model:value="adv.description"
            type="textarea"
            placeholder="Write description..."
          />
        </n-form-item>

        <n-form-item label="Type">
          <n-select v-model:value="adv.type" :options="TYPE_OPTIONS" placeholder="Select type" />
        </n-form-item>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <n-form-item label="Start Date/Time">
            <n-date-picker v-model:value="startTs" type="datetime" style="width: 100%" />
          </n-form-item>

          <n-form-item label="End Date/Time">
            <n-date-picker v-model:value="endTs" type="datetime" style="width: 100%" />
          </n-form-item>
        </div>

        <n-form-item label="Link Target">
          <n-input v-model:value="adv.link_target" placeholder="https://..." />
        </n-form-item>

        <n-form-item label="Image">
          <div class="flex flex-col gap-3">
            <input
              ref="$uploadImage"
              type="file"
              class="hidden"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/bmp"
              @change="onPickImage"
            />

            <div class="flex flex-wrap items-center gap-2">
              <n-button tertiary :disabled="loading" @click="$uploadImage?.click()">
                Ganti Foto
              </n-button>

              <n-button
                v-if="pickedImage"
                tertiary
                type="warning"
                :disabled="loading"
                @click="clearPickedImage"
              >
                Batalkan Foto Baru
              </n-button>
            </div>

            <!-- ✅ Foto yang sekarang (server) -->
            <div v-if="adv.image" class="space-y-1">
              <div class="text-xs text-gray-600">Foto saat ini</div>
              <n-image :src="adv.image" width="260" preview-disabled class="rounded-lg" />
            </div>

            <!-- ✅ Preview foto baru (hanya kalau pilih file) -->
            <div v-if="pickedImage?.source" class="space-y-1">
              <div class="text-xs text-gray-600">Preview foto baru (akan diupload saat Submit)</div>
              <n-image :src="pickedImage.source" width="260" preview-disabled class="rounded-lg" />
            </div>

            <!-- kalau tidak ada gambar sama sekali -->
            <div v-if="!adv.image && !pickedImage?.source" class="text-xs text-gray-500">
              Belum ada foto.
            </div>
          </div>
        </n-form-item>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <n-form-item label="Status">
            <n-select
              v-model:value="adv.status"
              :options="STATUS_OPTIONS"
              placeholder="Select status"
            />
          </n-form-item>

          <n-form-item label="Priority">
            <n-input-number v-model:value="adv.priority" :min="1" style="width: 120px" />
          </n-form-item>
        </div>

        <div class="flex gap-4">
          <n-button type="primary" :loading="loading" @click="handleSubmit"
            >Submit Changes</n-button
          >
          <n-button type="error" secondary @click="handleDelete">Delete Advertisement</n-button>
          <n-button @click="router.push('/super-admin/advertisements')">Back</n-button>
        </div>

        <div class="grid grid-cols-1 gap-2 mt-6 text-sm text-gray-600 md:grid-cols-2">
          <div><b>ID:</b> {{ safe(adv.id) }}</div>
          <div><b>Created:</b> {{ safe(adv.created_at) }}</div>
          <div><b>Updated:</b> {{ safe(adv.updated_at) }}</div>
        </div>
      </n-form>
    </n-card>
  </atoms-container>
</template>
