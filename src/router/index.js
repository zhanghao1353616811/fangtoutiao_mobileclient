import Vue from 'vue'
import VueRouter from 'vue-router'

// const login = () => import('@/views/login')

Vue.use(VueRouter)

// 配置路由表
const routes = [
  {
    name: 'login',
    path: '/login',
    component: () => import('@/views/login')
  },
  {
    path: '/',
    component: () => import('@/views/tab-bar'),
    children: [
      {
        name: 'home',
        path: '', // 子路由什么也不写 默认子路由 组件home
        component: () => import('@/views/home')
      },
      {
        name: 'question',
        path: '/question',
        component: () => import('@/views/question')
      },
      {
        name: 'video',
        path: '/video',
        component: () => import('@/views/video')
      },
      {
        name: 'my',
        path: '/my',
        component: () => import('@/views/my')
      },
      {
        name: 'user',
        path: '/user/:userId',
        component: () => import('@/views/user')
      },
      {
        name: 'search',
        path: 'search',
        component: () => import('@/views/search')
      },
      {
        name: 'article',
        path: '/article/:articleId',
        component: () => import('@/views/article')
      }
    ]
  }
]

const router = new VueRouter({
  routes
})

export default router
