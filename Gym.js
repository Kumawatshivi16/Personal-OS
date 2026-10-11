/**
 * gym.js
 * Handles Gym Tracker logic, workout logging, and routine management.
 */

const GymManager = {
    init: function() {
        this.bindEvents();
        this.renderHistory();
        this.createDynamicModals();
    },

    bindEvents: function() {
        document.getElementById('btn-new-workout').addEventListener('click', () => this.openWorkoutForm());
        document.getElementById('btn-routine-editor').addEventListener('click', () => alert("Routine Editor coming soon! For now, start a blank workout."));
        
        // Listen for data updates to refresh UI
        window.addEventListener('dataSaved', () => this.renderHistory());
    },

    createDynamicModals: function() {
        // Dynamically inject the Workout Form Modal into the DOM
        const modalHTML = `
        <div id="workout-modal" class="modal">
            <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <h3 id="workout-modal-title">Log Workout</h3>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="workout-date" class="form-input" required>
                </div>
                <div class="form-group">
                    <label>Duration (minutes)</label>
                    <input type="number" id="workout-duration" class="form-input" placeholder="e.g. 60" required>
                </div>
                <div id="exercise-list"></div>
                <button class="btn-secondary mt-1" id="btn-add-exercise">+ Add Exercise</button>
                <div class="form-group mt-1">
                    <label>Notes</label>
                    <input type="text" id="workout-notes" class="form-input" placeholder="How did it feel?">
                </div>
                <div class="modal-actions mt-2">
                    <button class="btn-secondary" onclick="document.getElementById('workout-modal').classList.remove('active')">Cancel</button>
                    <button class="btn-primary" id="btn-save-workout">Save Workout</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('btn-add-exercise').addEventListener('click', () => this.addExerciseBlock());
        document.getElementById('btn-save-workout').addEventListener('click', () => this.saveWorkout());
    },

    openWorkoutForm: function(existingWorkout = null) {
        document.getElementById('workout-modal').classList.add('active');
        document.getElementById('exercise-list').innerHTML = ''; // Clear previous
        
        if (existingWorkout) {
            // Duplicate logic
            document.getElementById('workout-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('workout-duration').value = existingWorkout.duration || '';
            document.getElementById('workout-notes').value = '';
            existingWorkout.exercises.forEach(ex => this.addExerciseBlock(ex.name, ex.sets));
        } else {
            document.getElementById('workout-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('workout-duration').value = '';
            document.getElementById('workout-notes').value = '';
            this.addExerciseBlock(); // Add one blank exercise by default
        }
    },

    addExerciseBlock: function(name = '', sets = [{reps: '', weight: ''}]) {
        const list = document.getElementById('exercise-list');
        const index = list.children.length;
        
        let setsHTML = '';
        sets.forEach((set, sIdx) => {
            setsHTML += `
                <div class="set-row" style="display:flex; gap:10px; margin-top:5px;" data-set-index="${sIdx}">
                    <input type="number" class="form-input rep-input" placeholder="Reps" value="${set.reps}" required>
                    <input type="number" class="form-input weight-input" placeholder="Weight (kg)" value="${set.weight}" required>
                </div>`;
        });

        const exBlock = document.createElement('div');
        exBlock.className = 'card mt-1 exercise-block';
        exBlock.style.padding = '1rem';
        exBlock.innerHTML = `
            <div class="form-group">
                <label>Exercise Name</label>
                <input type="text" class="form-input ex-name" placeholder="e.g. Bench Press" value="${name}" required>
            </div>
            <label>Sets (Reps & Weight)</label>
            <div class="sets-container">${setsHTML}</div>
            <button class="btn-secondary mt-1 btn-add-set" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">+ Add Set</button>
            <button class="btn-danger mt-1 btn-remove-ex" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; float: right;">Remove Exercise</button>
        `;

        // Bind events for dynamically created buttons
        exBlock.querySelector('.btn-add-set').addEventListener('click', (e) => {
            const container = e.target.previousElementSibling;
            container.insertAdjacentHTML('beforeend', `
                <div class="set-row" style="display:flex; gap:10px; margin-top:5px;">
                    <input type="number" class="form-input rep-input" placeholder="Reps" required>
                    <input type="number" class="form-input weight-input" placeholder="Weight (kg)" required>
                </div>`);
        });

        exBlock.querySelector('.btn-remove-ex').addEventListener('click', () => exBlock.remove());
        list.appendChild(exBlock);
    },

    saveWorkout: function() {
        const date = document.getElementById('workout-date').value;
        const duration = document.getElementById('workout-duration').value;
        const notes = document.getElementById('workout-notes').value;
        const exerciseBlocks = document.querySelectorAll('.exercise-block');

        if (!date || !duration) {
            alert("Please fill in Date and Duration.");
            return;
        }

        let exercises = [];
        let valid = true;

        exerciseBlocks.forEach(block => {
            const name = block.querySelector('.ex-name').value;
            const setRows = block.querySelectorAll('.set-row');
            if (!name) valid = false;

            let sets = [];
            setRows.forEach(row => {
                const reps = row.querySelector('.rep-input').value;
                const weight = row.querySelector('.weight-input').value;
                if (!reps || !weight) valid = false;
                sets.push({ reps: parseInt(reps), weight: parseFloat(weight) });
            });
            exercises.push({ name, sets });
        });

        if (!valid || exercises.length === 0) {
            alert("Please ensure all exercises have names, reps, and weights.");
            return;
        }

        const newWorkout = {
            id: 'wk_' + Date.now(),
            date: date,
            duration: parseInt(duration),
            notes: notes,
            exercises: exercises
        };

        StorageManager.data.gym.workouts.push(newWorkout);
        StorageManager.saveData();
        
        document.getElementById('workout-modal').classList.remove('active');
        alert("Workout Saved Successfully!");
    },

    renderHistory: function() {
        const container = document.getElementById('workout-history');
        const workouts = StorageManager.data.gym.workouts;

        if (!workouts || workouts.length === 0) {
            container.innerHTML = '<p>No workouts recorded yet. Start sweating!</p>';
            container.classList.add('empty-state');
            return;
        }

        container.classList.remove('empty-state');
        // Sort by date descending
        const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = sorted.map(w => `
            <div class="card mt-1" style="border-left: 4px solid var(--gym-accent);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4>${w.date} - ${w.duration} mins</h4>
                    <button class="btn-secondary" onclick="GymManager.duplicateWorkout('${w.id}')">Duplicate</button>
                </div>
                <p class="text-sm">${w.notes || ''}</p>
                <ul style="margin-top: 10px; margin-left: 20px;">
                    ${w.exercises.map(ex => `<li><strong>${ex.name}</strong>:${ex.sets.length} sets</li>`).join('')}
                </ul>
                <button class="btn-danger mt-1" style="font-size: 0.8rem;" onclick="GymManager.deleteWorkout('${w.id}')">Delete</button>
            </div>
        `).join('');
    },

    deleteWorkout: function(id) {
        if (confirm("Delete this workout?")) {
            StorageManager.data.gym.workouts = StorageManager.data.gym.workouts.filter(w => w.id !== id);
            StorageManager.saveData();
        }
    },

    duplicateWorkout: function(id) {
        const workout = StorageManager.data.gym.workouts.find(w => w.id === id);
        if (workout) this.openWorkoutForm(workout);
    }
};