import { defineStore, acceptHMRUpdate } from "pinia";
import useApi from "@/composables/useApi";
import useStorage from "@/composables/useStorage";
import { useClientStore } from "@/store/client";
// import { useWorkerStore } from './worker'

const _store = "users";

export const useUserStore = defineStore(_store, {
  state: () => ({
    data: undefined,
    collection: _store,
    collectionAuth: "authentications",
  }),
  getters: {
    getScope: (state) => state.data?.scope || null,
    getClientType: (state) => state.data?.client?.type || null,
    getClientTypeApp: (state) => state.data?.client?.type?.replaceAll(" ", "-") || null,
  },
  actions: {
    // async post(_path = null, _body) {
    //   const { $api } = useApi();
    //   let __url = `/${this.collection}`;
    //   if (_path) {
    //     __url += `/${_path}`;
    //   }
    //   return await $api.post(__url, _body);
    // },

    // async put(_path = null, _body) {
    //   const { $api } = useApi();
    //   let __url = `/${this.collection}`;
    //   if (_path) {
    //     __url += `/${_path}`;
    //   }
    //   return await $api.put(__url, _body);
    // },

    // async get(_path = null, _options) {
    //   const { $api } = useApi();
    //   let __url = `/${this.collection}`;
    //   if (_path) {
    //     __url += `/${_path}`;
    //   }
    //   return await $api.get(__url, _options);
    // },
    // async del(_path = null) {
    //   const { $api } = useApi();
    //   let __url = `/${this.collection}`;
    //   if (_path) {
    //     __url += `/${_path}`;
    //   }
    //   return await $api.delete(__url);
    // },

    // Generic Actions with absolute path support
    async post(_path = null, _body, _options = {}) {
      const { $api } = useApi();
      let __url;
      if (_path && _path.startsWith("/")) {
        __url = _path;
      } else {
        __url = `/${this.collection}`;
        if (_path) __url += `/${_path}`;
      }
      return await $api.post(__url, _body, _options);
    },

    async put(_path = null, _body, _options = {}) {
      const { $api } = useApi();
      let __url;
      if (_path && _path.startsWith("/")) {
        __url = _path;
      } else {
        __url = `/${this.collection}`;
        if (_path) __url += `/${_path}`;
      }
      return await $api.put(__url, _body, _options);
    },

    async get(_path = null, _options = {}) {
      const { $api } = useApi();
      let __url;
      if (_path && _path.startsWith("/")) {
        __url = _path;
      } else {
        __url = `/${this.collection}`;
        if (_path) __url += `/${_path}`;
      }
      return await $api.get(__url, _options);
    },

    async del(_path = null, _options = {}) {
      const { $api } = useApi();
      let __url;
      if (_path && _path.startsWith("/")) {
        __url = _path;
      } else {
        __url = `/${this.collection}`;
        if (_path) __url += `/${_path}`;
      }
      return await $api.delete(__url, _options);
    },

    async putSuperAdminUser(id, body) {
      const { $api } = useApi();
      return await $api.put(`/super-admin/users/${id}`, body);
    },

    async putSuperAdminUserPassword(id, body) {
      const { $api } = useApi();
      return await $api.put(`/super-admin/users/${id}/password`, body);
    },
    async deleteSuperAdminUser(id, body) {
      const { $api } = useApi();
      return await $api.delete(`/super-admin/users/${id}`);
    },
    async postSuperAdminUserByRole(role, payload) {
      return await this._api.post(`/super-admin/users/${role}`, payload);
    },
    async postSuperAdminUserByRole(role, payload) {
      return await this.post(`/super-admin/users/${role}`, payload);
    },

    async refresh() {
      const $clientStore = useClientStore();
      const { $storage, $jwtDecode } = useStorage();
      const { $api } = useApi();

      try {
        if (!navigator.onLine) {
          return;
        }

        let _credentials = $storage("credentials");
        const _userId = _credentials?.access && $jwtDecode(_credentials.access)?.id;

        if (!_userId) {
          throw new Error("Invalid credentials");
        }

        const _response = await $api.get(`/${this.collection}/${_userId}`);
        _credentials = $storage("credentials");

        let _body = {
          ...($jwtDecode(_credentials.access) || {}),
          ...(_response?.result || {}),
        };

        if (_body?.scope?.includes("admin") && !_body?.scope?.includes("super")) {
          _body.client = (await $clientStore.get("byUser"))?.result;
        }

        if (!_credentials) {
          throw new Error("Invalid credentials");
        }

        if (_body) {
          this.set({ data: _body });
        } else {
          throw new Error("invalid login");
        }
      } catch (error) {
        this.logout();
      }
    },

    async login(_payload) {
      const { $storage } = useStorage();
      const { $api } = useApi();
      try {
        let _response = await $api.post(`/${this.collectionAuth}`, {
          usernameOrEmail: _payload?.email,
          password: _payload?.password,
        });

        const _data = _response?.result;

        if (_data) {
          $storage("credentials", {
            access: _data.accessToken,
            refresh: _data.refreshToken,
          });
          delete _response?.result;
        }

        return _response;
      } catch (error) {
        throw error;
      }
    },

    // async refresh() {
    //   const $clientStore = useClientStore();
    //   const { $storage, $jwtDecode } = useStorage();
    //   const { $api } = useApi();

    //   try {
    //     if (!navigator.onLine) {
    //       return;
    //     }

    //     let _credentials = $storage("credentials");
    //     const _userId = _credentials?.access && $jwtDecode(_credentials.access)?.id;

    //     if (!_userId) {
    //       throw new Error("Invalid credentials");
    //     }

    //     const _response = await $api.get(`/${this.collection}/${_userId}`);
    //     _credentials = $storage("credentials");

    //     let _body = {
    //       ...($jwtDecode(_credentials.access) || {}),
    //       ...(_response?.result || {}),
    //     };

    //     if (_body?.scope?.includes("admin") && !_body?.scope?.includes("super")) {
    //       _body.client = (await $clientStore.get("byUser"))?.result;
    //     }

    //     if (!_credentials) {
    //       throw new Error("Invalid credentials");
    //     }

    //     if (_body) {
    //       this.set({ data: _body });
    //     } else {
    //       throw new Error("invalid login");
    //     }
    //   } catch (error) {
    //     this.logout();
    //   }
    // },

    // async login(_payload) {
    //   const { $storage } = useStorage();
    //   const { $api } = useApi();

    //   const identifier = _payload?.email ?? _payload?.username ?? _payload?.identifier;

    //   let _response = await $api.post(`/${this.collectionAuth}`, {
    //     usernameOrEmail: identifier,
    //     password: _payload?.password,
    //   });

    //   const _data = _response?.result;
    //   if (_data?.accessToken) {
    //     $storage("credentials", {
    //       access: _data.accessToken,
    //       refresh: _data.refreshToken,
    //     });
    //     // >>> penting: muat profil + scope ke store
    //     await this.refresh();
    //   }
    //   return _response;
    // },

    async logout() {
      const { $storage } = useStorage();
      $storage("credentials", null);
      nextTick(() => {
        this.clear();
      });
    },
    set(_payload) {
      this.$patch((state) => {
        state = Object.assign(state, {
          ...state,
          ..._payload,
        });
      });
    },
    clear() {
      this.$reset();
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
