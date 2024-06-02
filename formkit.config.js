import { defineFormKitConfig } from '@formkit/vue'
import { rootClasses } from './formkit.theme.ts'
import { genesisIcons } from '@formkit/icons'
import { createLocalStoragePlugin } from '@formkit/addons'

import { createProPlugin, inputs } from '@formkit/pro';

const min_word_count = function ({value}, words) {
  let numberOfWords = value.split(' ').length;
  return numberOfWords >= words;
}

const max_word_count = function ({value}, words) {
  let numberOfWords = value.split(' ').length;
  return numberOfWords <= words;
}

export default defineFormKitConfig(() => {
  // const config = useRuntimeConfig()

  const pro = createProPlugin('fk-111d73aeee2', inputs)

  const localStorage = createLocalStoragePlugin({
    // plugin defaults:
    prefix: 'formkit',
    key: undefined,
    control: undefined,
    maxAge: 3600000, // 1 hour
    debounce: 200,
    beforeSave: undefined,
    beforeLoad: undefined
  })

  return {
    plugins: [pro, localStorage],
    icons: {...genesisIcons},
    rules: { min_word_count, max_word_count },
    config: {
      rootClasses,
    }
  }
});