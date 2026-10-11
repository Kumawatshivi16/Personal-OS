/**
 * storage.js
 * Handles data persistence, JSON export/import, and Spreadsheet (CSV/Excel) parsing.
 */

const STORAGE_KEY = 'personal_os_data';

// Default data structure if no data exists
const DEFAULT_DATA = {
    gym: {
        workouts: [],
        routines: [
            { id: 'r1', name: 'Standard Push', type: 'Push', exercises: ['Overhead Press', 'Lateral Raises', 'Incline Dumbbell Press', 'Tricep Extensions'] },
            { id: 'r2', name: 'Standard Pull', type: 'Pull', exercises: ['Pull-ups', 'Barbell Rows', 'Face Pulls', 'Bicep Curls'] },
            { id: 'r3', name: 'Standard Legs', type: 'Legs', exercises: ['Squats', 'Leg Press', 'Romanian Deadlifts', 'Calf Raises'] }
        ],
        weightLog: []
    },
    study: {
        subjects: {
            "Accounting": { chapters: [] },
            "Costing": { chapters: [] },
            "Tax-IT": { chapters: [] },
            "Tax-GST": { chapters: [] },
            "Law": { chapters: [] },
            "Audit": { chapters: [] },
            "FM": { chapters: [] },
            "SM": { chapters: [] }
        },
        sessions: []
    },
    settings: {
        theme: 'dark'
    }
};

