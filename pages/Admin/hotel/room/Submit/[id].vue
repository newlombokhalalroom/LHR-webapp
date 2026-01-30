<script setup>
import Submit from "./index.vue";
definePageMeta({
  title: "Update Room",
  //   navigator: ({ _user }) => {
  //     if (!_user?.scope?.includes("admin")) return false;
  //     return true;
  //   },
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin")) return "/";
  },
});
</script>
<template>
  <Submit />
</template>
