<script setup>
definePageMeta({
  title: "Detail Room",
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin")) return "/";
  },
});
</script>
<template>
  <molecules-product />
</template>
