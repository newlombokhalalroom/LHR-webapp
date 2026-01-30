// ~/store/policies.js

import { defineStore } from "pinia";
import useApi from "@/composables/useApi";

const _store = "policies";

export const usePoliciesStore = defineStore(_store, {
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
      return await $api.post(__url, _body); // biasanya PUT, tapi mengikuti detail
    },

    async get(_path = null, _options) {
      const { $api } = useApi();
      let __url = `/${this.collection}`;
      if (_path) __url += `/${_path}`;
      const res = await $api.get(__url, _options);
      if (res?.status) this.data = res.result.policies ?? res.result;
      return res;
    },

    async delete(_path) {
      const { $api } = useApi();
      return await $api.delete(`/${this.collection}/${_path}`);
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
