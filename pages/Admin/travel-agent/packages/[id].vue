<script setup>
definePageMeta({
  title: "Detail Package",
  validation: ({ _user }) => {
    if (!_user?.scope?.includes("admin")) return "/";
  },
});
</script>
<template>
  <div>ok</div>
</template>
