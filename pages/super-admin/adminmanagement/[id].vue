<!-- pages/super-admin/adminmanagement/[id].vue -->
<script setup>
import { useRoute, useRouter } from "vue-router";
import {
  NCard,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NTag,
  NSkeleton,
  useMessage,
} from "naive-ui";
import { ref, onMounted, reactive, computed, onBeforeUnmount } from "vue";
import { useUserStore } from "@/store/user";

/* ========== META ========== */
definePageMeta({
  path: "/super-admin/adminmanagement/:id",
  label: "Admin Detail",
  title: "Admin Detail",
  icon: "account",
  hidden: true,
  navigator: ({ _user }) => _user?.scope?.includes("super-admin"),
  validation: ({ _user }) => (_user?.scope?.includes("super-admin") ? true : "/"),
});

/* ========== ROUTER & STORE ========== */
const route = useRoute();
const router = useRouter();
const userId = route.params.id;
const $message = useMessage();
const $userStore = useUserStore();

// ⬇️ helper upload yang sama dengan signup
const { $uploadFile } = useNuxtApp();

/* ========== STATE ========== */
const loading = ref(false);
const submitting = ref(false);
const showChangePasswordForm = ref(false);
const userDetail = ref(null);
const original = ref(null);

/* ========== PHOTO PICKER STATE ========== */
const $uploadImage = ref(null); // ref input file hidden
const pickedPicture = ref(null); // { rawSource: File, source: previewUrl }
let _previewToRevoke = null;

const picturePreview = computed(() => {
  return pickedPicture.value?.source || userDetail.value?.picture || null;
});

const clearPickedPicture = () => {
  if (_previewToRevoke) {
    URL.revokeObjectURL(_previewToRevoke);
    _previewToRevoke = null;
  }
  pickedPicture.value = null;
};

const onPickPicture = (event) => {
  const file = event?.target?.files?.[0];
  if (!file) return;

  clearPickedPicture();

  const previewUrl = URL.createObjectURL(file);
  _previewToRevoke = previewUrl;

  pickedPicture.value = {
    rawSource: file,
    source: previewUrl,
  };

  // reset supaya bisa pilih file yang sama lagi
  event.target.value = "";
};

onBeforeUnmount(() => {
  clearPickedPicture();
});

/* ========== OPTIONS ========== */
const roleOptions = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
  { label: "Super Admin", value: "super-admin" },
];
const booleanOptions = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

/* ========== UTILS ========== */
const safe = (v) => (v === null || v === undefined || String(v).trim() === "" ? "-" : v);
const boolToVal = (v) => v === true || v === "true";
const fmtDate = (val) =>
  val ? new Date(val).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";
const normalizePic = (p) => {
  const s = (p ?? "").toString().trim().toLowerCase();
  if (!s || s === "null" || s === "undefined") return null;
  return p;
};

/* ========== FORM (Modal) ========== */
const form = reactive({ newPassword: "", confirmPassword: "" });

/* ========== MAP & COMPUTED ========== */
const mapUser = (u) => ({
  id: u?.id ?? u?.user_id ?? u?._id,
  picture: normalizePic(u?.picture ?? u?.avatar),

  first_name: u?.first_name ?? u?.firstname ?? "",
  last_name: u?.last_name ?? u?.lastname ?? "",
  username: u?.username ?? u?.name ?? "",
  email: u?.email ?? "",
  phone: u?.phone ?? u?.phone_number ?? "",

  role_title:
    u?.role_title ??
    u?.role ??
    u?.roles?.[0]?.title ??
    (Array.isArray(u?.roles) ? u.roles[0] : "") ??
    "",

  _is_email_verified: boolToVal(
    u?._is_email_verified ?? u?.is_email_verified ?? u?.email_verified ?? false,
  ),
  _is_phone_verified: boolToVal(
    u?._is_phone_verified ?? u?.is_phone_verified ?? u?.phone_verified ?? false,
  ),

  user_created_date: u?.user_created_date ?? u?.created_at ?? u?.createdAt ?? null,
  user_updated_date: u?.user_updated_date ?? u?.updated_at ?? u?.updatedAt ?? null,

  request_password_change: !!u?.request_password_change,
});

