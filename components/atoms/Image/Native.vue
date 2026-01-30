<script setup>
import {
  onMounted,
  reactive,
  getCurrentInstance,
  watch,
  computed,
  ref,
  nextTick,
  useSlots,
} from "vue";
import { NImage, NSpace, NText } from "naive-ui";

const image = ref(null);
const $nImage = ref(null);
// const { $viewerApi } = getCurrentInstance().appContext.config.globalProperties
const $props = defineProps({
  src: String,
  nickname: String,
  loading: Boolean,
  zoom: {
    type: Boolean,
    default: true,
  },
  cover: {
    type: Boolean,
    default: true,
  },
  width: String,
  height: String,
  position: String,
  rounded: {
    type: String,
    default: "rounded-sm",
  },
  stretch: {
    type: String,
    default: "object-contain",
  },
});
const $local = reactive({
  isError: true,
  source: null,
  loading: true,
  skeleton: false,
  height: null,
  width: null,
  errorCount: 0,
});
const $isLoading = computed(() => $props.loading || $local.loading);

const $onLoad = (payload) => {
  if (image.value) {
    $local.height = $props.height || image.value.naturalHeight;
    $local.width = $props.width || image.value.naturalWidth;
    $local.source = $props.src;
  }
  $local.isError = false;
  $local.loading = false;
};

const $onError = () => {
  if ($props.nickname && $local.source != $props.source) {
    $local.source = `https://ui-avatars.com/api?name=${props.nickname}?size=512`;
  } else {
    $local.isError = true;
    $local.loading = true;
    $local.source = null;
  }
};
const $onReload = () => {
  $local.isError = false;
  $local.height = null;
  $local.width = null;
  $local.loading = true;
  $local.source = $props.src || null;
  setTimeout(() => {
    if ($local.loading) {
      $onError();
    }
  }, 3000);
};
watch(
  () => $props.src,
  (value) => {
    $onReload();
  }
);
onMounted(() => {
  $onReload();
});
</script>

<template>
  <n-image ref="$nImage" :src="$local.source" class="hidden" />
  <img @error="$onError" @load="$onLoad" :src="$local.source" class="hidden" />
  <div
    v-if="($local.isError && !$props.nickname) || $local.loading || !$local.source"
    v-bind="$attrs"
    class="flex justify-center items-center"
    :style="{
      width: $props.width || '100%',
      height: $props.height || '100%',
    }"
  >
    <slot name="none" />
    <mdicon v-if="!useSlots()?.none" name="image-broken-variant" />
  </div>
  <div
    v-else
    v-bind="$attrs"
    :class="[
      ($props.cover && 'object-cover') || $props.stretch,
      $props.zoom ? 'cursor-pointer' : 'cursor-default',
      (($isLoading || $local.isError) && 'animate-pulse') || '',
      'native-image flex items-center justify-center bg-white-smoke dark:bg-black',
    ]"
    @click.stop="() => $props.zoom && $nImage?.click()"
    :style="{
      'background-image': `url('${$local.source || $props.src}')`,
      'background-size': ($props.cover && 'cover') || 'contain',
      'background-position': $props.position || 'center',
      'background-repeat': 'no-repeat',
      width: $props.width || '100%',
      height: $props.height || '100%',
    }"
  >
    <slot />
  </div>
</template>
<!-- 
:style="{
  width: $props.width || $local.width || 'auto',
  height: $props.height || $props.width || $local.height || 'auto',
  'background-image': `url(${$local.source})`,
  'background-size': `${$props.stretch}`,
  'background-repeat': 'no-repeat',
}" -->
