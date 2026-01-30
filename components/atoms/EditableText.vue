<script setup>
import {
  h,
  ref,
  onMounted,
  reactive,
  watch,
  defineComponent,
  toRaw,
  computed,
  onUnmounted,
  inject,
  useSlots,
} from "vue";

const $breakpoint = useBreakpoint();
const $$slot = useSlots();
const $emit = defineEmits(["submit"]);
const $props = defineProps({
  value: {
    type: String,
    default: "",
  },
  maska: {
    type: String,
    default: null,
    // +62 ###-####-#####
  },
  loading: {
    type: Boolean,
    default: false,
  },
});
const $local = reactive({
  isEditorOpened: false,
  value: $props.value,
});

const $onClose = async () => {
  $local.value = $props.value?.value || $props.value;
  $local.isEditorOpened = false;
};

const $onSubmit = async (_payload) => {
  $emit("submit", _payload || null);
  $onClose();
};

watch(
  () => $props.value,
  () => {
    $local.value = $props.value?.value || $props.value;
  }
);
</script>
<template>
  <section v-if="$local.isEditorOpened">
    <atoms-input
      v-if="$props.maska"
      hide-detail
      v-maska
      :data-maska="$props.maska"
      class="col-span-2"
      placeholder="Type something..."
      v-model:value="$local.value"
      :disabled="$props.loading"
      @keyup.enter="$onSubmit($local.value)"
    >
      <template #append>
        <atoms-icon
          :disabled="$props.loading"
          @click="$onSubmit($local.value)"
          name="check"
          class="!rounded-sm"
        />
        <atoms-icon :disabled="$props.loading" @click="$onClose" name="close" class="!rounded-sm" />
      </template>
    </atoms-input>
    <atoms-input
      v-else
      hide-detail
      class="col-span-2"
      placeholder="Type something..."
      v-model:value="$local.value"
      :disabled="$props.loading"
      @keyup.enter="$onSubmit($local.value)"
    >
      <template #append>
        <atoms-icon
          :disabled="$props.loading"
          @click="$onSubmit($local.value)"
          name="check"
          class="!rounded-sm"
        />
        <atoms-icon :disabled="$props.loading" @click="$onClose" name="close" class="!rounded-sm" />
      </template>
    </atoms-input>
  </section>
  <div v-else class="flex items-center gap-1">
    <slot v-if="$$slot.text" name="text" />
    <atoms-text v-else @click="$local.isEditorOpened = true" class="text-sm underline mb-1">
      {{ $props.value }}</atoms-text
    >
    <atoms-icon
      type="tiny"
      :disabled="$props.loading"
      @click="$local.isEditorOpened = true"
      name="pencil"
    />
  </div>
</template>
