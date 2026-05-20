import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
const Dashboard = () => import('@/views/Dashboard.vue')

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: '系统仪表板'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 游戏买量系统` : '游戏买量系统'
  next()
})

export default router
