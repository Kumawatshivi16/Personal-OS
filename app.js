/**
 * app.js
 * Main controller, handles initialization, navigation, and dashboard updates.
 */

const app = {
    init: function() {
        // Set date
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = new Date().toLocaleDateString(undefined, options);

        this.bindNavigation();
        this.applyTheme(StorageManager.data.settings.theme);
        this.updateDashboard();

        // Initialize sub-modules
        GymManager.init();
        StudyManager.init();
        
        // Wait briefly for DOM rendering before initing charts
        setTimeout(() => DashboardCharts.init(), 100);

        // Listen for global data changes
        window.addEventListener('dataSaved', () => this.updateDashboard());
        
        // Setup Theme Toggle
        const themeSelect = document.getElementById('theme-select');
        themeSelect.value = StorageManager.data.settings.theme;
        themeSelect.addEventListener('change', (e) => {
            StorageManager.data.settings.theme = e.target.value;
            StorageManager.saveData();
            this.applyTheme(e.target.value);
            DashboardCharts.renderWeeklyActivity(); // Redraw chart for new theme colors
        });
    },

    bindNavigation: function() {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.navigateTo(e.target.dataset.target);
            });
        });
    },

    navigateTo: function(viewId) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.target === viewId) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            if (view.id === viewId) view.classList.add('active');
            else view.classList.remove('active');
        });
    },

    applyTheme: function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    },

    updateDashboard: function() {
        const today = new Date().toISOString().split('T')[0];
        
        // Gym Status
        const gymStatusEl = document.getElementById('dash-gym-status');
        const todayWorkout = StorageManager.data.gym.workouts.find(w => w.date === today);
        if (todayWorkout) {
            gymStatusEl.textContent = `Completed: ${todayWorkout.duration} mins (${todayWorkout.exercises.length} exercises)`;
            gymStatusEl.style.color = 'var(--study-accent)'; // Green color for success
        } else {
            gymStatusEl.textContent = "No workout logged today. Go get those gains!";
            gymStatusEl.style.color = 'var(--text-main)';
        }

        // Study Status
        const studyStatusEl = document.getElementById('dash-study-status');
        const todaySessions = StorageManager.data.study.sessions.filter(s => s.date === today);
        const totalHours = todaySessions.reduce((acc, curr) => acc + curr.durationHours, 0);
        
        if (totalHours > 0) {
            studyStatusEl.textContent = `${totalHours} hours studied today across ${todaySessions.length} sessions.`;
            studyStatusEl.style.color = 'var(--study-accent)';
        } else {
            studyStatusEl.textContent = "0 hours studied today. Time to hit the books!";
            studyStatusEl.style.color = 'var(--text-main)';
        }
    }
};

// Start application after all scripts are loaded
window.addEventListener('DOMContentLoaded', () => {
    // Ensuring StorageManager loaded data first
    if (typeof StorageManager !== 'undefined' && StorageManager.data) {
        app.init();
    } else {
        console.error("StorageManager failed to load.");
    }
});