const displayName = computed(() => {
  if (!userDetail.value) return "-";
  const fn = (userDetail.value.first_name || "").trim();
  const ln = (userDetail.value.last_name || "").trim();
  const full = [fn, ln].filter(Boolean).join(" ").trim();
  return full || userDetail.value.username || "-";
});

/* ========== API ========== */
const fetchUser = async () => {
  loading.value = true;
  try {
    const res = await $userStore.get(userId); // GET /users/:id
    const raw = res?.result ?? res?.data ?? res;
    if (!raw) throw new Error("Empty response");

    userDetail.value = mapUser(raw);
    original.value = JSON.parse(JSON.stringify(userDetail.value));

    // reset picked picture saat load ulang
    clearPickedPicture();
  } catch (e) {
    console.error(e);
    userDetail.value = null;
    $message.error("Admin not found or failed to fetch data.");
  } finally {
    loading.value = false;
  }
};

const handleSubmitUpdate = async () => {
  if (!userDetail.value) return;
  if (!confirm("Yakin update data admin ini?")) return;

  submitting.value = true;
  try {
    // ⬇️ upload hanya kalau ada foto baru
    let finalPicture = userDetail.value.picture ?? "";
    if (pickedPicture.value?.rawSource) {
      finalPicture =
        (await $uploadFile(pickedPicture.value.rawSource, `users/${userId}`, "picture")) || "";
    }

    const payload = {
      username: userDetail.value.username ?? "",
      picture: finalPicture, // ⬅️ hasil upload
      role_title: userDetail.value.role_title ?? "",
      first_name: userDetail.value.first_name ?? "",
      last_name: userDetail.value.last_name ?? "",
      email: userDetail.value.email ?? "",
      phone: userDetail.value.phone ?? "",
      _is_email_verified:
        typeof userDetail.value._is_email_verified === "boolean"
          ? userDetail.value._is_email_verified
          : "",
      _is_phone_verified:
        typeof userDetail.value._is_phone_verified === "boolean"
          ? userDetail.value._is_phone_verified
          : "",
    };

    // tetap gunakan endpoint super-admin
    await $userStore.putSuperAdminUser(userId, payload); // PUT /super-admin/users/:id
    $message.success("Admin data updated successfully!");
    await fetchUser();
  } catch (e) {
    console.error(e);
    $message.error("Failed to update admin data.");
  } finally {
    submitting.value = false;
  }
};

const handleReset = () => {
  if (!original.value) return;
  userDetail.value = JSON.parse(JSON.stringify(original.value));
  clearPickedPicture();
  $message.info("Form dikembalikan ke data awal.");
};

const handleDeleteUser = async () => {
  if (!userDetail.value?.id) return;
  if (!confirm("Hapus admin ini? Tindakan tidak dapat dibatalkan.")) return;

  try {
    await $userStore.deleteSuperAdminUser(userDetail.value.id);
    $message.success("Admin deleted.");
    router.push("/super-admin/adminmanagement");
  } catch (e) {
    console.error(e);
    $message.error("Failed to delete admin.");
  }
};

const handleSubmitPassword = async () => {
  if (!form.newPassword || !form.confirmPassword) {
    $message.warning("Harap isi semua field password.");
    return;
  }
  if (form.newPassword !== form.confirmPassword) {
    $message.error("Password tidak cocok.");
    return;
  }
  try {
    await $userStore.putSuperAdminUserPassword(userId, { password: form.newPassword });
    $message.success("Password berhasil diperbarui.");
    showChangePasswordForm.value = false;
    form.newPassword = "";
    form.confirmPassword = "";
  } catch (e) {
    console.error(e);
    $message.error("Gagal memperbarui password.");
  }
};

const copyId = async () => {
  try {
    await navigator.clipboard.writeText(userDetail.value?.id || "");
    $message.success("ID disalin.");
  } catch {
    $message.error("Gagal menyalin ID.");
  }
};

onMounted(fetchUser);
</script>

