import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'material-design-icons/iconfont/material-icons.css'
import './app.scss'

const App = createApp({
  onShow(options) {
  },
})

App.use(createPinia())

export default App
