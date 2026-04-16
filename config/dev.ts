import type { UserConfigExport } from "@tarojs/cli";
export default {
  mini: {},
  h5: {},
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['legacy-js-api'],
        }
      }
    }
  }
} satisfies UserConfigExport<'vite'>