// Global Storage Object
const StorageManager = {
    data: null,
    pendingImportData: null,

    init: function() {
        this.loadData();
        this.bindEvents();
    },

    loadData: function() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                this.data = JSON.parse(stored);
                // Ensure all base properties exist in case of older versions
                if (!this.data.gym) this.data.gym = DEFAULT_DATA.gym;
                if (!this.data.study) this.data.study = DEFAULT_DATA.study;
                if (!this.data.settings) this.data.settings = DEFAULT_DATA.settings;
            } catch (e) {
                console.error("Data corrupted, loading defaults.", e);
                this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
            }
        } else {
            this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
            this.saveData();
        }
    },

    saveData: function() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        // Dispatch custom event so app.js and charts.js know data changed
        window.dispatchEvent(new Event('dataSaved'));
    },

    exportJSON: function() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `PersonalOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    clearAllData: function() {
        if (confirm("WARNING: This will permanently erase ALL Gym and Study records from this browser. Are you sure?")) {
            localStorage.removeItem(STORAGE_KEY);
            alert("Data erased. The application will now reload.");
            location.reload();
        }
    },

    openImportModal: function() {
        document.getElementById('import-modal').classList.add('active');
        document.getElementById('import-file').value = '';
        document.getElementById('import-preview').innerHTML = '';
        document.getElementById('btn-confirm-import').disabled = true;
        this.pendingImportData = null;
    },

    handleFileUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const previewContainer = document.getElementById('import-preview');
        const confirmBtn = document.getElementById('btn-confirm-import');
        
        previewContainer.innerHTML = '<p>Reading file...</p>';
        confirmBtn.disabled = true;

        const reader = new FileReader();

        // Handle JSON Backup Import
        if (file.name.endsWith('.json')) {
            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if (parsed.gym && parsed.study) {
                        this.pendingImportData = { type: 'full_backup', data: parsed };
                        previewContainer.innerHTML = `<p style="color: green;">Valid Backup File detected. Contains ${parsed.gym.workouts.length} workouts and ${parsed.study.sessions.length} study sessions.</p><p><strong>Warning:</strong> Proceeding will overwrite your current data with this backup.</p>`;
                        confirmBtn.disabled = false;
                    } else {
                        throw new Error("Invalid OS backup structure.");
                    }
                } catch (err) {
                    previewContainer.innerHTML = `<p style="color: red;">Error parsing JSON: ${err.message}</p>`;
                }
            };
            reader.readAsText(file);
        } 
        // Handle Spreadsheet (CSV/XLSX) Import using SheetJS
        else if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonSheet = XLSX.utils.sheet_to_json(worksheet);

                    if (jsonSheet.length === 0) {
                        previewContainer.innerHTML = `<p style="color: red;">Spreadsheet is empty.</p>`;
                        return;
                    }

                    this.pendingImportData = { type: 'spreadsheet_study', data: jsonSheet };
                    
                    // Generate Preview Table
                    let tableHTML = `<p>Found ${jsonSheet.length} rows. Please ensure columns map to Subject, Chapter, and Status.</p><div style="overflow-x:auto;"><table style="width:100%; text-align:left; border-collapse: collapse; margin-top: 10px;">`;
                    const headers = Object.keys(jsonSheet[0]);
                    tableHTML += '<tr>' + headers.map(h => `<th style="border-bottom:1px solid var(--border-color); padding:4px;">${h}</th>`).join('') + '</tr>';
                    
                    for (let i = 0; i < Math.min(5, jsonSheet.length); i++) {
                        tableHTML += '<tr>' + headers.map(h => `<td style="border-bottom:1px solid var(--border-color); padding:4px;">${jsonSheet[i][h] || ''}</td>`).join('') + '</tr>';
                    }
                    tableHTML += `</table></div>`;
                    if (jsonSheet.length > 5) tableHTML += `<p class="text-sm mt-1">+ ${jsonSheet.length - 5} more rows.</p>`;

                    previewContainer.innerHTML = tableHTML;
                    confirmBtn.disabled = false;

                } catch (err) {
                    previewContainer.innerHTML = `<p style="color: red;">Error reading spreadsheet: ${err.message}</p>`;
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            previewContainer.innerHTML = `<p style="color: red;">Unsupported file format. Please use .json, .csv, or .xlsx</p>`;
        }
    },

    confirmImport: function() {
        if (!this.pendingImportData) return;

        if (this.pendingImportData.type === 'full_backup') {
            this.data = this.pendingImportData.data;
            this.saveData();
            alert("Backup restored successfully!");
            location.reload();
        } 
        else if (this.pendingImportData.type === 'spreadsheet_study') {
            const rows = this.pendingImportData.data;
            let importedCount = 0;
            
            // Basic heuristic mapping: looking for keys that contain 'subject' and 'chapter'
            rows.forEach(row => {
                let subjectKey = Object.keys(row).find(k => k.toLowerCase().includes('subject'));
                let chapterKey = Object.keys(row).find(k => k.toLowerCase().includes('chapter'));
                
                if (subjectKey && chapterKey) {
                    let subjectName = row[subjectKey];
                    let chapterName = row[chapterKey];
                    
                    // Match subject closely to our predefined CA Inter subjects
                    let matchedSubject = Object.keys(this.data.study.subjects).find(s => subjectName.toLowerCase().includes(s.toLowerCase().replace('tax-', '')));
                    
                    if (matchedSubject && chapterName) {
                        // Check for duplicates
                        let existingChapter = this.data.study.subjects[matchedSubject].chapters.find(c => c.name.toLowerCase() === chapterName.toLowerCase());
                        if (!existingChapter) {
                            this.data.study.subjects[matchedSubject].chapters.push({
                                name: chapterName,
                                status: 'Completed', // Defaulting to completed for historical imports if status column is missing
                                lecturesTotal: row['Lectures'] || 0,
                                lecturesCompleted: row['Lectures'] || 0,
                                revisionLevel: row['Revision'] || 0
                            });
                            importedCount++;
                        }
                    }
                }
            });

            this.saveData();
            alert(`Import complete! Added ${importedCount} new study chapters. Note: Existing chapters were skipped to prevent overwriting.`);
            document.getElementById('import-modal').classList.remove('active');
            window.dispatchEvent(new Event('studyDataUpdated'));
        }
    },

    bindEvents: function() {
        // Data Management Buttons (from Settings View)
        const btnExport = document.getElementById('btn-export-json');
        const btnImport = document.getElementById('btn-import-spreadsheet');
        const btnClear = document.getElementById('btn-clear-data');
        const fileInput = document.getElementById('import-file');
        const btnConfirm = document.getElementById('btn-confirm-import');

        if(btnExport) btnExport.addEventListener('click', () => this.exportJSON());
        if(btnImport) btnImport.addEventListener('click', () => this.openImportModal());
        if(btnClear) btnClear.addEventListener('click', () => this.clearAllData());
        if(fileInput) fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        if(btnConfirm) btnConfirm.addEventListener('click', () => this.confirmImport());
    }
};

// Initialize Storage on load
StorageManager.init();