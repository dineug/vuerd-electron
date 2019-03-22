import Vue from 'vue'
import Router from 'vue-router'
import ERD from '../views/ERD'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'ERD',
      component: ERD
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
