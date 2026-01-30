<!-- <script setup>
import { NDrawer, NDrawerContent } from "naive-ui";

const $breakpoint = useBreakpoint();
const $$attrs = useAttrs();
const $emit = defineEmits(["closed"]);

const $local = reactive({
  mainLoading: false,
  isMounted: false,
});

const $onClose = (_payload) => {
  $emit("closed", _payload);
};

watch(
  () => $$attrs.show,
  (_val) => {
    $local.isMounted = (_val && true) || false;
  }
);

provide("$onClose", $onClose);
</script>
<template>
  <n-drawer
    v-bind="$attrs"
    :width="'100%'"
    :max-height="'90%'"
    :height="$attrs?.height || '90%'"
    :placement="'bottom'"
    resizable
    @update-show="$onClose(null)"
  >
    <n-drawer-content v-bind="$attrs.content" closable>
      <slot v-if="$local.isMounted" v-bind="$attrs.content" />
      <br />
    </n-drawer-content>
  </n-drawer>
</template> -->

<script setup>
import { NDrawer, NDrawerContent } from "naive-ui";
import { reactive, inject, watch, provide, useAttrs, onMounted } from "vue";

const $breakpoint = useBreakpoint();
const attrs = useAttrs();
const $emit = defineEmits(["closed"]);

const $local = reactive({
  data: null,
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

watch(
  () => $local.isMounted,
  async (_val) => {
    if (_val) {
      if (attrs?.onMounted) {
        $local.data =
          typeof attrs?.onMounted() == "function"
            ? await (
                await attrs?.onMounted()
              )()
            : attrs?.onMounted();
        // console.log($local.data)
      }
    }
  }
);

provide("$onClose", $onClose);
</script>
<template>
  <n-drawer
    v-bind="$attrs"
    :width="'100%'"
    :height="$attrs?.height || '100%'"
    :placement="'bottom'"
    resizable
    @update-show="$onClose(null)"
  >
    <n-drawer-content v-bind="$attrs.content" closable>
      <slot
        v-if="$local.isMounted"
        v-bind="$attrs.content"
        :data="$local.data"
        :onClose="$onClose"
      />
      <br />
    </n-drawer-content>
  </n-drawer>
</template>
