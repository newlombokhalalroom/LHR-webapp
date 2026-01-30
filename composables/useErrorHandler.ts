import { watch, reactive, inject } from "vue";
import { useMessage, useNotification } from "naive-ui";
import { useRoute } from "vue-router";
import { useUserStore } from "@/store/user";
import useStorage from "@/composables/useStorage";

export default function () {
  const { $storage } = useStorage();
  const $notification = useNotification();
  const $message = useMessage();
  const $userStore = useUserStore();
  const route = useRoute();
  const $path = "logs";

  const $type = {
    info: "info",
    warning: "warning",
    error: "error",
  };

  const $createError = async (_err: any, _title = "Something went wrong", _type = $type.error) => {
    if ($notification) {
      if (_err?.message?.includes("canceled") || _err?.status == 404) {
        return;
      } else if (_type == $type.info) {
        $notification.create({
          title: _title,
          content: _err?.data?.message || _err?.message || _err,
          type: $type.info as any,
        });
        return;
      } else {
        $message.warning("Your internet connection were not stable", { duration: 1000 });
        // $notification.create({
        //   title: _title,
        //   content:
        //     "Your internet connection were not stable, please reload the page" ||
        //     _err?.data?.message ||
        //     _err?.message ||
        //     _err,
        //   type: _type as any,
        // });
      }
    }

    const __body = {
      date: new Date(),
      detail: _err,
      path: route?.fullPath || "unknown",
      message: _err?.response?.message || _err?.data?.message || _err?.message || _err,
      user: $userStore.$state?.data,
      route,
    };

    // let __result;
    // const __error = await $storage($path);
    // if (__error?.length > 0) {
    //   __result = [...__error, __body];
    // } else {
    //   __result = [__body];
    // }
    // await $storage($path, __result);

    // if ($type.error == $type.info) return;

    // throw _err
  };

  return reactive({
    $createError,
  });
}
