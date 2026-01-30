<script setup>
const route = useRoute();
const $meta = ref({
  href: `${route.fullPath}`,
  title: "Sign Up",
  description: "Create your account to gain more features",
});

definePageMeta({
  label: "Sign Up",
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

import {
  NButton,
  NSpace,
  NForm,
  useLoadingBar,
  NImage,
  NCard,
  NAlert,
  useNotification,
} from "naive-ui";
import { useVuelidate } from "@vuelidate/core";
import { required, email, minLength, helpers } from "@vuelidate/validators";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

let $userStore = useUserStore();
let { data: $dataUser } = storeToRefs($userStore);

const { $objectSetNull, $trim } = useNuxtApp();
const router = useRouter();
const $notification = useNotification();
const $breakpoint = useBreakpoint();
const $loadingBar = useLoadingBar();

const $local = reactive({
  mainLoading: false,
  errors: null,
});

const $model = reactive({
  email: null,
  username: null,
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
    username: {
      custom: helpers.withMessage(
        () =>
          `Invalid username, regarding to these rules :<br/>- Range between 3-20 characters.<br/>- No whitespaces`,
        (_value) =>
          _value
            ? /^(?=.{3,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/g.test(_value)
            : false
      ),
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

    await $userStore.post(null, {
      username: $trim($model.username),
      email: $trim($model.email),
      password: $trim($model.password),
    });

    $notification.success({
      title: "User Register",
      content: "Your account was successfully created",
    });

    await $userStore.login({
      email: $trim($model.email),
      password: $trim($model.password),
    });

    $objectSetNull($model);
    $form.value.$reset();
    $local.errors = null;

    router.push({ path: "/" });
  } catch (error) {
    $local.errors = error?.data?.message || error?.message;
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
  <n-space justify="center" align="center" style="min-height: 100vh; width: 100%">
    <!-- <div class="grid grid-cols-2"> -->
    <!-- <n-image
        v-if="!$breakpoint.smAndDown"
        height="500"
        src="media/trip.svg"
        class="col-span-1"
      /> -->
    <n-card
      size="large"
      :bordered="false"
      class="!bg-transparent flex my-5 min-w-[30rem] max-w-[30rem] md:max-w-full col-span-1"
    >
      <n-button text @click="router.push({ path: '/' })">
        <template #icon><atoms-icon flat name="arrow-left" /></template>Back to home</n-button
      >

      <br />
      <br />
      <atoms-heading h2 class="mb-2">Create an account </atoms-heading>
      <div class="flex gap-2 items-center">
        <atoms-text strong>LombokHalalRoom</atoms-text>
        <!-- <atoms-text caption>by</atoms-text>
        <n-image height="25" lazy src="media/kedaireka.svg" class="" /> -->
      </div>
      <br />
      <n-alert v-if="$local.errors" type="error" class="mb-5">
        {{ $local.errors }}
      </n-alert>
      <n-form @submit="$onSubmit">
        <atoms-input
          label="Username"
          :disabled="$isLoading"
          v-model:value="$model.username"
          placeholder="Create a username"
          :isError="$form.username.$error"
          :errors="$form.username.$errors"
          required
        />

        <atoms-input
          label="Email"
          type="email"
          :disabled="$isLoading"
          v-model:value="$model.email"
          placeholder="Type your email"
          :isError="$form.email.$error"
          :errors="$form.email.$errors"
          required
        />

        <atoms-input
          label="Password"
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
          show-password-on="click"
          :disabled="$isLoading"
          v-model:value="$model.confirmPassword"
          :isError="$form.confirmPassword.$error"
          :errors="$form.confirmPassword.$errors"
          placeholder="Confirm your password"
          required
        />
        <n-button :disabled="$isLoading" class="fullWidth" type="primary" attrType="submit"
          >Continue</n-button
        >
      </n-form>
      <br />
      <div class="flex flex-col items-start justify-center gap-2">
        <!-- <atoms-text>Atau</atoms-text> -->
        <atoms-text :disabled="$isLoading" to="/authentication" span
          >Already have an account?</atoms-text
        >
        <atoms-text :disabled="$isLoading" to="/authentication/signup-client" span
          >Partner with us</atoms-text
        >
      </div>
      <br />
    </n-card>
    <!-- </div> -->
  </n-space>
</template>
