<script setup>
import { NButton, useLoadingBar, useNotification } from "naive-ui";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

let $userStore = useUserStore();
let { data: $dataUser } = storeToRefs($userStore);

const $loadingBar = useLoadingBar();
const $notification = useNotification();
const route = useRoute();
const router = useRouter();
const $local = reactive({
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
      await new Promise((res) => setTimeout(() => res(true), 5000));
    }
  } catch (error) {
    await $userStore.logout();
    location.reload();
  } finally {
    $local.mainLoading = false;
  }
};

watch([() => route.fullPath, () => $dataUser?.value?.scope], $onValidate);

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
  <div class="!bg-transparent">
    <div
      v-if="!$local.isMounted || (route.fullPath?.includes('admin') && !$local.isMounted)"
      class="fixed h-full w-full !z-[100] !background-gradient"
    >
      <atoms-empty image="" class="h-full w-full !background-blur" message=" ">
        <atoms-image
          src="/favicon.ico"
          width="100px"
          :zoom="false"
          class="!rounded-full overflow-hidden"
        >
          <template #none> </template
        ></atoms-image>
        <br />
        <div class="flex gap-2">
          <span
            v-for="(item, iitem) in Array.from(Array(3).keys())"
            :key="iitem"
            class="relative flex h-2 w-2"
          >
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        </div>
      </atoms-empty>
    </div>
    <div class="!bg-transparent">
      <molecules-wrapper>
        <!--           v-if="
            !route.fullPath?.includes('admin') || (route.fullPath?.includes('admin') && $local.isMounted)        
          " -->
        <div style="min-height: 50vh">
          <NuxtPage />
        </div>
        <client-only>
          <molecules-footer />
        </client-only>
      </molecules-wrapper>
    </div>
  </div>
</template>
