<script setup>
import {
  NButton,
  NSpace,
  NForm,
  NFormItem,
  NScrollbar,
  NInput,
  NCard,
  NH1,
  NText,
  NInputGroup,
} from "naive-ui";
//others
import { useRouter } from "vue-router";

defineOptions({
  inheritAttrs: false,
});

const $props = defineProps({
  isError: Boolean,
  hideDetail: Boolean,
  errors: Array,
  size: String | undefined,
});

const router = useRouter();
</script>

<template>
  <n-form-item
    :label="$attrs.label"
    :path="$attrs.path"
    :style="{
      ...(($props.hideDetail && { '--n-feedback-height': 'none' }) || {}),
      ...((!$attrs.label && { '--n-label-height': 'none' }) || {}),
    }"
    class="flex flex-col"
    v-bind:class="$attrs.class"
    v-bind:required="$attrs.required"
  >
    <slot />
    <!-- @keydown.enter.prevent -->
    <template v-if="$props.isError" #feedback>
      <div :class="['mb-5']">
        <atoms-text
          v-for="(_err, _id) in $props.errors.map((err) => err.$message)"
          :key="_id"
          :class="[$props.isError && '!text-red-500']"
          v-html="_err"
        ></atoms-text>
      </div>
    </template>
  </n-form-item>
</template>
