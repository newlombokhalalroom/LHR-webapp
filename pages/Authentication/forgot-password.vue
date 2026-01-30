<script setup>
const route = useRoute();
const $meta = ref({
  href: `${route.fullPath}`,
  title: "Recover Your Password",
  description: "Reset your password by email",
});

definePageMeta({
  label: "Recover Your Password",
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

const $refRedirect = ref(5);

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
  email: null,
});

const $form = useVuelidate(
  {
    email: {
      email: helpers.withMessage(
        ({ $pending, $invalid, $params, $model: _model }) => `${_model} not a valid email`,
        email
      ),
      required,
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

    await $userStore.post("password/reset", {
      email: $trim($model.email),
    });

    const _redirectTime = ($refRedirect.value || 1) * 1000;

    const _newInterval = setInterval(() => {
      if ($refRedirect.value >= 1) $refRedirect.value = $refRedirect.value - 1;
    }, 1000);

    setTimeout(() => {
      clearInterval(_newInterval);
      router.push({ path: "/authentication/reset-password" });
    }, _redirectTime);

    $form.value.$reset();
    $local.errors = null;
    $local.isSubmitted = true;
  } catch (error) {
    $local.errors = error?.data?.message || error?.message;
    $model.password = null;
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
    <div v-if="!$local.isSubmitted" class="grid grid-cols-2">
      <n-card
        :bordered="false"
        size="large"
        class="bg-transparent md:bg-white md:dark:bg-black flex my-5 min-w-[30rem] max-w-[30rem] md:max-w-full col-span-2 md:col-span-1"
      >
        <n-button text @click="router.push({ path: '/' })">
          <template #icon><atoms-icon flat name="arrow-left" /></template>Back to home</n-button
        >

        <br />
        <br />
        <atoms-heading h2 class="mb-2">Forgot Password</atoms-heading>
        <div class="flex gap-2 items-center">
          <atoms-text>Input your registered email and recover your account.</atoms-text>
          <!-- <atoms-text caption>by</atoms-text>
            <n-image height="25" lazy src="media/kedaireka.svg" class="" /> -->
        </div>
        <br />
        <n-alert v-if="$local.errors" type="error" class="mb-5">
          {{ $local.errors }}
        </n-alert>
        <br />
        <n-form @submit="$onSubmit">
          <atoms-input
            label="Your Email"
            type="email"
            :disabled="$isLoading"
            v-model:value="$model.email"
            :isError="$form.email.$error"
            :errors="$form.email.$errors"
            placeholder="Type your registered email"
          />

          <n-button :disabled="$isLoading" class="fullWidth" type="primary" attrType="submit"
            >Continue</n-button
          >
        </n-form>
        <br />
        <div class="flex flex-col items-start justify-center gap-2">
          <atoms-text :disabled="$isLoading" to="/authentication" span>Back to login</atoms-text>
        </div>
        <br />
      </n-card>
      <n-image
        v-if="!$breakpoint.smAndDown"
        height="500"
        src="/media/forgot-password.svg"
        class="col-span-1"
      />
    </div>
    <div v-else class="flex flex-col text-center justify-center items-center gap-5">
      <atoms-image height="250" src="/media/confirmed.svg"></atoms-image>
      <atoms-heading h2 class="">Your verify code sent successfully</atoms-heading>
      <atoms-text class=""
        >Please check your email and verify yourself. If the page does not redirect you in
        {{ $refRedirect }} seconds,
        <a href="/authentication/reset-password">please click this link</a>.
      </atoms-text>
      <n-button :disabled="$refRedirect > 1" @click="router.push({ path: '/' })"
        >Back to homepage</n-button
      >
    </div>
  </n-space>
</template>
