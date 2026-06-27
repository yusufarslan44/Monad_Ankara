import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import router from './app/router';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: false,
    },
  },
});

app.use(pinia);
app.use(router);
app.use(VueQueryPlugin, { queryClient });
app.mount('#app');
