<script setup>
import { NSkeleton } from "naive-ui";

import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";

const $userStore = useUserStore();
const { $pushToQueue } = useQueue();
const { data: $dataUser } = storeToRefs($userStore);
const router = useRouter();

onMounted(() => {
  const _path = $dataUser?.value?.client?.type?.replaceAll(" ", "-");
  if (_path) {
    router.push({ path: "/admin/" + _path });
  } else {
    $userStore.logout();
  }
});

definePageMeta({
  order: 0,
  title: "Loading Admin",
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin")) return "/";
  },
});
</script>

<template>
  <atoms-container>
    <br />
    <n-skeleton height="150px"></n-skeleton>
    <br />
  </atoms-container>
</template>
