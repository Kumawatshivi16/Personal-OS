/**
 * study.js
 * Handles CA Inter study tracking, chapter management, and session logging.
 */

const StudyManager = {
    init: function() {
        this.bindEvents();
        this.createDynamicModals();
        this.renderSubjects();
    },

    bindEvents: function() {
        document.getElementById('subject-filter').addEventListener('change', () => this.renderSubjects());
        document.getElementById('btn-log-study').addEventListener('click', () => this.openStudySessionModal());
        
        window.addEventListener('dataSaved', () => this.renderSubjects());
        window.addEventListener('studyDataUpdated', () => this.renderSubjects());
    },

    createDynamicModals: function() {
        // Add Chapter Modal
        const chapterModal = `
        <div id="chapter-modal" class="modal">
            <div class="modal-content">
                <h3>Add Chapter</h3>
                <input type="hidden" id="ch-subject-name">
                <div class="form-group">
                    <label>Chapter Name</label>
                    <input type="text" id="ch-name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label>Total Lectures</label>
                    <input type="number" id="ch-total-lec" class="form-input" required>
                </div>
                <div class="modal-actions mt-2">
                    <button class="btn-secondary" onclick="document.getElementById('chapter-modal').classList.remove('active')">Cancel</button>
                    <button class="btn-primary" id="btn-save-chapter">Save Chapter</button>
                </div>
            </div>
        </div>`;
        
        // Log Study Session Modal
        const sessionModal = `
        <div id="study-session-modal" class="modal">
            <div class="modal-content">
                <h3>Log Study Session</h3>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="session-date" class="form-input" required>
                </div>
                <div class="form-group">
                    <label>Duration (Hours)</label>
                    <input type="number" step="0.5" id="session-duration" class="form-input" required>
                </div>
                <div class="form-group">
                    <label>Activity Type</label>
                    <select id="session-type" class="form-input">
                        <option value="Lecture">Watching Lecture</option>
                        <option value="Self-Study">Self Study</option>
                        <option value="Revision 1">Revision 1</option>
                        <option value="Revision 2">Revision 2</option>
                        <option value="Question Practice">Question Practice</option>
                    </select>
                </div>
                <div class="modal-actions mt-2">
                    <button class="btn-secondary" onclick="document.getElementById('study-session-modal').classList.remove('active')">Cancel</button>
                    <button class="btn-primary" id="btn-save-session">Save Session</button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', chapterModal + sessionModal);
        document.getElementById('btn-save-chapter').addEventListener('click', () => this.saveChapter());
        document.getElementById('btn-save-session').addEventListener('click', () => this.saveSession());
    },

    renderSubjects: function() {
        const container = document.getElementById('study-subjects-container');
        const filter = document.getElementById('subject-filter').value;
        const subjects = StorageManager.data.study.subjects;
        
        container.innerHTML = '';

        for (const [subjName, data] of Object.entries(subjects)) {
            if (filter !== 'all' && subjName !== filter) continue;

            const totalChaps = data.chapters.length;
            const completedChaps = data.chapters.filter(c => c.status === 'Completed').length;
            const progress = totalChaps === 0 ? 0 : Math.round((completedChaps / totalChaps) * 100);

            let chaptersHTML = data.chapters.map((ch, idx) => `
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding: 5px 0;">
                    <span>${ch.name}</span>
                    <select onchange="StudyManager.updateChapterStatus('${subjName}', ${idx}, this.value)" style="background:var(--bg-main); color:var(--text-main); border:1px solid var(--border-color); border-radius:4px;">
                        <option value="Not Started" ${ch.status === 'Not Started' || !ch.status ? 'selected' : ''}>Not Started</option>
                        <option value="In Progress" ${ch.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${ch.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Revision Due" ${ch.status === 'Revision Due' ? 'selected' : ''}>Revision Due</option>
                    </select>
                </div>
            `).join('');

            if (totalChaps === 0) chaptersHTML = '<p class="text-sm text-muted">No chapters added yet.</p>';

            const card = document.createElement('div');
            card.className = 'card';
            card.style.borderTop = '4px solid var(--study-accent)';
            card.innerHTML = `
                <h3>${subjName}</h3>
                <p class="text-sm" style="margin-bottom: 10px;">Progress: ${progress}% (${completedChaps}/${totalChaps} Chaps)</p>
                <div style="max-height: 150px; overflow-y: auto; margin-bottom: 10px;">
                    ${chaptersHTML}
                </div>
                <button class="btn-secondary mt-1" style="width:100%" onclick="StudyManager.openAddChapter('${subjName}')">+ Add Chapter</button>
            `;
            container.appendChild(card);
        }
    },

    openAddChapter: function(subject) {
        document.getElementById('chapter-modal').classList.add('active');
        document.getElementById('ch-subject-name').value = subject;
        document.getElementById('ch-name').value = '';
        document.getElementById('ch-total-lec').value = '';
    },

    saveChapter: function() {
        const subject = document.getElementById('ch-subject-name').value;
        const name = document.getElementById('ch-name').value;
        const totalLec = document.getElementById('ch-total-lec').value;

        if (!name || !totalLec) return alert("Please fill all fields.");

        StorageManager.data.study.subjects[subject].chapters.push({
            name: name,
            status: 'Not Started',
            lecturesTotal: parseInt(totalLec),
            lecturesCompleted: 0,
            revisionLevel: 0
        });

        StorageManager.saveData();
        document.getElementById('chapter-modal').classList.remove('active');
    },

    updateChapterStatus: function(subject, index, newStatus) {
        StorageManager.data.study.subjects[subject].chapters[index].status = newStatus;
        StorageManager.saveData(); // Triggers render automatically
    },

    openStudySessionModal: function() {
        document.getElementById('study-session-modal').classList.add('active');
        document.getElementById('session-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('session-duration').value = '';
    },

    saveSession: function() {
        const date = document.getElementById('session-date').value;
        const duration = parseFloat(document.getElementById('session-duration').value);
        const type = document.getElementById('session-type').value;

        if (!date || isNaN(duration)) return alert("Enter valid date and duration.");

        StorageManager.data.study.sessions.push({
            id: 'ses_' + Date.now(),
            date: date,
            durationHours: duration,
            type: type
        });

        StorageManager.saveData();
        document.getElementById('study-session-modal').classList.remove('active');
        alert("Study session logged!");
    }
};