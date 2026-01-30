import * as mdijs from "@mdi/js";
import mdiVue from "mdi-vue/v3";
import { vMaska } from 'maska'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(mdiVue, {
    icons: mdijs,
  });
  nuxtApp.vueApp.directive('maska', vMaska)
});

// nuxtApp.vueApp.use(VueFire, {
//   firebaseApp: createFirebaseApp,
//   modules: [
//     // ... other modules
//     VueFireAuth(),
//   ],
// });
