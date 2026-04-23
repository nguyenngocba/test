import { appState } from './state.js';
import { eventBus, EVENTS } from './eventBus.js';
import { router } from './router.js';
import { storage } from './storage.js';
import { loginPage } from '../views/pages/LoginPage.js';
import { dashboardPage } from '../views/pages/DashboardPage.js';
import { materialsPage } from '../views/pages/MaterialsPage.js';
import { projectsPage } from '../views/pages/ProjectsPage.js';
import { suppliersPage } from '../views/pages/SuppliersPage.js';
import { logsPage } from '../views/pages/LogsPage.js';
import { settingsPage } from '../views/pages/SettingsPage.js';
import { Sidebar } from '../views/layouts/Sidebar.js';
import { Topbar } from '../views/layouts/Topbar.js';

class App {
    constructor() {
        this.pages = {
            entry: materialsPage,
            dashboard: dashboardPage,
            projects: projectsPage,
            suppliers: suppliersPage,
            logs: logsPage,
            settings: settingsPage
        };
    }

    init() {
        const savedData = storage.load();
        appState.load(savedData);
        this.setupEventListeners();
        
        const savedUser = storage.getUser();
        if (savedUser) appState.setCurrentUser(savedUser);
        
        this.render();
        router.init();
        
        console.log('✅ SteelTrack Pro initialized');
    }

    setupEventListeners() {
        eventBus.on(EVENTS.PANE_CHANGED, (pane) => {
            appState.setCurrentPane(pane);
            this.render();
        });
        
        eventBus.on(EVENTS.LOGIN, (user) => {
            appState.setCurrentUser(user);
            storage.setUser(user);
            router.navigate('entry');
            this.render();
        });
        
        eventBus.on(EVENTS.LOGOUT, () => {
            appState.setCurrentUser(null);
            storage.clearUser();
            this.render();
        });
        
        eventBus.on(EVENTS.DATA_CHANGED, () => this.render());
    }

    render() {
        const root = document.getElementById('root');
        
        if (!appState.getCurrentUser()) {
            root.innerHTML = loginPage.render();
            return;
        }
        
        const currentPane = appState.getCurrentPane();
        const currentPage = this.pages[currentPane];
        const pageContent = currentPage ? currentPage.render() : '<div>Page not found</div>';
        
        root.innerHTML = `
            <div style="display:flex">
                ${Sidebar.render()}
                <div class="main-content">
                    ${Topbar.render()}
                    <div class="pane active">
                        ${pageContent}
                    </div>
                    <div id="modal-area"></div>
                </div>
            </div>
        `;
        
        if (currentPage && currentPage.onShow) currentPage.onShow();
    }
}

export const app = new App();