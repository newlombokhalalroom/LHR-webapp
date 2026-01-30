<script setup>
const route = useRoute();
const $meta = ref({
  href: `${route.fullPath}`,
  title: "Sign In",
  description: "Login into your account",
});

import {
  NButton,
  NSpace,
  NForm,
  useLoadingBar,
  NImage,
  NCard,
  NAlert,
  NText,
  NIcon,
} from "naive-ui";
import { useVuelidate } from "@vuelidate/core";
import { required, email, minLength, helpers } from "@vuelidate/validators";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";
import { GoogleAuthProvider, signInWithPopup, getAuth, getAdditionalUserInfo } from "firebase/auth";

let $userStore = useUserStore();
let { data: $dataUser } = storeToRefs($userStore);

const $googleProvider = new GoogleAuthProvider();
const { $trim } = useNuxtApp();
const router = useRouter();
const $breakpoint = useBreakpoint();
const $loadingBar = useLoadingBar();

const $auth = getAuth();

const $local = reactive({
  mainLoading: false,
  errors: null,
});

const $model = reactive({
  email: null,
  password: null,
});

const $form = useVuelidate(
  {
    email: {
      // email: helpers.withMessage(
      //   ({ $pending, $invalid, $params, $model: _model }) => `${_model} not a valid email`,
      //   email
      // ),
      required,
    },
    password: {
      required,
      minLength: helpers.withMessage(() => `Minimum has 8 characters`, minLength(8)),
    },
  },
  $model
);

const $isLoading = computed(() => $local.mainLoading || false);

const $onLoginWithGoogle = async () => {
  $local.mainLoading = true;
  try {
    await signInWithPopup($auth, $googleProvider)
      .then(async (result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const _user = result.user;

        if (!_user.email || !_user.uid) throw new Error();

        const $test_login = await $userStore
          .login({
            email: $trim(_user.email),
            password: $trim(_user.uid),
          })
          ?.then((__resp) => true)
          ?.catch((error) => {
            if (!error?.data?.message?.includes("registered")) return null;
            return false;
          });

        // console.log("login", $test_login);

        if ($test_login === null) {
          throw new Error(
            "This account was created without google authenticated!. Please login manually with your email and password"
          );
        }

        if ($test_login == false) {
          await $userStore.post(null, {
            username: $trim(_user.displayName?.replaceAll(" ", "") || _user.displayName),
            email: $trim(_user.email),
            password: $trim(_user.uid),
            // providerId: _user.uid,
            // provider: "google",
            picture: _user.photoURL,
          });

          await $userStore.login({
            email: $trim(_user.email),
            password: $trim(_user.uid),
          });
        }

        $form.value.$reset();
        $local.errors = null;

        router.push({ path: "/" });
      })
      .catch((error) => {
        // console.log(error);
        // Handle Errors here.
        // const errorCode = error.code;
        // const errorMessage = error.message;
        // // The email of the user's account used.
        // const email = error.customData.email;
        // // The AuthCredential type that was used.
        // const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
        // console.log(error);
        throw new Error("Authentication was suddenly canceled");
      });
  } catch (error) {
    // console.log(error);
    $local.errors = error?.data?.message || error?.message;
  } finally {
    $local.mainLoading = false;
  }
};

const $onSubmit = async (e) => {
  e.preventDefault();
  $local.mainLoading = true;
  try {
    if (!(await $form.value.$validate())) {
      throw new Error("Please make sure all fields are filled");
    }

    await $userStore.login({
      email: $trim($model.email),
      password: $trim($model.password),
    });

    $form.value.$reset();
    $local.errors = null;

    router.push({ path: "/" });
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

definePageMeta({
  label: "Sign In",
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
</script>
<template>
  <main class="grid grid-cols-12">
    <section v-if="!$breakpoint.mdAndDown" class="md:col-span-3">
      <atoms-image
        src="https://i.pinimg.com/564x/c8/07/0d/c8070da63af61cd4c26eef8cdba6058c.jpg"
        class="w-full h-full relative"
      >
        <template #custom>
          <div
            class="absolute top-0 left-0 w-full h-full flex justify-center items-center backdrop-blur-sm"
          >
            <div class="p-10">
              <atoms-heading h2>Join with us now and get the benefit!</atoms-heading>
            </div>
          </div>
        </template>
      </atoms-image>
    </section>
    <section
      class="col-span-full md:col-span-9 flex justify-center items-center"
      style="min-height: 100vh"
    >
      <n-card
        :bordered="false"
        size="large"
        class="bg-transparent flex w-full md:w-auto md:min-w-[35rem] md:max-w-[50rem]"
      >
        <!-- md:bg-white-smoke md:dark:bg-black-smoke -->
        <n-button :disabled="$isLoading" text @click="router.push({ path: '/' })">
          <template #icon><atoms-icon flat name="arrow-left" /></template>Back to home</n-button
        >

        <br />
        <br />
        <atoms-heading h2 class="mb-2">Sign In </atoms-heading>
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
            label="Username or Email"
            :disabled="$isLoading"
            v-model:value="$model.email"
            :isError="$form.email.$error"
            :errors="$form.email.$errors"
            placeholder="Type your email or username"
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
          />

          <n-button :disabled="$isLoading" class="fullWidth" type="primary" attrType="submit"
            >Continue</n-button
          >

          <n-button :disabled="$isLoading" @click="$onLoginWithGoogle" class="fullWidth mt-2"
            ><template #icon><atoms-icon flat name="google" /></template> Sign with Google</n-button
          >
        </n-form>
        <br />
        <div class="flex flex-col items-start justify-center gap-2">
          <atoms-text :disabled="$isLoading" to="/authentication/forgot-password" span
            >Forgot your password?</atoms-text
          >
          <!-- <atoms-text>Atau</atoms-text> -->
          <atoms-text :disabled="$isLoading" to="/authentication/signup" span
            >Create an account</atoms-text
          >
          <atoms-text :disabled="$isLoading" to="/authentication/signup-client" span
            >Partner with us</atoms-text
          >
        </div>
        <br />
      </n-card>
    </section>
  </main>
</template>
