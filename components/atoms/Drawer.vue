<script setup>
import { NDrawer, NDrawerContent } from "naive-ui";
import { reactive, inject, watch, provide, useAttrs } from "vue";

const $attrs = useAttrs();
const $emit = defineEmits(["closed"]);

const $local = reactive({
  mainLoading: false,
  isMounted: false,
});

const $onClose = (_payload) => {
  $emit("closed", _payload);
};

watch(
  () => $attrs.show,
  (_val) => {
    $local.isMounted = (_val && true) || false;
  }
);

provide("$onClose", $onClose);
</script>
<template>
  <n-drawer
    resizable
    v-bind="$attrs"
    default-height="90%"
    placement="bottom"
    @update-show="$onClose(null)"
  >
    <n-drawer-content
      closable
      v-bind="$attrs.content"
      :native-scrollbar="false"
    >
      <slot v-if="$local.isMounted" />
      <br />
      <br />
    </n-drawer-content>
  </n-drawer>
</template>
