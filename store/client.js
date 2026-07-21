import { ref, computed, nextTick, inject } from "vue";
import { defineStore } from "pinia";
import useApi from "@/composables/useApi";
import useStorage from "@/composables/useStorage";
// // import { useMemberStore } from './member'
// // import { useWorkerStore } from './worker'

const _store = "clients";

export const useClientStore = defineStore(_store, {
  state: () => ({
    collection: _store,
    data: null,
  }),
  actions: {

    async post(_path = null, _body) {
      const { $api } = useApi();
      let __url = `/${this.collection}`;
      if (_path) {
        __url += `/${_path}`;
      }
      return await $api.post(__url, _body);
    },

    async put(_path = null, _body) {
      const { $api } = useApi();
      let __url = `/${this.collection}`;
      if (_path) {
        __url += `/${_path}`;
      }
      return await $api.put(__url, _body);
    },

    async get(_path = null, _options) {
      const { $api } = useApi();
      let __url = `/${this.collection}`;
      if (_path) {
        __url += `/${_path}`;
      }
      return await $api.get(__url, _options);
    },
    async delete(_path = null, _options) {
      const { $api } = useApi();
      let __url = `/${this.collection}`;
      if (_path) {
        __url += `/${_path}`;
      }
      return await $api.delete(__url, _options);
    },
    // US-15 Melakukan Pendaftaran Mitra - Pemanggilan fungsi post untuk menyimpan data client
    async register(_payload) {
      const { $api } = useApi();
      return await $api.post(`/${this.collection}`, _payload);
    },
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
});
