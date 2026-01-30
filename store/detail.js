import { ref, computed, nextTick, inject } from "vue";
import { defineStore } from "pinia";
import useApi from "@/composables/useApi";
import useStorage from "@/composables/useStorage";

const _store = "details";

export const useDetailStore = defineStore(_store, {
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
      return await $api.post(__url, _body);
    },

    async get(_path = null, _options) {
      const { $api } = useApi();
      let __url = `/${this.collection}`;
      if (_path) {
        __url += `/${_path}`;
      }
      return await $api.get(__url, _options);
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
