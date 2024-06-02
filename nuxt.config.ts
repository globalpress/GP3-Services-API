export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  devServer: {
    port: 3333,
  },
  modules: [
    "@formkit/nuxt",
    '@vueuse/nuxt',
  ],
  formkit: {
    // Experimental support for auto loading (see note):
    autoImport: true,
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
});
