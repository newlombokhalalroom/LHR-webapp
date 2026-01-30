<script setup>
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from "@tiptap/vue-3";

const $props = defineProps({
  node: {
    type: nodeViewProps.node.type,
    required: true,
  },
  updateAttributes: {
    type: Function,
    required: true,
  },
  deleteNode: nodeViewProps.deleteNode.type,
});

const { $deleteFileByURL } = useNuxtApp();

const $onDeleteFile = async () => {
  await $deleteFileByURL($props.node.attrs.href);
  // $props.deleteNode();
};
</script>
<template>
  <node-view-wrapper>
    <div contenteditable="false" class="doc-node">
      <a :href="$props.node.attrs.href" target="_blank"><node-view-content class="content" /></a>
      <atoms-icon name="close-fill" @click="$onDeleteFile"></atoms-icon>
    </div>
  </node-view-wrapper>
</template>
<style>
.doc-node,
doc-node {
  display: flex;
  align-items: center;
  gap: 5px;
  border-left: 5px black solid;
  padding: 0.5rem 1rem;
  background-color: whitesmoke;
}
.dark doc-node,
.dark .doc-node {
  color: white !important;
  border-left: 5px white solid;
  background-color: black;
}
</style>
