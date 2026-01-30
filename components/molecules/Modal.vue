<script setup>
import { NModal, useNotification } from "naive-ui";

const $breakpoint = useBreakpoint();

const attrs = useAttrs();
const $emit = defineEmits(["closed"]);
const $notification = useNotification();

const $local = reactive({
  mainLoading: false,
  isMounted: false,
});

const $onClose = (_payload) => {
  $emit("closed", _payload);
};

watch(
  () => attrs.show,
  (_val) => {
    $local.isMounted = (_val && true) || false;
  }
);

provide("$onClose", $onClose);
</script>
<template>
  <n-modal v-bind="$attrs" preset="card" :bordered="false" @update-show="$onClose(null)">
    <slot v-if="$local.isMounted" />
    <br />
  </n-modal>
</template>
