<script setup>
import {
  NButton,
  NSpace,
  NForm,
  useLoadingBar,
  NImage,
  NCard,
  NAlert,
  NSkeleton,
  NCollapseTransition,
  useNotification,
} from "naive-ui";
import { required, email, minLength, helpers } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { useUserStore } from "@/store/user";
import { v4 } from "uuid";

import { useClientStore } from "@/store/client";
import { storeToRefs } from "pinia";

let $userStore = useUserStore();
let { data: $dataUser } = storeToRefs($userStore);

let $clientStore = useClientStore();
let { data: $dataClient } = storeToRefs($clientStore);

const { $objectSetNull, $trim, $uploadFile } = useNuxtApp();
const { $pushToQueue } = useQueue();
const { $createError } = useError();
const $notification = useNotification();
const $breakpoint = useBreakpoint();
const $loadingBar = useLoadingBar();
const $refPicture = ref(null);
const $uploadImage = ref(null); // ⬅️ NEW: ref untuk input file
const router = useRouter();
const route = useRoute();
const $meta = ref({
  href: `${route.fullPath}`,
  title: "Sign Up to be Lombokhalalroom partner",
  description: "Create your account to gain more features",
});

definePageMeta({
  label: "Sign Up Client",
  layout: "auth",
  validation: async ({ _user }) => {
    if (_user?.id) {
      return "/";
    }
    return null;
  },
});

