<script setup>
import { NButton } from "naive-ui";

const $props = defineProps({
  name: {
    type: String,
    default: "error-warning",
  },
  size: {
    type: Number,
    default: 14,
  },
  btnSize: {
    type: String,
    default: undefined,
  },
  flat: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <n-button
    :quaternary="!$props.flat && false"
    :circle="!$props.flat && true"
    :text="$props.flat || false"
    v-bind="$attrs"
    :size="btnSize"
    :class="[!$props.flat ? '!py-3' : '']"
  >
    <template #icon>
      <mdicon :name="$props.name" :width="$props.size" :height="$props.size" class="mb-1" />
    </template>
  </n-button>
</template>
