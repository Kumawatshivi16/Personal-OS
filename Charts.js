/**
 * charts.js
 * Handles data visualization using Chart.js based on StorageManager data.
 */

const DashboardCharts = {
    chartInstance: null,

    init: function() {
        this.renderWeeklyActivity();
        window.addEventListener('dataSaved', () => this.renderWeeklyActivity());
    },

    renderWeeklyActivity: function() {
        const ctx = document.getElementById('weeklyActivityChart');
        if (!ctx) return;

        // Destroy previous chart to prevent duplication bugs
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // Aggregate data for the last 7 days
        const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const studyData = last7Days.map(date => {
            const sessions = StorageManager.data.study.sessions.filter(s => s.date === date);
            return sessions.reduce((sum, s) => sum + s.durationHours, 0);
        });

        const gymData = last7Days.map(date => {
            // Returns 1 if workout existed, 0 otherwise (representing frequency)
            return StorageManager.data.gym.workouts.some(w => w.date === date) ? 1 : 0;
        });

        const theme = StorageManager.data.settings.theme;
        const textColor = theme === 'dark' ? '#f5f5f5' : '#111827';
        const gridColor = theme === 'dark' ? '#333333' : '#e5e7eb';

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: last7Days.map(d => d.slice(5)), // MM-DD format
                datasets: [
                    {
                        label: 'Study Hours',
                        data: studyData,
                        backgroundColor: '#10b981', // Study accent
                        borderRadius: 4
                    },
                    {
                        label: 'Gym Session (1=Yes)',
                        data: gymData,
                        backgroundColor: '#ef4444', // Gym accent
                        borderRadius: 4,
                        type: 'line',
                        borderColor: '#ef4444',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                },
                plugins: {
                    legend: { labels: { color: textColor } }
                }
            }
        });
    }
};