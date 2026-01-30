<script setup>
import { NImage, NSpace, NText } from "naive-ui";

const $props = defineProps({
  isLoading: Boolean,
  name: {
    type: String,
    default: "exclamation",
  },
  size: {
    type: String,
    default: "250",
  },
  height: {
    type: String,
    default: "25vh",
  },
  image: {
    type: String,
    default: "media/empty.svg",
  },
});
</script>

<template>
  <n-space
    class="p-0 pt-5 pb-10 bg-white-smoke dark:bg-black rounded-md"
    vertical
    justify="center"
    align="center"
    :style="{ 'min-height': $props.height, width: '100%' }"
  >
    <n-image
      v-if="!$props.isLoading && $props.image"
      :height="$props.size"
      :src="`/${$props.image}`"
      preview-disabled
      lazy
    />
    <atoms-text>{{
      $props.isLoading ? "Loading..." : $attrs.message || "Data you searching for was not found!"
    }}</atoms-text>
    <slot />
  </n-space>
</template>
