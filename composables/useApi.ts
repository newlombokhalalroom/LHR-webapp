import { useUserStore } from "@/store/user";
import useStorage from "@/composables/useStorage";
import axios from "axios";

export default function () {
  const { $storage } = useStorage();
  const $userStore = useUserStore();
  const $config = useRuntimeConfig();

  const $headers = {
    "Content-type": "application/json",
  };

  const $api = axios.create({
    baseURL: $config.public.apiUrl as string,
    headers: $headers,
  });

  const $retry = axios.create({
    baseURL: $config.public.apiUrl as string,
    headers: $headers,
  });

  $api.interceptors.request.use((_config: any) => {
    const $token = $storage("credentials");
    if ($token?.access && $token?.refresh) {
      _config.headers = {
        Authorization: `Bearer ${$token?.access}`,
      };
    }
    if (import.meta.env.VITE_ENV === "development") {
      console.warn(new Date(), " Making request to : ", _config.url);
    }
    return _config;
  });

  $api.interceptors.response.use(
    (_response: any) => {
      return _response.data || _response;
    },
    async (_error: any) => {
      const _originalRequest = _error.config;

      // todo : logout on server error or forbidden
      if (
        !_error.response ||
        Boolean(_error?.response?.status === 403 || _error?.response?.status === 500)
      ) {
        // await useUserStore()?.logout();
        return Promise.reject(_error?.response || _error || new Error("Server Error!"));
      }

      // todo : generate new token on expire or 401
      if (_error?.response?.status === 401 && !_originalRequest?._retry) {
        _originalRequest._retry = true;

        const _generateAccess = async () => {
          let _token = $storage("credentials");
          if (_token) {
            _token = _token.refresh;
            const { data } = (await $retry
              .put(`authentications`, {
                refreshToken: _token,
              })
              .catch(async () => {
                await $userStore.logout();
              })) as any;

            if (data?.result?.accessToken) {
              $storage("credentials", {
                access: data.result.accessToken,
                refresh: _token,
              });
              _token = data.accessToken;
            }
          }
          return _token;
        };

        await _generateAccess();
        return await $api(_originalRequest);
      }

      return Promise.reject(_error?.response);
    }
  );

  return {
    $api,
    $headers,
    $axios: axios,
  };
}
