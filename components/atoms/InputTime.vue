<script setup>
//vue
import { reactive, ref } from "vue";
import { NFormItem, NText, NTimePicker } from "naive-ui";
import { useRouter } from "vue-router";
const $props = defineProps({
  isError: Boolean,

  errors: Array,
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
    <div class="w-full">
      <slot name="prepend" />
      <n-time-picker
        class="w-full"
        v-bind="$attrs"
        :status="$props.isError ? 'error' : 'primary'"
      ></n-time-picker>
      <slot name="append" />
    </div>
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
