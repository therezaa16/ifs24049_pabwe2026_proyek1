import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { endSession } from './app/session.js';
import { createAppRouter } from './app/router/index.js';
import { setUnauthorizedHandler } from './core/http/index.js';
import './app/styles/tokens.css';
import './app/styles/base.css';

const app = createApp(App);
const pinia = createPinia();
const router = createAppRouter();

app.use(pinia);
app.use(router);

// Token kedaluwarsa atau ditolak server: bersihkan sesi dan kembali ke halaman masuk.
setUnauthorizedHandler(() => {
  endSession();
  router.replace({ name: 'login' });
});

app.mount('#app');
