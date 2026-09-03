
import { UserRole } from 'boardgame-web-common'
import { createRouter, createWebHistory } from 'vue-router'
import { useLocalStore } from './services/localStore.ts'
import AdminGamesListView from './views/AdminGamesListView.vue'
import AdminGameView from './views/AdminGameView.vue'
import GameView from './views/GameView.vue'
import HomeView from './views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/games/:id',
            name: 'game',
            component: GameView
        },
        {
            path: '/admin/games',
            name: 'admin-games',
            component: AdminGamesListView,
            meta: { roles: [UserRole.ADMIN] }
        },
        {
            path: '/admin/games/:id',
            name: 'admin-game',
            component: AdminGameView,
            meta: { roles: [UserRole.ADMIN] }
        }
    ]
})

router.beforeEach((to) => {
    const localStore = useLocalStore()
    const user = localStore.user

    const roles = to.meta.roles as UserRole[]
    if (roles) {
        if (!roles.every(role => user.roles.includes(role))) {
            return { path: '/' }
        }
    }
    return true
})

export default router