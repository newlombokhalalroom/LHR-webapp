<!-- pages/super-admin/destinations/submit.vue -->
<script setup>
import { ref, reactive, nextTick, watch, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NModal,
  NImage,
  NSkeleton,
  useMessage,
} from "naive-ui";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";
import useApi from "@/composables/useApi";

definePageMeta({
  path: "/super-admin/destinations/submit",
  label: "Add Destination",
  title: "Add Destination",
  order: 9,
  validation: ({ _user }) => (!_user ? true : _user?.scope?.includes("super-admin") ? true : "/"),
});

const router = useRouter();
const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);
const $message = useMessage();
const { $api } = useApi();

// ⬇️ helper upload (sama seperti signup)
const { $uploadFile } = useNuxtApp();

watch(
  () => $dataUser.value,
  (u) => {
    if (u && !u?.scope?.includes?.("super-admin")) router.replace("/");
  },
  { immediate: true }
);

// ====== FORM ======
const form = reactive({
  title: "",
  description: "",
  category: "",
  address: "",
  city: "",
  province: "",
  latitude: null,
  longitude: null,
});

// ====== MULTI PHOTO PICKER ======
const $uploadImages = ref(null); // ref input file hidden (multiple)
const pickedPictures = ref([]); // [{ rawSource: File, source: previewUrl }]

const addFilesToPictures = (files = []) => {
  for (const file of files) {
    if (!file) continue;

    // optional: filter jenis file (sudah dibantu oleh accept, tapi ini extra guard)
    if (!String(file.type || "").startsWith("image/")) continue;

    const previewUrl = URL.createObjectURL(file);
    pickedPictures.value.push({
      rawSource: file,
      source: previewUrl,
      name: file.name,
      size: file.size,
    });
  }
};

const onPickPictures = (event) => {
  const files = Array.from(event?.target?.files || []);
  if (!files.length) return;
  addFilesToPictures(files);

  // reset supaya bisa pilih file yang sama lagi
  event.target.value = "";
};

const removePickedPicture = (idx) => {
  const item = pickedPictures.value?.[idx];
  if (item?.source) URL.revokeObjectURL(item.source);
  pickedPictures.value.splice(idx, 1);
};

const clearAllPictures = () => {
  for (const p of pickedPictures.value) {
    if (p?.source) URL.revokeObjectURL(p.source);
  }
  pickedPictures.value = [];
};

onBeforeUnmount(() => {
  clearAllPictures();
});

// ====== MAP PICKER (Leaflet) ======
const showMap = ref(false);
let map, marker;

const ensureLeafletLoaded = () =>
  new Promise((resolve) => {
    if (window.L) return resolve();
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    js.onload = () => resolve();
    document.body.appendChild(js);
  });

const openMap = async () => {
  showMap.value = true;
  await nextTick();
  await ensureLeafletLoaded();
  const center = [form.latitude ?? -8.65, form.longitude ?? 116.31];
  map = window.L.map("dest-map-add", { center, zoom: 11 });
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OSM",
  }).addTo(map);
  marker = window.L.marker(center, { draggable: true }).addTo(map);
  const setPos = (latlng) => {
    marker.setLatLng(latlng);
    form.latitude = +latlng.lat.toFixed(6);
    form.longitude = +latlng.lng.toFixed(6);
  };
  marker.on("moveend", (e) => setPos(e.target.getLatLng()));
  map.on("click", (e) => setPos(e.latlng));
};

const closeMap = () => {
  showMap.value = false;
  setTimeout(() => {
    if (map) {
      map.remove();
      map = null;
      marker = null;
    }
  }, 0);
};

// ====== SUBMIT ======
const saving = ref(false);
const toNumOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

const uploadAllPictures = async (destinationIdOrTemp = null) => {
  // kalau tidak ada foto, return []
  if (!pickedPictures.value?.length) return [];

  // path folder: destinations/<id atau temp>
  const folderId = destinationIdOrTemp || `temp-${Date.now()}`;

  // upload serial biar aman (kalau mau paralel, ganti jadi Promise.all)
  const uploaded = [];
  for (let i = 0; i < pickedPictures.value.length; i++) {
    const file = pickedPictures.value[i]?.rawSource;
    if (!file) continue;

    const url = (await $uploadFile(file, `destinations/${folderId}`, `picture-${i + 1}`)) || null;
    if (url) uploaded.push(url);
  }
  return uploaded;
};