<template>
  <atoms-container>
    <!-- Header -->
    <section class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div class="flex items-center gap-2">
        <atoms-icon name="account" :size="20" flat />
        <atoms-heading h3 class="mb-0">Admin Detail</atoms-heading>
      </div>
      <div class="flex items-center gap-2">
        <n-button quaternary @click="router.back()">Back</n-button>
      </div>
    </section>

    <!-- Card Content -->
    <n-card :segmented="{ content: true, footer: true }" class="shadow-sm rounded-2xl">
      <template #header>
        <div class="flex flex-wrap items-center justify-between w-full gap-3">
          <div class="flex items-center min-w-0 gap-2">
            <atoms-heading h5 class="mb-0 truncate">
              {{ userDetail ? displayName : "Loading…" }}
            </atoms-heading>
            <n-tag v-if="userDetail?.role_title" size="small" round :bordered="false">
              {{ userDetail.role_title }}
            </n-tag>
          </div>
          <div class="flex items-center gap-2">
            <atoms-text caption class="font-mono truncate"
              >ID: {{ safe(userDetail?.id) }}</atoms-text
            >
            <n-button size="tiny" tertiary @click="copyId">Copy</n-button>
          </div>
        </div>
      </template>

      <template #default>
        <div v-if="loading">
          <n-skeleton text :repeat="10" />
        </div>

        <section v-else-if="userDetail" class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <!-- Left: Profile -->
          <n-card size="small" class="rounded-xl md:sticky md:top-4 h-fit">
            <div class="flex items-center gap-4">
              <atoms-avatar
                :src="picturePreview"
                :zoom="false"
                sizes="84"
                :nickname="userDetail.username || 'admin'"
              />
              <div class="min-w-0">
                <div class="font-medium truncate">{{ displayName }}</div>
                <div class="text-xs text-gray-500 truncate">{{ userDetail.email || "-" }}</div>
                <div class="text-xs text-gray-500 truncate">{{ userDetail.phone || "-" }}</div>
              </div>
            </div>

            <atoms-divider class="my-4" />

            <div class="grid grid-cols-2 gap-3">
              <div>
                <atoms-text caption strong>Email Verified</atoms-text>
                <n-tag
                  size="small"
                  :type="userDetail._is_email_verified ? 'success' : 'default'"
                  round
                  :bordered="false"
                >
                  {{ userDetail._is_email_verified ? "Yes" : "No" }}
                </n-tag>
              </div>
              <div>
                <atoms-text caption strong>Phone Verified</atoms-text>
                <n-tag
                  size="small"
                  :type="userDetail._is_phone_verified ? 'success' : 'default'"
                  round
                  :bordered="false"
                >
                  {{ userDetail._is_phone_verified ? "Yes" : "No" }}
                </n-tag>
              </div>
              <div>
                <atoms-text caption strong>Created</atoms-text>
                <atoms-text>{{ fmtDate(userDetail.user_created_date) }}</atoms-text>
              </div>
              <div>
                <atoms-text caption strong>Updated</atoms-text>
                <atoms-text>{{ fmtDate(userDetail.user_updated_date) }}</atoms-text>
              </div>
            </div>

            <atoms-divider class="my-4" />

            <div class="flex flex-wrap gap-2">
              <n-button size="small" @click="handleReset">Reset</n-button>
              <n-button
                v-if="userDetail.request_password_change"
                size="small"
                type="warning"
                @click="showChangePasswordForm = true"
              >
                Change Password
              </n-button>
              <n-button size="small" type="error" secondary @click="handleDeleteUser">
                Delete
              </n-button>
            </div>
          </n-card>

          <!-- Right: Form -->
          <div class="md:col-span-2">
            <n-card size="small" class="rounded-xl">
              <template #header>
                <atoms-heading h5 class="mb-0">Edit Admin</atoms-heading>
              </template>

              <n-form :model="userDetail" label-placement="top">
                <!-- Account -->
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <n-form-item label="Username">
                    <n-input v-model:value="userDetail.username" placeholder="Username" />
                  </n-form-item>
                  <n-form-item label="Role (role_title)">
                    <n-select v-model:value="userDetail.role_title" :options="roleOptions" />
                  </n-form-item>
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <n-form-item label="First Name">
                    <n-input v-model:value="userDetail.first_name" placeholder="First Name" />
                  </n-form-item>
                  <n-form-item label="Last Name">
                    <n-input v-model:value="userDetail.last_name" placeholder="Last Name" />
                  </n-form-item>
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <n-form-item label="Email">
                    <n-input v-model:value="userDetail.email" placeholder="Email" />
                  </n-form-item>
                  <n-form-item label="Phone">
                    <n-input v-model:value="userDetail.phone" placeholder="Phone Number" />
                  </n-form-item>
                </div>

                <atoms-divider class="my-2" />

                <!-- Verification -->
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <n-form-item label="Email Verified">
                    <n-select
                      v-model:value="userDetail._is_email_verified"
                      :options="booleanOptions"
                    />
                  </n-form-item>
                  <n-form-item label="Phone Verified">
                    <n-select
                      v-model:value="userDetail._is_phone_verified"
                      :options="booleanOptions"
                    />
                  </n-form-item>
                </div>

                <atoms-divider class="my-2" />

                <!-- ✅ Picture (Photo Picker) -->
                <n-form-item label="Picture">
                  <div class="flex items-center gap-4">
                    <atoms-avatar
                      :src="picturePreview"
                      :zoom="false"
                      sizes="84"
                      :nickname="userDetail.username || 'admin'"
                    />

                    <div class="flex flex-col gap-2">
                      <input
                        type="file"
                        ref="$uploadImage"
                        class="hidden"
                        accept="image/png, image/jpeg, image/jpg, image/bmp, image/gif, image/webp"
                        @change="onPickPicture"
                      />

                      <div class="flex flex-wrap items-center gap-2">
                        <n-button size="small" tertiary @click="$uploadImage?.click()">
                          Pilih Foto
                        </n-button>

                        <n-button
                          v-if="pickedPicture"
                          size="small"
                          tertiary
                          type="warning"
                          @click="clearPickedPicture"
                        >
                          Batalkan
                        </n-button>
                      </div>

                      <atoms-text caption class="text-gray-500">
                        Foto akan diunggah saat klik <b>Save Changes</b>.
                      </atoms-text>
                    </div>
                  </div>
                </n-form-item>
              </n-form>

              <template #footer>
                <div class="flex items-center justify-between">
                  <atoms-text caption>Pastikan data sudah benar sebelum menyimpan.</atoms-text>
                  <div class="flex items-center gap-2">
                    <n-button @click="handleReset">Reset</n-button>
                    <n-button type="primary" :loading="submitting" @click="handleSubmitUpdate">
                      Save Changes
                    </n-button>
                  </div>
                </div>
              </template>
            </n-card>
          </div>
        </section>

        <div v-else class="text-gray-500">Admin tidak ditemukan.</div>
      </template>

      <template #footer>
        <div class="flex items-center justify-between">
          <atoms-text caption>Butuh log audit? Buka menu Logs di sidebar.</atoms-text>
          <div class="flex items-center gap-2">
            <n-button quaternary @click="router.back()">Back</n-button>
          </div>
        </div>
      </template>
    </n-card>

    <!-- Password Change Modal -->
    <n-modal v-model:show="showChangePasswordForm" title="Change Password" preset="dialog">
      <n-form :model="form" label-placement="top">
        <n-form-item label="New Password" path="newPassword">
          <n-input
            v-model:value="form.newPassword"
            type="password"
            show-password-on="mousedown"
            placeholder="Enter new password"
          />
        </n-form-item>

        <n-form-item label="Confirm Password" path="confirmPassword">
          <n-input
            v-model:value="form.confirmPassword"
            type="password"
            show-password-on="mousedown"
            placeholder="Confirm new password"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-button @click="showChangePasswordForm = false">Cancel</n-button>
        <n-button type="primary" class="ml-2" @click="handleSubmitPassword">Submit</n-button>
      </template>
    </n-modal>
  </atoms-container>
</template>
