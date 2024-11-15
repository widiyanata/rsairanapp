// main.js
import Home from './components/Home.js';
import About from './components/About.js';

const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;
// const { createPinia, PiniaVuePlugin  } = Pinia;

// Router Setup
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About }
];
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// Main App
const app = createApp({
  template: `
    <div>
      <h1>Vue 3 Project with Router & Store</h1>
      <p>{{ storeMessage }}</p>
      <button @click="changeMessage">Change Message</button>
      <nav>
        <router-link to="/">Home</router-link> |
        <router-link to="/about">About</router-link>
      </nav>
      <router-view></router-view>
    </div>
  `,
  computed: {
    
  },
  methods: {
    
  },
  setup() {
    return { mainStore };
  }
});

// Use Router & Store
app.use(router);
app.use(createPinia());
app.mount('#app');
