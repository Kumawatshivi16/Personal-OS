# Personal OS

Personal OS is your unified, browser-based dashboard combining a Gym Tracker and a CA Intermediate Study Tracker. It runs entirely on your local machine using standard web technologies (HTML, CSS, Vanilla JS) and saves everything privately to your browser's `localStorage`.

## Project Files Explained

1. `index.html` - The structure of your application. Contains the sidebar, modals, and CDN links for Chart.js and SheetJS.
2. `styles.css` - Controls the premium UI, layout, dark/light themes, and responsive design.
3. `storage.js` - The brain for saving/loading data. Manages browser memory and handles exporting/importing JSON backups and Excel/CSV spreadsheets.
4. `gym.js` - Manages gym workouts, dynamic workout forms, exercises, sets, reps, and history.
5. `study.js` - Manages your CA Inter subjects, chapter completion status, and logging study sessions (lectures, revision, self-study).
6. `charts.js` - Connects your stored data to visual graphs (Weekly Activity).
7. `app.js` - The main controller that handles navigation, updating the dashboard, and theme switching.
8. `README.md` - This guide!

## Setup Instructions for Beginners (Windows)

1. Create a new folder on your Desktop and name it `Personal-OS`.
2. Open **Notepad**.
3. Copy the code block for a file (e.g., `index.html`).
4. In Notepad, go to **File > Save As**.
5. **CRITICAL STEP:** Change the "Save as type" dropdown from "Text Documents (*.txt)" to **"All Files (*.*)"**.
6. Type the exact filename (e.g., `index.html`) and click Save.
7. Repeat this for all 7 files (`styles.css`, `app.js`, etc.) into the exact same folder.
8. Double-click `index.html` in your folder. It will open in Chrome/Edge/Firefox, and the app is ready to use!

## How Local Storage Works & Data Safety

- Your data is saved in your specific browser on your specific device. 
- **It does not sync across devices automatically.** If you use it on your phone, it will be a fresh, blank application.
- **DO NOT clear your browser cookies/data** without downloading a JSON Backup first from the "Settings & Data" tab, otherwise you will lose your records.

## Publishing to GitHub Pages

1. Go to [GitHub.com](https://github.com/) and create a free account.
2. Click **New Repository**. Name it `personal-os`. Make it **Public**.
3. Click "uploading an existing file" on the repository setup page.
4. Drag and drop all 7 of your files into the browser and click "Commit changes".
5. Once uploaded, go to the **Settings** tab of your repository.
6. On the left sidebar, click **Pages**.
7. Under "Source", select the **main** branch and click Save.
8. Wait a few minutes. GitHub will give you a live link (e.g., `https://yourusername.github.io/personal-os/`) that you can visit from anywhere!

## Importing Historical Study Data

1. Go to the **Settings & Data** tab.
2. Click **Import Excel/CSV**.
3. Select your `.xlsx` or `.csv` file. 
4. Ensure your columns have headers like "Subject" and "Chapter".
5. Review the preview generated on the screen, then confirm. (Existing chapters won't be overwritten).