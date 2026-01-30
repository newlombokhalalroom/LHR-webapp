<script setup>
import { useRouter } from "vue-router";
import { reactive } from "vue";

const router = useRouter();
const $props = defineProps({
  h2: Boolean,
  h3: Boolean,
  h4: Boolean,
  h5: Boolean,
  h6: Boolean,
  href: String,
  size: String,
  to: String,
  icon: String,
  loading: Boolean,
});
const $local = reactive({
  defaultClass: ["my-0 dark:text-white capitalize"],
  h2: ["!text-4xl xl:text-5xl"],
  h3: ["!text-3xl xl:text-4xl"],
  h4: ["!text-2xl xl:text-3xl"],
  h5: ["!text-xl xl:text-2xl"],
  h6: ["!text-lg xl:text-xl"],
});
const $trigger = () => {
  if ($props.href) {
    window.open($props.href, "_blank");
  } else if ($props.to) {
    router.push({ path: $props.to });
  }
};
</script>
<template>
  <div :class="[]">
    <h6
      v-if="$props.h6"
      @click="$trigger"
      :style="{
        'text-decoration': $props.to || $props.href ? 'underline' : 'none',
        'cursor-pointer': $props.to || $props.href ? 'pointer' : 'default',
      }"
      :class="[...$local.h6, ...$local.defaultClass, $attrs.class]"
    >
      <slot />
    </h6>
    <h5
      v-else-if="$props.h5"
      @click="$trigger"
      :style="{
        'text-decoration': $props.to || $props.href ? 'underline' : 'none',
        'cursor-pointer': $props.to || $props.href ? 'pointer' : 'default',
      }"
      :class="[...$local.h5, ...$local.defaultClass, $attrs.class]"
    >
      <slot />
    </h5>
    <h4
      v-else-if="$props.h4"
      @click="$trigger"
      :style="{
        'text-decoration': $props.to || $props.href ? 'underline' : 'none',
        'cursor-pointer': $props.to || $props.href ? 'pointer' : 'default',
      }"
      :class="[...$local.h4, ...$local.defaultClass, $attrs.class]"
    >
      <slot />
    </h4>
    <h3
      v-else-if="$props.h3"
      @click="$trigger"
      :style="{
        'text-decoration': $props.to || $props.href ? 'underline' : 'none',
        'cursor-pointer': $props.to || $props.href ? 'pointer' : 'default',
      }"
      :class="[...$local.h3, ...$local.defaultClass, $attrs.class]"
    >
      <slot />
    </h3>
    <h2
      v-else-if="$props.h2"
      @click="$trigger"
      :style="{
        'text-decoration': $props.to || $props.href ? 'underline' : 'none',
        'cursor-pointer': $props.to || $props.href ? 'pointer' : 'default',
      }"
      :class="[...$local.h2, ...$local.defaultClass, $attrs.class]"
    >
      <slot />
    </h2>
    <h1
      v-else
      @click="$trigger"
      :style="{
        'text-decoration': $props.to || $props.href ? 'underline' : 'none',
        'cursor-pointer': $props.to || $props.href ? 'pointer' : 'default',
      }"
      :class="[...$local.defaultClass, 'text-5xl xl:text-6xl ', $attrs.class]"
    >
      <slot />
    </h1>
  </div>
</template>
