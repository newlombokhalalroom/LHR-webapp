<script setup>
import Submit from "./index.vue";
definePageMeta({
  title: "Update Package",
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin")) return "/";
  },
});
</script>
<template>
  <Submit />
</template>
