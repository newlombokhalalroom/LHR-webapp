<script setup>
const { $api } = useApi();
const $categoriesType = useCookie("type-categories");

onMounted(async () => {
  clearError();

  const _resp = await $api.get("/destinations/categories");
  if (_resp?.status) {
    $categoriesType.value = _resp?.result;
  }
});
</script>
<template>
  <molecules-config class="bg-white dark:bg-black-pure">
    <div class="min-h-screen">
      <NuxtLayout />
    </div>
  </molecules-config>
</template>
