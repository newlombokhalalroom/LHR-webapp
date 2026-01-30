<script setup>
import { NFormItem, NInput, NText, NSelect, NInputGroup } from "naive-ui";
//others
import { useRouter } from "vue-router";
const $props = defineProps({
  isError: Boolean,
  errors: Array,
  hideDetail: Boolean,
});

const router = useRouter();
</script>

<template>
  <ClientOnly>
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
        <n-select v-bind="$attrs" :status="$props.isError ? 'error' : 'primary'" />
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
  </ClientOnly>
</template>