const handleCreate = async () => {
  if (!form.title || !form.category) {
    $message.warning("Mohon isi Title & Category.");
    return;
  }
  if (form.latitude == null || form.longitude == null) {
    $message.warning("Mohon pilih lokasi pada peta.");
    return;
  }

  saving.value = true;
  try {
    // ⬇️ upload foto dulu, baru kirim payload
    // kalau backend kamu generate destinationId sendiri, pakai folder temp dulu
    const uploadedPictures = await uploadAllPictures(null);

    const payload = {
      title: form.title || null,
      description: form.description || null,
      category: form.category || null,
      address: form.address || null,
      city: form.city || null,
      province: form.province || null,
      latitude: toNumOrNull(form.latitude),
      longitude: toNumOrNull(form.longitude),
      pictures: uploadedPictures, // ✅ array string hasil upload
    };

    await $api.post("/super-admin/destinations", payload);
    $message.success("Destination berhasil ditambahkan.");

    // bersihkan foto (revoke URL)
    clearAllPictures();

    router.push("/super-admin/destinations");
  } catch (e) {
    console.error(e);
    $message.error(e?.response?.data?.message || "Gagal menambahkan destination.");
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <atoms-container>
    <n-card class="mb-4 border border-primary bg-primary/5" title="Add Destination">
      <n-form label-placement="top" require-mark-placement="right-hanging">
        <n-form-item label="Title">
          <n-input v-model:value="form.title" placeholder="Title" />
        </n-form-item>

        <n-form-item label="Description">
          <n-input v-model:value="form.description" type="textarea" placeholder="Description" />
        </n-form-item>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <n-form-item label="Category">
            <n-input v-model:value="form.category" placeholder="e.g., beach" />
          </n-form-item>

          <n-form-item label="Address">
            <n-input v-model:value="form.address" placeholder="Full address" />
          </n-form-item>

          <n-form-item label="City">
            <n-input v-model:value="form.city" placeholder="City" />
          </n-form-item>

          <n-form-item label="Province">
            <n-input v-model:value="form.province" placeholder="Province" />
          </n-form-item>

          <n-form-item label="Coordinates">
            <div class="flex w-full gap-2">
              <n-input v-model:value="form.latitude" placeholder="Latitude" class="w-1/2" />
              <n-input v-model:value="form.longitude" placeholder="Longitude" class="w-1/2" />
              <n-button class="whitespace-nowrap" @click="openMap">Pick on Map</n-button>
            </div>
          </n-form-item>
        </div>

        <!-- ✅ Multi Photo Picker -->
        <n-form-item label="Pictures (Upload)">
          <div class="w-full">
            <!-- hidden input multiple -->
            <input
              ref="$uploadImages"
              type="file"
              class="hidden"
              multiple
              accept="image/png, image/jpeg, image/jpg, image/bmp, image/gif, image/webp"
              @change="onPickPictures"
            />

            <div class="flex flex-wrap items-center gap-2 mb-3">
              <n-button tertiary @click="$uploadImages?.click()"> Pilih Foto (Multi) </n-button>
              <n-button
                v-if="pickedPictures.length"
                tertiary
                type="warning"
                @click="clearAllPictures"
              >
                Hapus Semua
              </n-button>

              <span class="text-xs text-gray-500">
                {{
                  pickedPictures.length ? `${pickedPictures.length} foto dipilih` : "Belum ada foto"
                }}
              </span>
            </div>

            <!-- Preview grid -->
            <div v-if="pickedPictures.length" class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div
                v-for="(pic, idx) in pickedPictures"
                :key="pic.source + idx"
                class="relative overflow-hidden bg-white border rounded-xl"
              >
                <n-image
                  :src="pic.source"
                  alt="destination photo"
                  width="100%"
                  height="120"
                  object-fit="cover"
                  preview-disabled
                />
                <div
                  class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2 bg-black/40"
                >
                  <span class="text-[10px] text-white truncate">
                    {{ pic.name }}
                  </span>
                  <n-button size="tiny" type="error" secondary @click="removePickedPicture(idx)">
                    Remove
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </n-form-item>

        <div class="flex gap-3 mt-4">
          <n-button type="primary" :loading="saving" @click="handleCreate">Create</n-button>
          <n-button @click="router.push('/super-admin/destinations')">Back</n-button>
        </div>
      </n-form>
    </n-card>

    <!-- Map Modal -->
    <n-modal v-model:show="showMap" preset="dialog" title="Pick Location on Map">
      <div
        id="dest-map-add"
        style="width: 100%; height: 380px; border-radius: 12px; overflow: hidden"
      ></div>
      <template #action>
        <n-button @click="closeMap">Done</n-button>
      </template>
    </n-modal>
  </atoms-container>
</template>
