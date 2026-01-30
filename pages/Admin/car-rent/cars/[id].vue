<script setup>
definePageMeta({
  title: "Detail Car",
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin")) return "/";
  },
});
</script>
<template>
  <molecules-product-car />
</template>
