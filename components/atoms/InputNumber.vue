<script setup>
//vue
import { reactive, ref } from "vue";
import {
  NButton,
  NSpace,
  NForm,
  NFormItem,
  NInputNumber,
  NCard,
  NH1,
  NText,
  NInputGroup,
} from "naive-ui";
//others
import { useRouter } from "vue-router";

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
    <n-input-group>
      <slot name="prepend" />
      <n-input-number
        :size="$props.size"
        v-bind="$attrs"
        :status="$props.isError ? 'error' : 'primary'"
        class="w-full"
      />
      <slot name="append" />
    </n-input-group>
    <!-- @keydown.enter.prevent -->
    <template v-if="$props.isError" #feedback>
      <div :class="['mb-5']">
        <n-text
          v-for="(_err, _id) in $props.errors.map((err) => err.$message)"
          :key="_id"
          :class="[$props.isError && '!text-red-500']"
          >{{ _err }}</n-text
        >
      </div>
    </template>
  </n-form-item>
</template>
