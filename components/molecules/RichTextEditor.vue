<script setup>
import { useNotification, NText, NForm, NCard, useLoadingBar, useThemeVars } from "naive-ui";
import moment from "moment";

import docNode from "./extensions/DocNode.vue";
import { useEditor, EditorContent, VueNodeViewRenderer, Extension } from "@tiptap/vue-3";
import { Node, mergeAttributes, markPasteRule, textPasteRule } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";
import Paragraph from "@tiptap/extension-paragraph";
import Dropcursor from "@tiptap/extension-dropcursor";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { EditorState, Plugin } from "@tiptap/pm/state";

const $emit = defineEmits(["update", "update:attachments"]);
const $docAccept =
  "application/pdf, application/msword, application/json, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.presentationml.presentation, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const { $uploadFile, $getRefByURL } = useNuxtApp();
const $theme = useThemeVars();
const $uploadImage = ref(null);
const $uploadDoc = ref(null);
const $loadingBar = useLoadingBar();
const $notification = useNotification();

const $props = defineProps({
  basePath: {
    type: String,
    default: undefined,
  },
  baseId: {
    type: String,
    default: undefined,
  },
  hideImage: {
    type: Boolean,
    default: false,
  },
  hideAttachments: {
    type: Boolean,
    default: false,
  },
  hideDanger: {
    type: Boolean,
    default: false,
  },
  value: {
    type: String,
    default: "<p>Ketikkan Sesuatu...<br></p>",
  },
});

const $local = reactive({
  attachments: null,
  mainLoading: false,
});

const $defaultWidth = "250px";

// const toBase64 = (_file) =>
//   new Promise((resolve, reject) => {
//     const reader = new FileReader()
//     reader.readAsDataURL(_file)
//     reader.onload = () => resolve(reader.result)
//     reader.onerror = reject
//   })

const $onUploadFileToCloud = async (_file, _basePath, _baseId) => {
  try {
    if (!$props.baseId || !$props.basePath) {
      $notification.create({
        title: "Terjadi Kesalahan",
        content: `Pastikan base_id dan base_path ada jika ingin menyimpan gambar!`,
        type: "warning",
      });
      return undefined;
    }

    const _resultURI = await $uploadFile(
      _file,
      `${_basePath}/${_baseId}`,
      `${moment().format("DD-MM-YYYY-H-mm-ss")}`
    );

    if (Array.isArray($local.attachments)) {
      $local.attachments = [...($local.attachments || []), _resultURI];
    } else {
      $local.attachments = [_resultURI];
    }

    $emit("update:attachments", $local.attachments);

    return _resultURI;
  } catch (error) {
    throw error;
  }
};

