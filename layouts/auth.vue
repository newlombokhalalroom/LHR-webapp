<script setup>
import { NButton, useLoadingBar } from "naive-ui";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

let $userStore = useUserStore();
let { data: $dataUser } = storeToRefs($userStore);

const $loadingBar = useLoadingBar();
const route = useRoute();
const router = useRouter();
const $local = reactive({
  isLight: true,
  isMounted: false,
  mainLoading: false,
});

const $onValidate = async () => {
  $local.mainLoading = true;
  try {
    await $userStore.refresh();

    if (typeof route.meta?.validation == "function") {
      const _resp = await route.meta.validation({
        _user: $dataUser.value,
        _router: router,
        _route: route,
      });
      if (typeof _resp == "string") {
        await navigateTo(_resp);
      }
    }
  } catch (error) {
    await $userStore.logout();
    location.reload();
  } finally {
    $local.mainLoading = false;
  }
};

watch([() => route.fullPath, () => $dataUser?.value, () => $dataUser?.value?.scope], $onValidate);

watch(
  () => $local.mainLoading,
  (_val) => {
    if (_val) {
      $loadingBar.start();
    } else {
      setTimeout(() => $loadingBar.finish(), 1000);
    }
  }
);

onMounted(async () => {
  $local.isMounted = false;
  await $onValidate();
  $local.isMounted = true;
});
</script>
<template>
  <div class="background-gradient">
    <div style="min-height: 100vh" class="bg-transparent">
      <div v-if="!$local.isMounted" class="fixed h-full w-full !z-[100] !bg-white dark:!bg-black">
        <atoms-empty
          image=""
          class="bg-transparent h-full w-full"
          message="Validating your session..."
        />
      </div>

      <NuxtPage v-else class="" />
    </div>
  </div>
</template>
