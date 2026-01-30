import cityType from "~/constant/city.type";
import provinceType from "~/constant/province.type";
import moment from "moment";
export default defineNuxtPlugin((nuxtApp) => {
  const executeOnce = (fn: Function | null, context: any = null) => {
    var result: any;
    return function () {
      if (fn) {
        result = fn.apply(context, arguments);
        fn = null;
      }
      return result;
    };
  };

  const isElementInViewport = (el: any = null, minus = 0) => {
    let rect = el?.value?.$el?.getBoundingClientRect() || el?.value?.getBoundingClientRect();
    return (
      (rect?.top <= 0 && rect?.bottom >= 0) ||
      (rect?.bottom >= (window?.innerHeight || document.documentElement.clientHeight) &&
        rect?.top <= (window?.innerHeight || document.documentElement.clientHeight)) ||
      (rect?.top >= minus &&
        rect?.bottom <= (window?.innerHeight || document.documentElement.clientHeight))
    );
  };
  return {
    provide: {
      cityType,
      executeOnce,
      provinceType,
      window: window,
      isElementInViewport,
      isClientSide: process.client,
      getGeolocation: async (_lat: number, _lng: number) => {
        return await (
          await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${_lat}&lon=${_lng}`
          )
        ).json();
      },
      // https://nominatim.openstreetmap.org/search?q=mosque%20near%20[-8.5869073,116.0921869]&format=json&limit=50&polygon_svg=1
      getGeolocationByTerm: async (_search: string) => {
        return await (
          await fetch(
            `https://nominatim.openstreetmap.org/search?q=${_search}&format=json&limit=50&polygon_svg=1`
          )
        ).json();
      },
      getNearbyBasedOnTerm: async (_search: string, _lat: number, _lng: number) => {
        return await (
          await fetch(
            `https://nominatim.openstreetmap.org/search?q=${_search}&format=json&limit=50&polygon_svg=1`
          )
        ).json();
      },
      dateHours: (_date = new Date(), _hour = 0, _min = 0, _sec = 0, _ms = 0) => {
        return new Date(new Date(_date).setHours(_hour, _min, _sec, _ms));
      },
      dateEdit: (_date = new Date(), _by = 0) => {
        let __date = new Date(_date);
        __date.setDate(__date.getDate() + _by);
        return new Date(__date);
      },
      dateSubtract: (_by = 0, _date = new Date()) => {
        let __date = new Date(_date);
        __date.setDate(__date.getDate() - Math.abs(_by));
        return new Date(__date);
      },
      dateAddition: (_by = 0, _date = new Date()) => {
        let __date = new Date(_date);
        __date.setDate(__date.getDate() + _by);
        return new Date(__date);
      },

      lazyFetchBasedOnViewport: (_func: Function, _target: any) => {
        _func = executeOnce(_func);
        const _event = window.addEventListener("wheel", () => {
          if (typeof _func == "function" && _target && isElementInViewport(_target, 0)) {
            _func();
            window.removeEventListener("wheel", _event as any);
          }
        });
      },

      addSeparator: (num: any, minDecimalDigit = 0, maxDecimalDigit = 0, isUseBracket = false) => {
        num = Number(num);
        let displayNum = num.toLocaleString("id", {
          minimumFractionDigits: minDecimalDigit,
          maximumFractionDigits: maxDecimalDigit,
        });
        if (displayNum === "-0") {
          displayNum = 0;
        }
        // use bracket for negatif value
        if (isUseBracket) {
          if (/^-\d+/g.test(displayNum)) {
            displayNum = displayNum?.replace(/^-/g, "");
            displayNum = `(${displayNum})`;
          }
        }
        return !isNaN(num) ? displayNum : 0;
      },
      removeSeparator: (strNum: String | number) => {
        if (typeof strNum === "string") {
          return Number(strNum?.replace(/\./gi, "")?.replace(/,/gi, ".")) || null;
        }
        return strNum;
      },
      trim: (_value: any) => {
        if (typeof _value == "string") {
          return _value.trim();
        }
        return _value;
      },
      objectSetNull: (_target: any) => {
        if (typeof _target == "object")
          Object.keys(_target)?.forEach((__target_item) => {
            if (_target?.[__target_item]) {
              _target[__target_item] = null;
            }
          });
      },
      toBase64: (_file: any) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(_file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        }),
      greeting: () => {
        const hour = moment().hour();
        if (hour > 18) return "Good Evening 🌙";
        // if (hour > 15) return "Good Afternoon ⛅️";
        if (hour > 11) return "Good Afternoon ⛅️";
        return "Good Morning 🌤";
      },
    },
  };
});
