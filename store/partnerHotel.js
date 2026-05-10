import { defineStore } from "pinia";
import useApi from "@/composables/useApi";

const _store = "partner-hotels";

export const usePartnerHotelStore = defineStore(_store, {
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

    async delete(_path = null, _options) {
      const { $api } = useApi();
      let __url = `/${this.collection}`;
      if (_path) {
        __url += `/${_path}`;
      }
      return await $api.delete(__url, _options);
    },

    async get(_path = null, _options) {
      const { $api } = useApi();
      let __url = `/${this.collection}`;
      if (_path) {
        __url += `/${_path}`;
      }
      return await $api.get(__url, _options);
    },

    async getByClientId(clientId) {
      const { $api } = useApi();
      return await $api.get(`/clients/${clientId}/${this.collection}`);
    },

    async getMyHotels() {
      const { $api } = useApi();
      return await $api.get(`/${this.collection}/me`);
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