const $editor = useEditor({
  extensions: [
    StarterKit.configure({
      blockquote: {
        HTMLAttributes: {
          class: "mx-0 my-0 bg-white-smoke dark:bg-black",
          style: "padding : 2px 10px !important; border-left: 2px solid black !important;",
        },
      },

      bulletList: {
        HTMLAttributes: {
          class: "pl-5 list-disc",
        },
      },

      orderedList: {
        HTMLAttributes: {
          class: "pl-5 list-decimal",
        },
      },
    }),
    // Extension.create({
    //   name: "codeReplace",
    //   addPasteRules() {
    //     return [textPasteRule({ find: /<[^>]*>/g, replace: "^_^" })];
    //   },
    // }),
    Image.configure({
      allowBase64: true,
      inline: true,
    }),
    Image.extend({
      addAttributes(_payload) {
        return {
          // Inherit all the attrs of the Image extension
          ...(_payload?.parent?.() || {}),
          // New attrs
          //   enableZoom: {
          //     default: true,
          //     // tell them to render on the img tag
          //     renderHTML: (attributes) => {
          //       return {
          //         enableZoom: attributes.enableZoom,
          //       };
          //     },
          //   },
          width: {
            default: $defaultWidth,
            // tell them to render on the img tag
            renderHTML: (attributes) => {
              return {
                width: attributes.width,
              };
            },
          },

          height: {
            default: "auto",
            renderHTML: (attributes) => {
              return {
                height: attributes.height,
              };
            },
          },
        };
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Node.create({
      name: "docNode",

      group: "block",

      content: "inline",

      addAttributes() {
        return {
          href: {
            default: "#",
          },
          target: {
            default: "_blank",
          },
          class: {
            default: "doc-node",
          },
        };
      },

      parseHTML() {
        return [
          {
            tag: "doc-node",
          },
        ];
      },

      renderHTML({ HTMLAttributes }) {
        return ["a", mergeAttributes(HTMLAttributes), 0];
      },

      addNodeView() {
        return VueNodeViewRenderer(docNode);
      },
    }),
    Dropcursor,
    Link,
    TextStyle,
  ],
  content: $props.value || `<p>Type something</p>...`,
  attributes: {
    class:
      "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none font-inherit",
    style:
      "font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
  },
});

const $editorAddImage = async (_payload) => {
  _payload = _payload.target.files[0];
  const _file = _payload;

  if (!$props.baseId && $props.basePath) {
    $notification.create({
      title: "Terjadi Kesalahan",
      content: `Ada kesalahan konfigurasi, silahkan hubungi developer`,
      type: "warning",
    });
    return;
  }
  if (!_file.type?.includes("image")) {
    $notification.create({
      title: "Terjadi Kesalahan",
      content: `Pastikan yang dimasukkan dalam format image/gambar`,
      type: "error",
    });
  } else if (_file && _file.size > 3000000) {
    $notification.create({
      title: "Terjadi Kesalahan",
      content: `Pastikan ukuran file tidak lebih dari 3Mb`,
      type: "error",
    });
  } else if (_file) {
    // change into firebase url
    const _resultURI = await $onUploadFileToCloud(_file, $props.basePath, $props.baseId);

    if (!_resultURI) {
      return;
    }

    $editor.value?.chain()?.focus()?.setImage({ src: _resultURI })?.run();

    $uploadImage.value.value = "";
  }
};
const $editorAddDoc = async (_payload) => {
  if ($props.hideAttachments) return;
  _payload = _payload.target.files[0];
  const _file = _payload;

  if (!$props.baseId && $props.basePath) {
    $notification.create({
      title: "Terjadi Kesalahan",
      content: `Ada kesalahan konfigurasi, silahkan hubungi developer`,
      type: "warning",
    });
    return;
  }

  if (!$docAccept?.split(",")?.includes(_file?.type)) {
    $notification.create({
      title: "Terjadi Kesalahan",
      content: `File yang Anda masukkan tidak sesuai dengan format yang diperbolehkan`,
      type: "error",
    });
    return;
  }
  if (_file && _file.size > 3000000) {
    $notification.create({
      title: "Terjadi Kesalahan",
      content: `Pastikan ukuran file tidak lebih dari 3Mb`,
      type: "error",
    });
    return;
  }
  if (_file) {
    _payload.status = "finished";
    // change into firebase url
    const _resultURI = await $onUploadFileToCloud(_file, $props.basePath, $props.baseId);
    const _resultRef = _resultURI && (await $getRefByURL(_resultURI));
    if (!_resultURI || !_resultRef) return;
    $editor.value.commands.insertContent(
      `<doc-node href='${_resultURI}'>${_resultRef?.name}.${
        _resultRef?.meta?.contentType?.replace("application/", "") || "file"
      }</doc-node><br/>`
    );
  }

  $uploadDoc.value.value = "";
};

watch(
  () => $editor.value?.getHTML(),
  () => {
    if ($editor.value.getHTML()) {
      $emit("update", $editor.value.getHTML());
    }
  }
);

watch(
  () => $props.value,
  (newValue) => {
    if (newValue && newValue !== $editor.value?.getHTML()) {
      $editor.value.commands.setContent(newValue);
      // $editor.value.commands.selectAll();
      // $editor.value.chain().focus().setFontFamily("Plus Jakarta Sans").run();
    }
  }
);
</script>
<template>
  <n-card :title="$attrs.title || 'Rich Editor'" v-bind="$attrs">
    <input
      type="file"
      ref="$uploadImage"
      class="hidden"
      @change="$editorAddImage"
      id="avatar"
      name="avatar"
      accept="image/png, image/jpeg, image/jpg, image/bmp, image/gif"
    />
    <input
      type="file"
      ref="$uploadDoc"
      class="hidden"
      @change="$editorAddDoc"
      id="doc"
      name="doc"
      :accept="$docAccept"
    />
    <div class="flex gap-1 bg-white-smoke dark:bg-black-pure rounded-sm flex-wrap">
      <atoms-icon
        class="!rounded-sm"
        name="format-title"
        @click="$editor?.chain()?.focus()?.toggleHeading({ level: 1 })?.run()"
        :disabled="!$editor?.can()?.chain()?.focus()?.toggleHeading({ level: 1 })?.run()"
        :style="{
          background: $editor?.isActive('heading') ? $theme.buttonColor2Pressed : 'inherit',
        }"
      />
      <atoms-icon
        class="!rounded-sm"
        name="format-bold"
        @click="$editor?.chain()?.focus()?.toggleBold()?.run()"
        :disabled="!$editor?.can()?.chain()?.focus()?.toggleBold()?.run()"
        :style="{
          background: $editor?.isActive('bold') ? $theme.buttonColor2Pressed : 'inherit',
        }"
      />
      <atoms-icon
        class="!rounded-sm"
        @click="$editor?.chain()?.focus()?.toggleItalic()?.run()"
        :disabled="!$editor?.can()?.chain()?.focus()?.toggleItalic()?.run()"
        name="format-italic"
        :style="{
          background: $editor?.isActive('italic') ? $theme.buttonColor2Pressed : 'inherit',
        }"
      />
      <atoms-icon
        class="!rounded-sm"
        name="format-align-left"
        @click="$editor?.chain()?.focus()?.setTextAlign('left')?.run()"
      />
      <atoms-icon
        class="!rounded-sm"
        name="format-align-center"
        @click="$editor?.chain()?.focus()?.setTextAlign('center')?.run()"
      />
      <atoms-icon
        class="!rounded-sm"
        name="format-align-right"
        @click="$editor?.chain()?.focus()?.setTextAlign('right')?.run()"
      />
      <atoms-icon
        class="!rounded-sm"
        name="format-align-justify"
        @click="$editor?.chain()?.focus()?.setTextAlign('justify')?.run()"
      />
      <atoms-icon
        class="!rounded-sm"
        name="format-list-bulleted"
        @click="$editor?.chain()?.focus()?.toggleBulletList()?.run()"
        :disabled="
          $local.mainLoading || !$editor?.can()?.chain()?.focus()?.toggleBulletList()?.run()
        "
        :style="{
          background: $editor?.isActive('bulletList') ? $theme.buttonColor2Pressed : 'inherit',
        }"
      />
      <atoms-icon
        class="!rounded-sm"
        v-if="!$props.hideImage"
        name="image-plus"
        @click="$uploadImage.click()"
      />
      <atoms-icon
        v-if="!$props.hideAttachments"
        class="!rounded-sm"
        name="text-box-plus"
        @click="$uploadDoc.click()"
      />
    </div>
    <editor-content :ref="$attrs.ref" :editor="$editor" class="!border-0" />
    <n-text :class="[$editor?.getHTML()?.length > 5000 && !$props.hideDanger ? 'text-red-500' : '']"
      >length : {{ $editor?.getHTML()?.length }}</n-text
    >
  </n-card>
</template>

<style>
.ProseMirror:focus {
  outline: none;
}
</style>
