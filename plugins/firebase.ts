import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const firebaseConfig = {
    apiKey: config.public.apiKey,
    authDomain: config.public.authDomain,
    projectId: config.public.projectId,
    storageBucket: config.public.storageBucket,
    messagingSenderId: config.public.messagingSenderId,
    appId: config.public.appId,
    measurementId: config.public.measurementId,
  };
  const $firebaseApp = initializeApp(firebaseConfig);
  const $storage = getStorage($firebaseApp);
  return {
    provide: {
      firebase: $firebaseApp,
      uploadFile: async (_blob: any, _urlPath: string, _filename: string) => {
        const __ref = ref($storage, _urlPath + "/" + _filename);
        return await getDownloadURL((await uploadBytes(__ref, _blob))?.ref);
      },
      getRefByURL: async (_url: string) => {
        let _path = _url?.replaceAll("%2F", "/")?.split("/o/")?.[1];

        if (_path?.includes("?")) _path = _path?.split("?")?.[0];

        if (!_path) return;

        let _targetRef = ref($storage, _path);
        return await getDownloadURL(_targetRef);
      },
      deleteFileByURL: async (_url: string) => {
        let _path = _url?.replaceAll("%2F", "/")?.split("/o/")?.[1];

        if (_path?.includes("?")) _path = _path?.split("?")?.[0];

        if (!_path) return undefined;

        const _targetRef = ref($storage, _path);

        // console.log('target will deleted', _targetRef.getDownloadURL())
        deleteObject(_targetRef);
        return await deleteObject(_targetRef);
      },
    },
  };
});

// nuxtApp.vueApp.use(VueFire, {
//   firebaseApp: createFirebaseApp,
//   modules: [
//     // ... other modules
//     VueFireAuth(),
//   ],
// });
