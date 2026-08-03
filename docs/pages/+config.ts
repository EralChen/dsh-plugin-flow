import type { Config } from "vike/types";
import vikeVue from "vike-vue/config";
import vikeVueContent from "vike-vue-content/config";
import { defineTheme } from "vike-vue-content/theme";

const custom = defineTheme({
  name: "custom",
  fonts: {
    sans: "'Open Sans', sans-serif"
  },
  radius: "0.5rem",
  light: {
    primary: "#8b5cf6",
    neutral: "slate"
  },
  dark: {
    primary: "#8b5cf6",
    neutral: "slate"
  }
})

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/head-tags
  title: "My Vike App",
  description: "Demo showcasing Vike",
  prerender: true,
  extends: [vikeVue, vikeVueContent],

  theme: 'custom',
  themes: [custom],
} satisfies Config;
