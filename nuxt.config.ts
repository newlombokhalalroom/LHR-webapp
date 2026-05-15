// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-10-22",

  ssr: false, // Wajib dimatikan karena Naive UI menggunakan browser API

  devtools: { enabled: true },

  devServer: {
    port: 9000,
  },

  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", "nuxt3-leaflet"],

  // Tambahkan vite config
  vite: {
    optimizeDeps: {
      include: [
        "naive-ui",
        "vueuc",
        "date-fns-tz/formatInTimeZone",
        "@css-render/vue3-ssr",
        "@juggle/resize-observer",
      ],
    },
  },

  build: {
    transpile: [
      "mdi-vue",
      "print-js",
      "@juggle/resize-observer",
      "@css-render/plugin-bem",
      "@css-render/vue3-ssr",
      "lodash.debounce",
    ],
  },

  runtimeConfig: {
    public: {
      secret: process.env.NUXT_SECRET,
      globalSecret: process.env.NUXT_GLOBAL_SECRET,
      apiUrl: process.env.NUXT_API,
      apiKey: process.env.NUXT_API_KEY,
      authDomain: process.env.NUXT_AUTH_DOMAIN,
      projectId: process.env.NUXT_PROJECT_ID,
      storageBucket: process.env.NUXT_STORAGE_BUCKET,
      messagingSenderId: process.env.NUXT_MESSAGING_SENDER_ID,
      appId: process.env.NUXT_APP_ID,
      measurementId: process.env.NUXT_MEASUREMENT_ID,
      midServerKey: process.env.NUXT_MIDTRANS_SERVER_KEY,
    },
  },

  tailwindcss: {
    exposeConfig: true,
  },

  pinia: {
    autoImports: ["defineStore", ["defineStore", "definePiniaStore"]],
  },

  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      titleTemplate: `%s - Halal Travel Platform In Indonesia`,
      title: "Lombok Halal Room",
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap",
        },
      ],
      meta: [
        {
          name: "keywords",
          content: ["lombokhalalroom"],
        },
      ],
      script: [
        {
          src: "https://app.sandbox.midtrans.com/snap/snap.js",
          "data-client-key": "SB-Mid-client-9e8Oy94DOtYnzVxG",
        },
      ],
    },
  },
} as any);
