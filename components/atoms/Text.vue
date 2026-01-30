<script setup>
import { useRouter, useRoute } from "vue-router";
import { reactive, useSlots, computed } from "vue";

const $$attrs = useAttrs();
const router = useRouter();
const $props = defineProps({
  span: Boolean,
  caption: Boolean,
  href: String,
  link: String,
  to: String,
  icon: String,
  strong: Boolean,
});

const $local = reactive({
  defaultClass: [
    "line-height-2 text-color dark:text-white my-0 cursor-auto",
    (Boolean($props.href || $props.to) && "visited:text-primary") || "-",
  ],
  span: ["text-sm"],
  caption: ["text-xs"],
});

const $trigger = () => {
  if ($props.link) {
    const _target = $props.link;
    const _iframe = "<iframe width='100%' height='100%' src='" + _target + "'></iframe>";
    const x = window.open();
    x.document.open();
    x.document.write(_iframe);
    x.document.close();
  } else if ($props.href) {
    window.open($props.href, "_blank");
  } else if ($props.to) {
    router.push({ path: $props.to });
  }
};

const $clickable = computed(
  () => $props.to || $props.href || $props.link || $$attrs.onClick || false
);

const $isHasSlot = computed(() => {
  return useSlots()?.default;
});
</script>
<template>
  <div>
    <div v-if="$clickable">
      <span
        v-if="!$props.icon && ($props.span || $props.caption)"
        @click.stop="$trigger"
        :style="{
          'text-decoration': $clickable ? 'underline' : 'none',
          cursor: Boolean($clickable) ? 'pointer' : 'inherit',
        }"
        :class="[
          ...($props.span ? $local.span : $local.caption),
          ...$local.defaultClass,
          $attrs.class,
          $props.strong ? 'font-bold' : '',
        ]"
        v-bind="$attrs"
      >
        <slot />
      </span>
      <p
        v-else
        @click.stop="$trigger"
        :style="{
          'text-decoration': $clickable ? 'underline' : 'none',
          cursor: Boolean($clickable) ? 'pointer' : 'inherit',
        }"
        :class="[
          ...$local.defaultClass,
          'text-base',
          $attrs.class,
          $props.strong ? 'font-bold' : '',
        ]"
        v-bind="$attrs"
      >
        <slot />
      </p>
    </div>
    <div v-else>
      <span
        v-if="!$props.icon && ($props.span || $props.caption)"
        @click="$trigger"
        :style="{
          'text-decoration': $clickable ? 'underline' : 'none',
          cursor: Boolean($clickable) ? 'pointer' : 'inherit',
        }"
        :class="[
          ...($props.span ? $local.span : $local.caption),
          ...$local.defaultClass,
          $attrs.class,
          $props.strong ? 'font-bold' : '',
        ]"
        v-bind="$attrs"
      >
        <slot />
      </span>
      <p
        v-else
        @click="$trigger"
        :style="{
          'text-decoration': $clickable ? 'underline' : 'none',
          cursor: Boolean($clickable) ? 'pointer' : 'inherit',
        }"
        :class="[
          ...$local.defaultClass,
          'text-base',
          $attrs.class,
          $props.strong ? 'font-bold' : '',
        ]"
        v-bind="$attrs"
      >
        <slot />
      </p>
    </div>
  </div>
</template>
