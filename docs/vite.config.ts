import vue from "@vitejs/plugin-vue";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  base: "/vike-vue-content/",
  plugins: [vike(), vue(), VueI18nPlugin({ ssr: true })],
});
