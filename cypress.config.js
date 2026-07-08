import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:9000",
    setupNodeEvents(on, config) {},
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    supportFile: false,
    // URL backend API didefinisikan di sini agar tidak tertimpa baseUrl
    env: {
      apiUrl: "http://localhost:8080",
    },
  },
});
