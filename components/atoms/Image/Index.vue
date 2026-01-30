<script setup>
import { onMounted, reactive, watch, computed, ref, useSlots } from "vue";
import { NImage } from "naive-ui";

const image = ref(null);
// const { $viewerApi } = getCurrentInstance().appContext.config.globalProperties
const router = useRouter();
const $props = defineProps({
  src: String,
  nickname: String,
  loading: Boolean,
  cover: Boolean,
  width: String,
  height: String,
  href: String,
  to: String,
  position: {
    type: String,
    default: "center",
  },
  fit: {
    type: String,
    default: "cover",
  },
  zoom: {
    type: Boolean,
    default: false,
  },
  rounded: {
    type: String,
    default: "rounded-sm",
  },
});

const $local = reactive({
  isError: false,
  source: null,
  loading: false,
  skeleton: false,
  height: null,
  width: null,
});

const $isLoading = computed(() => $props.loading);

const $trigger = () => {
  if ($props.href) {
    window.open($props.href, "_blank");
  } else if ($props.to) {
    router.push({ path: $props.to });
  }
};

const $onLoad = (payload) => {
  if (image.value) {
    $local.height = $props.height || image.value.naturalHeight;
    $local.width = $props.width || image.value.naturalWidth;
  }
  $local.isError = false;
};

const $onError = () => {
  if ($props.nickname && $local.source != $props.source) {
    $local.source = `https://ui-avatars.com/api?name=${$props.nickname}?size=512`;
  } else {
    $local.isError = true;
    $local.source = null;
  }
};

const $onReload = () => {
  $local.isError = false;
  $local.height = null;
  $local.width = null;
  $local.source = $props.src;
};

watch(
  () => $props.src,
  (value) => {
    $onReload();
  },
  { immediate: true }
);
</script>

<template>
  <div
    v-if="$local.isError && !$props.nickname"
    :class="['flex items-center justify-center bg-transparent', $props.rounded]"
    v-bind="$attrs"
    :style="{
      width: $props.width || $props.height,
      height: $props.height || $props.width,
    }"
  >
    <atoms-icon v-if="!useSlots()?.none" name="refresh" />
    <slot v-else name="none" />
  </div>
  <div v-else v-bind="$attrs.wrapper" class="relative flex">
    <img
      ref="image"
      loading="lazy"
      v-bind="$attrs"
      @load="$onLoad"
      @error="$onError()"
      :src="$local.source"
      :width="$props.width"
      :height="$props.height"
      :style="{ 'object-fit': $props.fit, 'object-position': $props.position }"
      :class="[
        ($props.zoom && 'cursor-pointer') || 'cursor-default',
        $isLoading && 'animate-pulse',
        $props.rounded,
        'm-auto',
      ]"
    />
    <slot />
  </div>
</template>