useHead({
  title: $meta.value.title,
  meta: [
    {
      name: "description",
      content: $meta.value.description,
    },
    {
      rel: "canonical",
      href: $meta.value.href,
    },
    {
      rel: "amphtml",
      href: $meta.value.href,
    },
    // google
    {
      itemprop: "name",
      content: $meta.value.title,
    },
    {
      itemprop: "description",
      content: $meta.value.description,
    },
    {
      itemprop: "image",
      content: "image/here",
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    { name: "twitter:site", content: route.fullPath },
    {
      name: "twitter:title",
      content: $meta.value.title,
    },
    {
      name: "twitter:description",
      content: $meta.value.description,
    },
    {
      name: "twitter:image",
      content: "image/here",
    },
    {
      name: "twitter:image:alt",
      content: $meta.value.title,
    },
    {
      name: "twitter:url",
      content: $meta.value.href,
    },
    // Open Graph
    { property: "og:site_name", content: route.fullPath },
    { property: "og:type", content: "website" },
    {
      property: "og:title",
      content: $meta.value.title,
    },
    {
      property: "og:description",
      content: $meta.value.description,
    },
    {
      property: "og:image",
      content: "image/here",
    },
    {
      property: "og:url",
      content: $meta.value.href,
    },
    {
      property: "og:image:secure_url",
      content: "image/here",
    },
    {
      property: "og:image:alt",
      content: $meta.value.title,
    },
  ],
  link: [
    {
      rel: "canonical",
      href: $meta.value.href,
    },
    {
      rel: "amphtml",
      href: $meta.value.href,
    },
  ],
});

const $local = reactive({
  mainLoading: false,
  isPictureZoom: false,
  openImageEditor: false,
  errors: null,

  selectedType: null,
  dataTypes: null,
});

const $model = reactive({
  email: null,
  username: null,
  phone: null,
  npwp: null,
  description: null,
  password: null,
  confirmPassword: null,
});

const $form = useVuelidate(
  {
    email: {
      required,
      email: helpers.withMessage(
        ({ $pending, $invalid, $params, $model: _model }) => `${_model} not an email`,
        email
      ),
    },
    phone: {
      required,
      minLength: helpers.withMessage(() => `Have at least 6 digit`, minLength(11)),
    },
    npwp: {
      required,
      minLength: helpers.withMessage(() => `Have at least 15 length`, minLength(8)),
    },
    description: {
      required,
    },
    username: {
      required,
      minLength: helpers.withMessage(() => `Have at least 5 characters`, minLength(5)),
    },
    password: {
      required,
      minLength: helpers.withMessage(() => `Have at least 8 characters`, minLength(8)),
    },
    confirmPassword: {
      custom: helpers.withMessage(
        () => `Password does not match`,
        (_value) => (_value && _value == $model.password) || false
      ),
    },
  },
  $model
);

const $isLoading = computed(() => $local.mainLoading || false);

const $onFetchClientTypes = async () => {
  $local.mainLoading = true;
  try {
    const _resp = await $clientStore.get("types");
    if (_resp?.status) {
      $local.dataTypes = _resp?.result;
    }
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

// ⬇️ NEW: handler ketika memilih file gambar
const $onPicture = (event) => {
  const file = event?.target?.files?.[0];
  if (!file) return;

  const previewUrl = URL.createObjectURL(file);

  // samakan struktur dengan payload dari molecules-image-editor
  $model.picture = {
    rawSource: file,
    source: previewUrl,
  };

  // reset input supaya bisa pilih file yang sama lagi kalau perlu
  event.target.value = "";
};

const $onSubmit = async (e) => {
  e.preventDefault();
  $local.mainLoading = true;
  try {
    if (!(await $form.value.$validate())) {
      throw new Error("Please make sure all fields are filled");
    }

    if (!$model.picture?.rawSource) {
      throw new Error("Please add a picture for your bussines!");
    }

    const clientId = v4();
    const userId = v4();

    // todo:register user as admin
    const _respUser = await $userStore.post("admins", {
      id: userId,
      username: $trim($model.username)?.replaceAll(" ", "_"),
      email: $trim($model.email),
      password: $trim($model.password),
      picture:
        ($model.picture?.rawSource &&
          (await $uploadFile($model.picture.rawSource, `users/${userId}`, "picture"))) ||
        null,
    });

    if (!_respUser?.result?.userId) {
      throw new Error("Something wrong. Try again later...");
    }

    // todo:login user
    await $userStore.login({
      email: $trim($model.email),
      password: $trim($model.password),
    });

    // todo:register client information
    const _respClient = await $clientStore.register({
      id: clientId,
      type: $local.selectedType.title,
      name: $trim($model.username),
      email: $trim($model.email),
      phone: $trim($model.phone),
      npwp: $trim($model.npwp),
      description: $trim($model.description),
    });

    if (!_respClient?.result?.clientId) {
      throw new Error("Something wrong with your account. Try again later...");
    }

    $notification.success({
      title: "User Register",
      content: "Your account was successfully created",
    });

    $objectSetNull($model);
    $form.value.$reset();
    $local.errors = null;

    router.push({ path: "/" });
  } catch (error) {
    $local.errors = error?.data?.message || error?.message;
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};

watch(
  () => $local.mainLoading,
  (_val) => {
    if (_val) $loadingBar.start();
    else setTimeout(() => $loadingBar.finish(), 500);
  }
);

onMounted(() => {
  $pushToQueue(async () => await $onFetchClientTypes());
});

onUnmounted(() => {
  $loadingBar.finish();
});
</script>

<template>
  <molecules-modal
    title="Picture Editor"
    v-model:show="$local.openImageEditor"
    :style="{
      width: $breakpoint.mdAndDown ? '90%' : '600px',
    }"
    @closed="
      (_payload) => {
        if (_payload) {
          console.log(_payload);
          $model.picture = _payload?.[0];
        }
        $local.openImageEditor = false;
      }
    "
  >
    <molecules-image-editor :max="1" />
  </molecules-modal>

  <section v-if="$local.mainLoading && !$local.selectedType">
    <atoms-container>
      <br />
      <n-skeleton class="w-full m-auto md:w-1/2" height="150px"></n-skeleton>
    </atoms-container>
  </section>
  <section v-else>
    <n-collapse-transition :show="!$local.selectedType">
      <atoms-container>
        <br />
        <n-card class="w-full md:w-1/2 m-auto !bg-transparent" :bordered="false">
          <n-button text @click="router.push({ path: '/' })">
            <template #icon><atoms-icon flat name="arrow-left" /></template>
            Back to home
          </n-button>
          <br />
          <br />
          <atoms-text strong class="!text-primary">Select your bussiness type</atoms-text>
          <br />
          <div class="space-y-2">
            <n-card
              v-for="(_type, _itype) in $local.dataTypes"
              :key="_itype"
              size="small"
              class="!cursor-pointer bg-white/50 dark:bg-black-smoke"
              @click="$local.selectedType = _type"
            >
              <atoms-text strong class="capitalize">{{ _type?.title }}</atoms-text>
              <atoms-text caption>{{ _type?.description }}</atoms-text>
            </n-card>
          </div>
          <br />
          <div class="flex flex-col items-start justify-center gap-2">
            <atoms-text :disabled="$isLoading" to="/authentication" span>
              Already have an account?
            </atoms-text>
          </div>
        </n-card>
      </atoms-container>
    </n-collapse-transition>

    <n-collapse-transition :show="$local.selectedType">
      <n-space justify="center" align="center" style="min-height: 100vh; width: 100%">
        <n-card
          size="large"
          class="bg-transparent flex my-5 min-w-[30rem] md:w-[850px]"
          :bordered="false"
        >
          <n-button text @click="router.push({ path: '/' })">
            <template #icon><atoms-icon flat name="arrow-left" /></template>
            Back to home
          </n-button>

          <br />
          <br />

          <!-- input file hidden -->
          <input
            type="file"
            ref="$uploadImage"
            class="hidden"
            id="avatar"
            @change="$onPicture"
            name="avatar"
            accept="image/png, image/jpeg, image/jpg, image/bmp, image/gif"
          />

          <n-space align="center">
            <!-- Avatar + tombol upload -->
            <div class="flex flex-col items-center gap-2">
              <atoms-avatar
                ref="$refPicture"
                class="cursor-pointer"
                :src="$model.picture?.source"
                sizes="150"
                nickname="account"
              >
                <div
                  class="absolute flex flex-col items-center justify-center w-full h-full gap-2 bg-black bg-opacity-25"
                >
                  <n-button
                    size="tiny"
                    type="primary"
                    :disabled="$isLoading"
                    @click="$local.openImageEditor = true"
                  >
                    Unggah Foto (Editor)
                  </n-button>
                </div>
              </atoms-avatar>

              <!-- ⬇️ NEW: tombol eksplisit untuk pilih foto -->
              <n-space>
                <n-button
                  size="small"
                  tertiary
                  :disabled="$isLoading"
                  @click="$uploadImage && $uploadImage.click()"
                >
                  Pilih Foto
                </n-button>
                <n-button
                  size="small"
                  tertiary
                  :disabled="$isLoading"
                  @click="$local.openImageEditor = true"
                >
                  Edit / Crop Foto
                </n-button>
              </n-space>
            </div>

            <div>
              <atoms-heading h2 class="mb-2"> Start your partner account </atoms-heading>
              <div class="flex items-center gap-2">
                <atoms-text strong>LombokHalalRoom</atoms-text>
              </div>
            </div>
          </n-space>

          <br />
          <n-card size="small">
            <atoms-text strong class="capitalize">
              Your Bussines : {{ $local.selectedType?.title }}
            </atoms-text>
            <atoms-text caption>{{ $local.selectedType?.description }}</atoms-text>
          </n-card>
          <br />
          <n-alert v-if="$local.errors" type="error" class="mb-5">
            {{ $local.errors }}
          </n-alert>

          <n-form @submit="$onSubmit" class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <atoms-input
              class="col-span-full md:col-span-1"
              label="Name"
              :disabled="$isLoading"
              v-model:value="$model.username"
              placeholder="Add your bussines name"
              :isError="$form.username.$error"
              :errors="$form.username.$errors"
              required
            />

            <atoms-input
              label="Email"
              class="col-span-full md:col-span-1"
              type="email"
              :disabled="$isLoading"
              v-model:value="$model.email"
              placeholder="Type your email"
              :isError="$form.email.$error"
              :errors="$form.email.$errors"
              required
            />

            <atoms-input
              label="Phone Number"
              v-maska
              data-maska="+62 ###-####-#####"
              class="col-span-full md:col-span-1"
              :disabled="$isLoading"
              v-model:value="$model.phone"
              placeholder="Add your phone number"
              :isError="$form.phone.$error"
              :errors="$form.phone.$errors"
              required
            />

            <atoms-input
              label="NPWP"
              class="col-span-full md:col-span-1"
              :disabled="$isLoading"
              v-model:value="$model.npwp"
              v-maska
              data-maska="##.###.###.#-###.###"
              placeholder="Add your npwp"
              :isError="$form.npwp.$error"
              :errors="$form.npwp.$errors"
              required
            />

            <atoms-input
              label="Description"
              type="textarea"
              class="col-span-full"
              :disabled="$isLoading"
              v-model:value="$model.description"
              placeholder="Add your description"
              :isError="$form.description.$error"
              :errors="$form.description.$errors"
              required
            />

            <atoms-input
              label="Password"
              class="col-span-full"
              type="password"
              show-password-on="click"
              :disabled="$isLoading"
              v-model:value="$model.password"
              :isError="$form.password.$error"
              :errors="$form.password.$errors"
              placeholder="Type your password"
              required
            />
            <atoms-input
              label="Confirm Password"
              type="password"
              class="col-span-full"
              show-password-on="click"
              :disabled="$isLoading"
              v-model:value="$model.confirmPassword"
              :isError="$form.confirmPassword.$error"
              :errors="$form.confirmPassword.$errors"
              placeholder="Confirm your password"
              required
            />
            <n-button
              :disabled="$isLoading"
              class="col-span-full fullWidth"
              type="primary"
              attrType="submit"
            >
              Continue
            </n-button>
          </n-form>

          <br />
          <div class="flex flex-col items-start justify-center gap-2">
            <atoms-text :disabled="$isLoading" to="/authentication" span>
              Already have an account?
            </atoms-text>
          </div>
          <br />
        </n-card>
      </n-space>
    </n-collapse-transition>
  </section>
</template>
