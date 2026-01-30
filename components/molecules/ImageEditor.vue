<script setup>
import { NButton, useNotification, NTabs, NTabPane, NUpload, NUploadDragger } from "naive-ui";
import * as uuid from "uuid";
// import { AtomsNodata, AtomsImageNative } from "@/components/Atoms";

const $breakpoint = useBreakpoint();

const attrs = useAttrs();
const $onClose = inject("$onClose");
const $notification = useNotification();
const $canvas = ref(null);
const $props = defineProps({
  accept: {
    type: String,
    default: "image/png, image/jpeg, image/jpg, image/gif",
  },
  max: {
    type: Number,
    default: 1,
  },
});
const $local = reactive({
  result: null,
  tab: "camera",
  stream: null,
  canvas: null,
  captured: null,
  isCaptured: null,
  source: null,
  rawSource: null, // 'image'
  mainLoading: false,
});

const $toBase64 = (_file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(_file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

const $isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const $checkIsAvailable = async () => {
  const _md = navigator.mediaDevices;
  const _devices = await _md?.enumerateDevices();
  // surely videoinput is exist
  if (_devices?.find((it) => it.kind == "videoinput")) {
    return Promise.resolve(_devices);
  } else {
    $resetOnCamera();
    return Promise.reject(
      "Your device does not have access to camera. Please make sure all connected and try again."
    );
  }
};
const $removeCamera = async () => {
  await $local.stream?.getTracks()?.forEach((_track) => _track.stop());
};
const $resetOnCamera = async () => {
  await $removeCamera();
  $local.stream = null;
  $local.canvas = null;
  $local.captured = null;
  $local.isCaptured = null;
  $local.source = null;
  $local.rawSource = null;
  $local.result = null;
};
const $initializeCamera = async () => {
  $local.mainLoading = true;
  $resetOnCamera();
  // navigator.mediaDevices.getUserMedia =
  //   navigator.mediaDevices?.getUserMedia ||
  //   navigator.mediaDevices?.webkitGetUserMedia ||
  //   navigator.mediaDevices?.mozGetUserMedia ||
  //   navigator.mediaDevices?.msGetUserMedia;
  try {
    $local.stream = await navigator?.mediaDevices
      ?.getUserMedia({
        audio: false,
        video: true,
      })
      .catch((err) => {
        return Promise.reject("Have no access to camera. Please give the access to continue!");
      });
    // console.log($local.stream)

    if (!$isMobileDevice() && $checkIsAvailable() && $local.stream) {
      $local.captured =
        ("ImageCapture" in window && new ImageCapture($local.stream.getVideoTracks()[0])) ||
        $local.stream.getVideoTracks()[0];
    }
  } catch (error) {
    $notification.error({
      title: "Kesalahan",
      content: error?.message || error || "Modul error, tutup dan buka kembali modul ini",
    });
    $onClose();
  } finally {
    $local.mainLoading = false;
  }
};
const $onPhotoTaken = async () => {
  $local.mainLoading = true;
  try {
    if (!$local.captured) {
      return;
    }
    await $local.captured.takePhoto().then(async (_blob) => {
      if ($local.source) {
        URL.revokeObjectURL($local.source);
      }
      $local.result = [
        {
          id: uuid.v4(),
          rawSource: _blob,
          source: await $toBase64(_blob),
        },
      ];
      // console.log(_blob, $local.source)
    });
  } finally {
    $local.mainLoading = false;
  }
  // }
};
const $isPictureValid = (_file, _accept = "image") => {
  const _size = 2000000;
  if (
    !_accept?.includes(_file?.type?.split("/")?.[1])
    // && _file?.raw?.find((_it) => !_accept?.includes(_it?.type))
  ) {
    $notification.create({
      title: "Terjadi Kesalahan",
      content: `Pastikan yang dimasukkan dalam format ${$props.accept}`,
      type: "error",
    });
    return false;
  } else if (
    _file?.size > _size
    // && _file?.raw?.find((_it) => !_it?.size > _size)
  ) {
    $notification.create({
      title: "Terjadi Kesalahan",
      content: `Pastikan file tidak lebih dari 2mb`,
      type: "error",
    });
    return false;
  }
  return true;
};
const $onUploadFile = async (_payload) => {
  _payload?.fileList?.forEach(async (_item) => {
    if ($isPictureValid(_item?.file, $props.accept)) {
      _item.status = "finished";
      $local.result = [
        ...($local.result || []),
        {
          ...(_item || []),
          rawSource: _item?.file,
          source: await $toBase64(_item?.file),
        },
      ];
    } else {
      _item.status = "error";
    }
  });
};

const $validateTab = async () => {
  await $resetOnCamera();
  if ($local.tab == "camera") {
    $initializeCamera();
  } else if ($local.tab == "files") {
  }
};

watch(
  () => $local.tab,
  () => {
    $validateTab();
  }
);

onMounted(() => {
  if (attrs?.camera?.disabled) {
    $local.tab = "files";
  }
  $validateTab();
});

onBeforeUnmount(() => {
  $resetOnCamera();
});
</script>
<template>
  <div>
    <n-tabs type="line" animated v-model:value="$local.tab">
      <n-tab-pane
        v-if="!$attrs?.camera?.disabled"
        v-bind="$attrs.camera"
        name="camera"
        tab="Camera"
      >
        <div v-if="!$attrs?.camera?.disabled && $local.stream && !$local.mainLoading">
          <div v-if="!$local.result && $local.stream">
            <video
              :srcObject="$local.stream"
              class="rounded-sm bg-white-smoke w-full dark:bg-black my-5"
              autoplay
            />
            <br />
            <n-button class="w-full" type="primary" @click="$onPhotoTaken"
              ><template #icon><atoms-icon flat name="camera" :size="15" /> </template>Take
              Photo</n-button
            >
          </div>
          <div v-else-if="$local.result?.length > 0">
            <atoms-image-native
              :src="$local.result?.[0]?.source"
              :cover="false"
              class="min-h-[250px] rounded-sm"
            />
            <br />
            <n-button
              class="w-full"
              type="primary"
              @click="
                () => {
                  $resetOnCamera();
                  $initializeCamera();
                }
              "
              ><template #icon><atoms-icon flat name="camera" :size="15" /> </template>Retake
            </n-button>
            <br />
            <br />
            <n-button class="w-full" @click="$onClose($local.result)"
              ><template #icon><atoms-icon flat name="check" width="15" /> </template>Save</n-button
            >
          </div>
          <atoms-empty
            v-else
            message="Something wrong, please refresh this dialog"
            image=""
          ></atoms-empty>
        </div>
        <atoms-empty v-else-if="$local.mainLoading" image="" message="Loading"></atoms-empty>
        <atoms-empty
          v-else
          message="Something wrong, please refresh this dialog"
          image=""
        ></atoms-empty>
      </n-tab-pane>
      <n-tab-pane v-bind="$attrs.files" name="files" tab="Files">
        <n-upload
          v-bind="$attrs.files"
          directory-dnd
          create-thumbnail-url
          :max="$props.max"
          :accept="$props.accept"
          :default-file-list="$local.result || []"
          @change="
            (_payload) => {
              // console.log('change', _payload);
              $onUploadFile(_payload);
            }
          "
          @remove="
            (_payload) => {
              // console.log('delete', _payload);
              $onUploadFile(_payload);
            }
          "
        >
          <n-upload-dragger>
            <div style="margin-bottom: 12px">
              <atoms-icon name="file" flat />
            </div>
            <atoms-text strong> Click or drag your file to upload </atoms-text>
            <n-p depth="3" style="margin: 8px 0 0 0"> Make sure your file is matched </n-p>
          </n-upload-dragger>
        </n-upload>
        <br />
        <n-button type="primary" class="w-full" @click="$onClose($local.result)">Save</n-button>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>
