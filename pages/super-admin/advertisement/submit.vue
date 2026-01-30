<script setup>
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NDatePicker,
  NButton,
  NCard,
  NImage,
  useMessage,
} from "naive-ui";
import { ref, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";

definePageMeta({
  path: "/super-admin/advertisements/submit",
  label: "Add Advertisement",
  title: "Add Advertisement",
  order: 8,
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

const router = useRouter();
const $message = useMessage();
const $userStore = useUserStore();

// ⬇️ upload helper
const { $uploadFile } = useNuxtApp();

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

const loading = ref(false);
const startTs = ref(null);
const endTs = ref(null);

const form = ref({
  title: "",
  description: "",
  image: "", // ✅ akan diisi hasil upload (string)
  type: "",
  status: "active",
  start_date: "",
  end_date: "",
  link_target: "",
  priority: 1,
});

const tsToIso = (ts) => (ts ? new Date(ts).toISOString() : null);

/* ==========================
   ✅ Single Photo Picker
========================== */
const $uploadImage = ref(null); // input file hidden
const pickedImage = ref(null); // { rawSource: File, source: blobUrl, name }
let _blobToRevoke = null;

const onPickImage = (event) => {
  const file = event?.target?.files?.[0];
  if (!file) return;

  // cleanup sebelumnya
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

const submit = async () => {
  loading.value = true;
  try {
    // ✅ wajib ada gambar
    if (!pickedImage.value?.rawSource) {
      $message.warning("Mohon pilih 1 foto untuk advertisement.");
      return;
    }

    // ⬇️ upload saat submit
    const uploadedImage =
      (await $uploadFile(pickedImage.value.rawSource, `advertisements/${Date.now()}`, "image")) ||
      "";

    const payload = {
      title: form.value.title || "",
      description: form.value.description || "",
      image: uploadedImage, // ✅ hasil upload
      type: form.value.type || "",
      status: form.value.status || "inactive",
      start_date: tsToIso(startTs.value) || "",
      end_date: tsToIso(endTs.value) || "",
      link_target: form.value.link_target || "",
      priority: form.value.priority ?? 1,
    };

    await $userStore.post("/super-admin/advertisements", payload);
    $message.success("Advertisement successfully added.");

    // bersihkan preview
    clearPickedImage();

    router.push("/super-admin/advertisements");
  } catch (e) {
    console.error(e);
    $message.error("Gagal menambahkan advertisement.");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <atoms-container>
    <section class="flex items-center justify-between mb-6">
      <atoms-heading h2>Add New Advertisement</atoms-heading>
      <n-button @click="router.push('/super-admin/advertisements')">Back</n-button>
    </section>

    <n-card class="border border-primary bg-primary/5">
      <n-form :model="form" label-placement="top" require-mark-placement="right-hanging">
        <n-form-item label="Title">
          <n-input v-model:value="form.title" placeholder="Enter advertisement title" />
        </n-form-item>

        <n-form-item label="Description">
          <n-input v-model:value="form.description" type="textarea" placeholder="Description..." />
        </n-form-item>

        <!-- ✅ Image Picker (1 photo) -->
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
                Pilih Foto
              </n-button>
              <n-button
                v-if="pickedImage"
                tertiary
                type="warning"
                :disabled="loading"
                @click="clearPickedImage"
              >
                Remove
              </n-button>
              <span class="text-xs text-gray-500">
                {{ pickedImage?.name || "Belum ada foto dipilih" }}
              </span>
            </div>

            <div v-if="pickedImage?.source" class="w-fit">
              <n-image :src="pickedImage.source" width="260" preview-disabled class="rounded-lg" />
              <div class="mt-1 text-xs text-gray-500">
                Foto akan diupload saat klik <b>Submit</b>.
              </div>
            </div>
          </div>
        </n-form-item>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <n-form-item label="Type">
            <n-select v-model:value="form.type" :options="TYPE_OPTIONS" placeholder="Select type" />
          </n-form-item>

          <n-form-item label="Status">
            <n-select v-model:value="form.status" :options="STATUS_OPTIONS" />
          </n-form-item>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <n-form-item label="Start Date/Time">
            <n-date-picker v-model:value="startTs" type="datetime" style="width: 100%" />
          </n-form-item>

          <n-form-item label="End Date/Time">
            <n-date-picker v-model:value="endTs" type="datetime" style="width: 100%" />
          </n-form-item>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <n-form-item label="Link Target">
            <n-input v-model:value="form.link_target" placeholder="https://example.com" />
          </n-form-item>

          <n-form-item label="Priority">
            <n-input-number v-model:value="form.priority" :min="1" style="width: 120px" />
          </n-form-item>
        </div>

        <div class="flex justify-end mt-6">
          <n-button type="primary" :loading="loading" @click="submit">Submit</n-button>
        </div>
      </n-form>
    </n-card>
  </atoms-container>
</template>
