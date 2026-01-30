<!-- pages/super-admin/destinations/[id].vue -->
<script setup>
import { ref, reactive, onMounted, nextTick, watch, onBeforeUnmount, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { NCard, NForm, NFormItem, NInput, NButton, NModal, NImage, useMessage } from "naive-ui";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";
import useApi from "@/composables/useApi";

definePageMeta({
  path: "/super-admin/destinations/:id",
  label: "Destination Detail",
  title: "Destination Detail",
  order: 9,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin") ?? true,
  validation: ({ _user }) => (!_user ? true : _user?.scope?.includes("super-admin") ? true : "/"),
});

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);
const $message = useMessage();
const { $api } = useApi();

// ⬇️ upload helper
const { $uploadFile } = useNuxtApp();

watch(
  () => $dataUser.value,
  (u) => {
    if (u && !u?.scope?.includes?.("super-admin")) router.replace("/");
  },
  { immediate: true }
);

const loading = ref(false);
const saving = ref(false);
const removing = ref(false);

const form = reactive({
  title: "",
  description: "",
  category: "",
  address: "",
  city: "",
  province: "",
  latitude: null,
  longitude: null,
  _created_date: null,
  _updated_date: null,
});

/* ==========================
   ✅ Pictures: existing + new
========================== */
const existingPictures = ref([]); // string[] url dari server
const $uploadImages = ref(null); // input file hidden multiple
const pickedPictures = ref([]); // [{ rawSource: File, source: blobUrl, name }]

const normalizePictures = (p) => {
  if (!p) return [];
  if (Array.isArray(p)) {
    return p
      .map((x) => (typeof x === "string" ? x : x?.picture))
      .filter((s) => typeof s === "string" && s.trim() !== "");
  }
  return [];
};

const clearPickedPictures = () => {
  for (const p of pickedPictures.value) {
    if (p?.source) URL.revokeObjectURL(p.source);
  }
  pickedPictures.value = [];
};

const onPickPictures = (event) => {
  const files = Array.from(event?.target?.files || []);
  if (!files.length) return;

  for (const file of files) {
    if (!file) continue;
    if (!String(file.type || "").startsWith("image/")) continue;

    const blob = URL.createObjectURL(file);
    pickedPictures.value.push({
      rawSource: file,
      source: blob,
      name: file.name,
      size: file.size,
    });
  }

  // reset input agar bisa pilih file yang sama lagi
  event.target.value = "";
};

const removeExistingPicture = (idx) => {
  existingPictures.value.splice(idx, 1);
};

const removePickedPicture = (idx) => {
  const item = pickedPictures.value?.[idx];
  if (item?.source) URL.revokeObjectURL(item.source);
  pickedPictures.value.splice(idx, 1);
};

onBeforeUnmount(() => {
  clearPickedPictures();
});

/* ===== Leaflet Map Picker ===== */
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
  map = window.L.map("dest-map-detail", { center, zoom: 11 });
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

/* ===== Helpers ===== */
const numOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
const fmtDate = (v) =>
  v ? new Date(v).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

/* ===== Fetch Detail ===== */
const fetchDetail = async () => {
  loading.value = true;
  try {
    let res = null;
    try {
      res = await $api.get(`/destinations/${id}`);
    } catch (err) {
      if (err?.response?.status !== 404) throw err;
    }
    let d = res?.result ?? res?.data ?? res;

    if (!d) {
      const resAll = await $api.get(`/destinations`);
      const arr = resAll?.result ?? resAll?.data ?? resAll ?? [];
      d = Array.isArray(arr) ? arr.find((x) => x?.id === id) : null;
    }
    if (!d) throw new Error("Destination not found");

    form.title = d?.title || "";
    form.description = d?.description || "";
    form.category = d?.category || "";
    form.address = d?.address || "";
    form.city = d?.city || "";
    form.province = d?.province || "";

    form.latitude = d?.latitude ?? d?.coordinate?.y ?? null;
    form.longitude = d?.longitude ?? d?.coordinate?.x ?? null;

    form._created_date = d?._created_date || d?.created_at || null;
    form._updated_date = d?._updated_date || d?.updated_at || null;

    // ✅ tampilkan foto existing
    existingPictures.value = normalizePictures(d?.pictures) || (d?.picture ? [d.picture] : []);

    // reset foto baru setiap fetch
    clearPickedPictures();
  } catch (e) {
    console.error(e);
    $message.error("Gagal memuat destination.");
  } finally {
    loading.value = false;
  }
};

/* ===== Upload new images then merge ===== */
const uploadNewPictures = async () => {
  if (!pickedPictures.value?.length) return [];

  const uploaded = [];
  for (let i = 0; i < pickedPictures.value.length; i++) {
    const file = pickedPictures.value[i]?.rawSource;
    if (!file) continue;

    const url =
      (await $uploadFile(file, `destinations/${id}`, `picture-${Date.now()}-${i + 1}`)) || null;
    if (url) uploaded.push(url);
  }
  return uploaded;
};

