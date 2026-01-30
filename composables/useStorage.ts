import { VueCookieNext } from "vue-cookie-next";
import jwtDecode, { type JwtDecodeOptions } from "jwt-decode";
import CryptoJS from "crypto-js";
import localforage from "localforage";

export default function () {
  type storage_type = Object | string | number | CryptoJS.lib.CipherParams | any;

  const $config = useRuntimeConfig();

  const $encrypt = (data: storage_type, secret = $config.public.secret) => {
    data = CryptoJS.AES.encrypt(JSON.stringify(data), secret as any);
    return data.toString();
  };

  const $decrypt = (data: storage_type, secret = $config.public.secret) => {
    data = CryptoJS.AES.decrypt(data as any, secret as any);
    return JSON.parse(data.toString(CryptoJS.enc.Utf8));
  };

  // CryptoJS.enc.Utf8

  const $jwtDecode = (token: string, opts: JwtDecodeOptions) => jwtDecode(token, opts);

  const $hash = (key: string | CryptoJS.lib.WordArray, secret: any = $config.public.secret) => {
    key = CryptoJS.SHA256(key, secret);
    return key.toString();
  };

  const $storage = (_id: string, _value: any = undefined, _instance = false) => {
    let _result;
    const _cookie = (_payload: string) => VueCookieNext.getCookie($hash(_payload));

    if (_instance) {
      _result = VueCookieNext;
    } else if (_value === undefined && _cookie(_id)) {
      // todo : get value
      _result = $decrypt(_cookie(_id));
    } else if (_id && _value === null) {
      // todo : delete value
      VueCookieNext.removeCookie($hash(_id));
    } else if (_id && _value) {
      // todo : set value
      const _newVal = $encrypt(_value);
      VueCookieNext.setCookie($hash(_id), _newVal, {
        expire: "7d",
        path: "/",
        sameSite: "Lax",
      });
      _result = _newVal;
    }
    return _result || undefined;
  };

  const $configStorage = () => {
    localforage.config({
      driver: localforage.INDEXEDDB, // Force WebSQL; same as using setDriver()
      name: "myApp",
      version: 2.0,
      storeName: "tampung", // Should be alphanumeric, with underscores.
      description: "store datas",
    });
  };

  const $dropStorage = async () => {
    await indexedDB.databases().then((dbs) => {
      dbs.forEach((db) => {
        var request = indexedDB.deleteDatabase(db.name as string);
        // console.log(db.name)
        request.onsuccess = function (e) {
          // console.log('storage-success')
        };
        request.onblocked = function (e) {
          // console.log('storage-blocked: ' + e)
          // Close connections here
        };
        request.onerror = function (e) {
          // console.log('storage-error: ' + e)
        };
      });
    });
  };

  const $useDbStorage = async (id: any, value: any, instance = false) => {
    let result;
    const store = async (payload: any) => await localforage.getItem($hash(payload));

    if (instance) {
      result = localforage;
    } else if (value === undefined && (await store(id))) {
      result = $decrypt(await store(id));
    } else if (id && value === null) {
      await localforage.removeItem($hash(id));
    } else if (id && !!value) {
      const newVal = $encrypt(value);
      await localforage.setItem($hash(id), newVal);
      result = newVal;
    }

    return result || undefined;
  };

  return {
    $encrypt,
    $decrypt,
    $jwtDecode,
    $storage,
    $hash,
    $configStorage,
    $dropStorage,
    $useDbStorage,
  };
}
