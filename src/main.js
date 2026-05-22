import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    if (document.querySelector('[data-testid="p5-mobile-claim-popup"]')) {
      window.location.reload()
    }
  })
}

createApp(App).mount('#app')