/* ===== Update ===== */
const handleSave = async () => {
  saving.value = true;
  try {
    // 1) upload foto baru (kalau ada)
    const uploadedNew = await uploadNewPictures();

    // 2) gabungkan existing (yang tidak dihapus) + foto baru
    const finalPictures = [...(existingPictures.value || []), ...(uploadedNew || [])].filter(
      (s) => String(s || "").trim() !== ""
    );

    const payload = {
      title: form.title || null,
      description: form.description || null,
      category: form.category || null,
      address: form.address || null,
      city: form.city || null,
      province: form.province || null,
      latitude: numOrNull(form.latitude),
      longitude: numOrNull(form.longitude),
      pictures: finalPictures,
    };

    await $api.put(`/super-admin/destinations/${id}`, payload);
    $message.success("Destination berhasil diupdate.");

    // refresh + bersihkan picked
    await fetchDetail();
  } catch (e) {
    console.error(e);
    $message.error(e?.response?.data?.message || "Gagal update destination.");
  } finally {
    saving.value = false;
  }
};

/* ===== Delete ===== */
const handleDelete = async () => {
  if (!confirm("Yakin hapus destination ini?")) return;
  removing.value = true;
  try {
    await $api.delete(`/super-admin/destinations/${id}`);
    $message.success("Destination berhasil dihapus.");
    router.push("/super-admin/destinations");
  } catch (e) {
    console.error(e);
    $message.error(e?.response?.data?.message || "Gagal hapus destination.");
  } finally {
    removing.value = false;
  }
};

onMounted(fetchDetail);
</script>

<template>
  <atoms-container>
    <n-card
      class="mb-4 border border-primary bg-primary/5"
      :title="form.title || 'Destination Detail'"
    >
      <div v-if="loading" class="text-gray-500">Loading...</div>

      <div v-else>
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

          <!-- ✅ Existing + New pictures -->
          <n-form-item label="Pictures">
            <div class="w-full">
              <!-- file input hidden -->
              <input
                ref="$uploadImages"
                type="file"
                class="hidden"
                multiple
                accept="image/png, image/jpeg, image/jpg, image/bmp, image/gif, image/webp"
                @change="onPickPictures"
              />

              <div class="flex flex-wrap items-center gap-2 mb-3">
                <n-button tertiary @click="$uploadImages?.click()">Tambah Foto (Multi)</n-button>
                <n-button
                  v-if="pickedPictures.length"
                  tertiary
                  type="warning"
                  @click="clearPickedPictures"
                >
                  Batalkan Foto Baru
                </n-button>

                <span class="text-xs text-gray-500">
                  Existing: {{ existingPictures.length }} • New: {{ pickedPictures.length }}
                </span>
              </div>

              <!-- Existing photos -->
              <div v-if="existingPictures.length" class="mb-4">
                <div class="mb-2 text-xs text-gray-600">Foto yang sudah ada (server)</div>
                <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div
                    v-for="(src, idx) in existingPictures"
                    :key="src + idx"
                    class="relative overflow-hidden bg-white border rounded-xl"
                  >
                    <n-image
                      :src="src"
                      width="100%"
                      height="120"
                      object-fit="cover"
                      preview-disabled
                    />
                    <div
                      class="absolute inset-x-0 bottom-0 flex items-center justify-end p-2 bg-black/40"
                    >
                      <n-button
                        size="tiny"
                        type="error"
                        secondary
                        @click="removeExistingPicture(idx)"
                      >
                        Remove
                      </n-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- New picked photos -->
              <div v-if="pickedPictures.length">
                <div class="mb-2 text-xs text-gray-600">Foto baru (akan diupload saat Save)</div>
                <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div
                    v-for="(pic, idx) in pickedPictures"
                    :key="pic.source + idx"
                    class="relative overflow-hidden bg-white border rounded-xl"
                  >
                    <n-image
                      :src="pic.source"
                      width="100%"
                      height="120"
                      object-fit="cover"
                      preview-disabled
                    />
                    <div
                      class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2 bg-black/40"
                    >
                      <span class="text-[10px] text-white truncate">{{ pic.name }}</span>
                      <n-button
                        size="tiny"
                        type="error"
                        secondary
                        @click="removePickedPicture(idx)"
                      >
                        Remove
                      </n-button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="!existingPictures.length && !pickedPictures.length"
                class="text-xs text-gray-500"
              >
                Belum ada foto.
              </div>
            </div>
          </n-form-item>

          <div class="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
            <n-form-item label="Created At"
              ><p>{{ fmtDate(form._created_date) }}</p></n-form-item
            >
            <n-form-item label="Updated At"
              ><p>{{ fmtDate(form._updated_date) }}</p></n-form-item
            >
          </div>

          <div class="flex gap-3 mt-4">
            <n-button type="primary" :loading="saving" @click="handleSave">Save Changes</n-button>
            <n-button type="error" secondary :loading="removing" @click="handleDelete"
              >Delete</n-button
            >
            <n-button @click="router.push('/super-admin/destinations')">Back</n-button>
          </div>
        </n-form>
      </div>
    </n-card>

    <!-- Map Modal -->
    <n-modal v-model:show="showMap" preset="dialog" title="Pick Location on Map">
      <div
        id="dest-map-detail"
        style="width: 100%; height: 380px; border-radius: 12px; overflow: hidden"
      ></div>
      <template #action>
        <n-button @click="closeMap">Done</n-button>
      </template>
    </n-modal>
  </atoms-container>
</template>
