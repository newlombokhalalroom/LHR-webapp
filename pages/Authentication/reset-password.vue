<script setup>
const route = useRoute();
const $meta = ref({
  href: `${route.fullPath}`,
  title: "Reset Password",
  description: "Reset your password by email",
});

definePageMeta({
  label: "Reset Password",
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
    // twitter card
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

import { NButton, NSpace, NForm, useLoadingBar, NImage, NCard, NAlert, NText } from "naive-ui";
import { useVuelidate } from "@vuelidate/core";
import { required, email, minLength, helpers } from "@vuelidate/validators";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

let $userStore = useUserStore();
let { data: $dataUser } = storeToRefs($userStore);

const { $trim } = useNuxtApp();
const router = useRouter();
const $breakpoint = useBreakpoint();
const $loadingBar = useLoadingBar();

const $local = reactive({
  isSubmitted: false,
  mainLoading: false,
  errors: null,
});

const $model = reactive({
  code: null,
  password: null,
  confirmPassword: null,
});

const $verificationCode = computed({
  get() {
    return $model.code?.toUpperCase();
  },
  set(_value) {
    // if (_value?.length > 0) {
    //   _value = String(_value).toUpperCase();
    // }
    $model.code = _value;
  },
});

const $form = useVuelidate(
  {
    code: {
      required,
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

const $onSubmit = async (e) => {
  e.preventDefault();
  $local.mainLoading = true;
  try {
    if (!(await $form.value.$validate())) {
      throw new Error("Please make sure all fields are filled");
    }

    await $userStore.put("password/reset", {
      code: $trim($model.code),
      newPassword: $trim($model.password),
    });

    $form.value.$reset();
    $local.errors = null;
    $local.isSubmitted = true;
  } catch (error) {
    $local.errors = error?.data?.message || error?.message;
    $model.password = null;
    $model.confirmPassword = null;
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

onUnmounted(() => {
  $loadingBar.finish();
});
</script>
<template>
  <n-space
    justify="center"
    align="center"
    style="min-height: 100vh; width: 100%"
    class="dark:bg-black"
  >
    <div
      v-if="$local.isSubmitted"
      class="flex flex-col text-center justify-center items-center gap-5"
    >
      <atoms-image height="250" src="/media/confirmed.svg"></atoms-image>
      <atoms-heading h2 class="">Your password successfully changed</atoms-heading>
      <atoms-text class="">Now you can login into our platform as users </atoms-text>
      <n-button @click="router.push({ path: '/authentication' })">Back to sign in</n-button>
    </div>
    <div v-else class="flex flex-col text-center justify-center items-center gap-5 px-5 md:px-0">
      <n-card
        :bordered="false"
        size="large"
        class="bg-transparent md:bg-white md:dark:bg-black flex min-w-[25rem] my-5 w-full text-left"
      >
        <n-button text @click="router.push({ path: '/authentication' })">
          <template #icon><atoms-icon flat name="arrow-left" /></template>Try to signin</n-button
        >

        <br />
        <br />
        <atoms-heading h2 class="mb-2">Reset Your Password</atoms-heading>
        <div class="flex gap-2 items-center">
          <atoms-text>Please input verification code that we sent from your email </atoms-text>
        </div>
        <br />
        <n-alert v-if="$local.errors" type="error">
          {{ $local.errors }}
        </n-alert>
        <br />
        <n-form @submit="$onSubmit">
          <atoms-input
            label="Code Verification"
            :disabled="$isLoading"
            v-model:value="$verificationCode"
            :isError="$form.code.$error"
            :errors="$form.code.$errors"
            placeholder="Type your verification code"
          />

          <atoms-input
            label="New Password"
            type="password"
            show-password-on="click"
            :disabled="$isLoading"
            v-model:value="$model.password"
            :isError="$form.password.$error"
            :errors="$form.password.$errors"
            placeholder="Type your new password"
            required
          />
          <atoms-input
            label="Confirm New Password"
            type="password"
            show-password-on="click"
            :disabled="$isLoading"
            v-model:value="$model.confirmPassword"
            :isError="$form.confirmPassword.$error"
            :errors="$form.confirmPassword.$errors"
            placeholder="Confirm your new password"
            required
          />

          <n-button :disabled="$isLoading" class="fullWidth" type="primary" attrType="submit"
            >Continue</n-button
          >
        </n-form>
        <br />
        <div class="flex flex-col items-start justify-center gap-2">
          <atoms-text :disabled="$isLoading" to="/authentication" span>Back to signin</atoms-text>
        </div>
        <br />
      </n-card>
    </div>
  </n-space>
</template>
