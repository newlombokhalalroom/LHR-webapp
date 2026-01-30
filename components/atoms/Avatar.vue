<script setup>
import { onMounted, reactive, watch } from "vue";
import AtomsImage from "./Image/Index.vue";
const props = defineProps({
  nickname: String,
  src: String,
  loading: Boolean,
  contain: Boolean,
  zoom: {
    type: Boolean,
    default: false
  },
  sizes: {
    type: String,
    default: "50"
  },
  rounded: {
    type: String,
    default: "rounded-full"
  },
  color: {
    type: String,
    default: "text-white-smoke"
  }
});
</script>
<template>
  <!--  :width="props.sizes"
    :height="props.sizes" -->
  <atoms-image
    v-bind="$attrs"
    v-bind:ref="$attrs?.ref"
    :width="props.sizes"
    :height="props.sizes"
    :class="['rounded-full overflow-hidden relative']"
    :src="props.src || '/'"
    :nickname="props.nickname"
    :loading="props.loading"
    :rounded="props.rounded"
    :zoom="props.zoom"
    :stretch="(props.contain && 'object-contain') || 'object-cover'"
  >
    <template #none>
      <slot name="none" />
    </template>
    <template #custom>
      <slot />
    </template>
  </atoms-image>
</template>
