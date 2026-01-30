<script setup>
import {
  NForm,
  NButton,
  NTag,
  NDivider,
  NSkeleton,
  useNotification,
  NScrollbar,
  NCard,
  useLoadingBar,
} from "naive-ui";
import * as uuid from "uuid";
import { useVuelidate } from "@vuelidate/core";
import { required, email, minValue } from "@vuelidate/validators";
import { storeToRefs } from "pinia";
import useApi from "@/composables/useApi";

const router = useRouter();
const route = useRoute();
const { $createError } = useError();
const { $api } = useApi();
const { $removeSeparator, $addSeparator, $uploadFile } = useNuxtApp();
const $breakpoint = useBreakpoint();
const $loadingBar = useLoadingBar();
const $notification = useNotification();
const $accept = "image/png, image/jpeg, image/jpg, image/gif";
const $uploadAttachment = ref(null);
const $local = reactive({
  mainLoading: false,
});

const $model = reactive({
  title: null,
  description: null,
});

const $form = useVuelidate(
  {
    title: {
      required,
    },
    description: {
      required,
    },
  },
  $model
);

const $onSubmit = async () => {
  $local.mainLoading = true;
  try {
    if (!(await $form.value.$validate())) {
      $notification.warning({
        title: "Validation",
        content: "Please make sure all fields are filled",
      });
      return;
    }

    await $api.post("/types", JSON.parse(JSON.stringify($model)));
    $notification.success({
      title: "Success",
      content: "New type was successfully added",
    });
    router.push("/super-admin/clients");
  } catch (error) {
    $createError(error);
  } finally {
    $local.mainLoading = false;
  }
};
</script>
<template>
  <atoms-container>
    <section class="flex items-center justify-between">
      <atoms-heading h2>Add new client type</atoms-heading>
      <n-button @click="router.push('/super-admin/clients')">Back</n-button>
    </section>
    <br />
    <section>
      <n-form id="submit-main-form" @submit.prevent="$onSubmit">
        <section class="grid grid-cols-1 md:grid-cols-2 md:gap-x-5">
          <atoms-input
            :disabled="$local.mainLoading"
            class="col-span-full"
            placeholder="Type the name"
            :isError="$form.title.$error"
            :errors="$form.title.$errors"
            v-model:value="$model.title"
            label="Name"
            clearable
            required
          />
          <atoms-input
            :disabled="$local.mainLoading"
            class="col-span-full"
            placeholder="Type description about the client type"
            :isError="$form.description.$error"
            :errors="$form.description.$errors"
            v-model:value="$model.description"
            label="Description"
            clearable
            required
          />
          <n-button
            attr-type="submit"
            type="primary"
            :disabled="$local.mainLoading"
            class="col-span-full"
            >Save Type</n-button
          >
        </section>
      </n-form>
    </section>
    <br />
  </atoms-container>
</template>
