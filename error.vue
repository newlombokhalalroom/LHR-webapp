<script setup>
import { NButton, NSpace } from "naive-ui";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

const $userStore = useUserStore();
const { data: $dataUser } = storeToRefs($userStore);

const props = defineProps({
  error: Object,
});

const handleError = () => clearError({ redirect: "/" });
const $onLogout = async () => {
  await $userStore.logout();
  clearError({ redirect: "/" });
};
</script>

<template>
  <molecules-config class="bg-white dark:!bg-black">
    <div class="min-h-screen w-full background-gradient">
      <n-space vertical align="center" justify="center" class="h-screen">
        <atoms-heading>Page Not Found </atoms-heading>
        <atoms-heading h3>{{ props?.error?.statusCode }}</atoms-heading>
        <!-- {{ props?.error }} -->
        <br />
        <n-space align="center">
          <n-button @click="handleError" type="primary">Going Back</n-button>
          <atoms-text v-if="$dataUser?.id">Or</atoms-text>
          <n-button v-if="$dataUser?.id" @click="$onLogout" type="error">Logout</n-button>
        </n-space>
        <br />
        <!-- <atoms-text caption class="md:w-1/2 mx-auto">{{ props?.error?.slice(0, 100) }}</atoms-text> -->
      </n-space>
    </div>
  </molecules-config>
</template>
