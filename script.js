class GhanaDiary {
    constructor() {
        this.entries = [];
        this.currentEntry = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCurrentDate();
        this.loadPreviousEntries();
        this.startAutoSave();
    }

    setupEventListeners() {
        // button
        document.getElementById('newEntryBtn').addEventListener('click', () => this.newEntry());
        document.getElementById('saveEntryBtn').addEventListener('click', () => this.saveEntry());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCurrentEntry());

        // text
        const textarea = document.getElementById('diaryTextarea');
        textarea.addEventListener('input', () => this.updateWordCount());
        textarea.addEventListener('input', () => this.autoSave());

        // title
        document.getElementById('entryTitle').addEventListener('input', () => this.autoSave());

        // moods
        document.getElementById('moodSelect').addEventListener('change', () => this.autoSave());
    }

    updateCurrentDate() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const dateString = now.toLocaleDateString('en-US', options);
        document.getElementById('currentDate').textContent = dateString;
        document.getElementById('entryDate').textContent = dateString;
    }

    newEntry() {
        this.clearCurrentEntry();
        this.updateCurrentDate();
        document.getElementById('entryTitle').focus();

        // animating
        const diaryPage = document.querySelector('.diary-page');
        diaryPage.style.animation = 'none';
        setTimeout(() => {
            diaryPage.style.animation = 'fadeIn 0.5s ease-in';
        }, 10);
    }

    clearCurrentEntry() {
        document.getElementById('entryTitle').value = '';
        document.getElementById('diaryTextarea').value = '';
        document.getElementById('moodSelect').value = '';
        this.updateWordCount();
        this.currentEntry = null;
    }

    saveEntry() {
        const title = document.getElementById('entryTitle').value.trim();
        const content = document.getElementById('diaryTextarea').value.trim();
        const mood = document.getElementById('moodSelect').value;
        const date = new Date().toISOString();

        if (!content) {
            this.showNotification('Please write something before saving!', 'warning');
            return;
        }

        const entry = {
            id: this.currentEntry?.id || this.generateId(),
            title: title || 'Untitled Entry',
            content,
            mood,
            date,
            wordCount: this.countWords(content),
            charCount: content.length
        };

        if (this.currentEntry) {
            // update functionality
            const index = this.entries.findIndex(e => e.id === this.currentEntry.id);
            if (index !== -1) {
                this.entries[index] = entry;
            }
        } else {
            // new entry
            this.entries.unshift(entry);
        }

        this.saveEntries();
        this.loadPreviousEntries();
        this.currentEntry = entry;
        this.showNotification('Entry saved successfully!', 'success');
    }

    autoSave() {
        // auto save 
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            const content = document.getElementById('diaryTextarea').value.trim();
            if (content && content.length > 50) {
                this.saveEntry();
            }
        }, 2000);
    }

    startAutoSave() {
        // timed auto save just in case
        setInterval(() => {
            const content = document.getElementById('diaryTextarea').value.trim();
            if (content && content.length > 50) {
                this.saveEntry();
            }
        }, 30000);
    }

    loadEntry(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (entry) {
            this.currentEntry = entry;
            document.getElementById('entryTitle').value = entry.title;
            document.getElementById('diaryTextarea').value = entry.content;
            document.getElementById('moodSelect').value = entry.mood || '';

            const entryDate = new Date(entry.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('entryDate').textContent = entryDate;

            this.updateWordCount();

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    deleteEntry(entryId) {
        if (confirm('Are you sure you want to delete this entry?')) {
            this.entries = this.entries.filter(e => e.id !== entryId);
            this.saveEntries();
            this.loadPreviousEntries();

            if (this.currentEntry?.id === entryId) {
                this.clearCurrentEntry();
            }

            this.showNotification('Entry deleted', 'info');
        }
    }

    async loadPreviousEntries() {
        this.entries = await this.loadEntries();
        const entriesList = document.getElementById('entriesList');

        if (this.entries.length === 0) {
            entriesList.innerHTML = '<p style="text-align: center; opacity: 0.6;">No entries yet :p </p>';
            return;
        }

        entriesList.innerHTML = this.entries.slice(0, 9).map(entry => {
            const entryDate = new Date(entry.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            const preview = entry.content.substring(0, 150) + (entry.content.length > 150 ? '...' : '');
            const moodEmoji = this.getMoodEmoji(entry.mood);

            return `
                <div class="entry-card" onclick="diary.loadEntry('${entry.id}')">
                    <div class="entry-card-title">${this.escapeHtml(entry.title)}</div>
                    <div class="entry-card-date">${entryDate}</div>
                    <div class="entry-card-preview">${this.escapeHtml(preview)}</div>
                    <div class="entry-card-mood">${moodEmoji}</div>
                    <button onclick="event.stopPropagation(); diary.deleteEntry('${entry.id}')" 
                            style="margin-top: 10px; padding: 5px 10px; background: var(--ghana-red); color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                        Delete
                    </button>
                </div>
            `;
        }).join('');
    }

    updateWordCount() {
        const content = document.getElementById('diaryTextarea').value;
        const wordCount = this.countWords(content);
        const charCount = content.length;

        document.getElementById('wordCount').textContent = wordCount;
        document.getElementById('charCount').textContent = charCount;
    }

    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-family: var(--sans);
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;

        const colors = {
            success: 'var(--ghana-green)',
            warning: 'var(--ghana-yellow)',
            info: 'var(--ghana-red)',
            error: '#d32f2f'
        };
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        // add to page
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    loadEntries() {
        try {
            // Try to load from public JSON file first
            return fetch('entries.json')
                .then(response => response.json())
                .then(data => data.entries || [])
                .catch(() => {
                    // Fallback to localStorage
                    const stored = localStorage.getItem('ghanaDiaryEntries');
                    return stored ? JSON.parse(stored) : [];
                });
        } catch (error) {
            console.error('Error loading entries:', error);
            return [];
        }
    }

    saveEntries() {
        try {
            // Save to localStorage for immediate use
            localStorage.setItem('ghanaDiaryEntries', JSON.stringify(this.entries));

            // Also update the public entries.json file
            this.updatePublicEntries();
        } catch (error) {
            console.error('Error saving entries:', error);
            this.showNotification('Error saving entries', 'error');
        }
    }

    updatePublicEntries() {
        const exportData = {
            exportDate: new Date().toISOString(),
            entries: this.entries
        };

        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'entries.json';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Entries saved! Upload entries.json to Netlify to make public', 'info');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getMoodEmoji(mood) {
        const moodEmojis = {
            'connected': ' 🫶🏿 Feeling Connected 🫶🏿',
            'thoughtful': '💆🏿‍♀️ Thinking Deeply 💆🏿‍♀️',
            'calm': '🧘🏿‍♀️ Feeling Calm 🧘🏿‍♀️',
            'sorrowful': '🤲🏿 Feeling Sorrow 🤲🏿'
        };
        return moodEmojis[mood] || '';
    }
}

// animations
var style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function () {
    window.diary = new GhanaDiary();
});

// keyboard shortcuts
document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        window.diary.saveEntry();
    }

    // Ctrl/Cmd + N for new entry
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        window.diary.newEntry();
    }
});

// export functionality
document.addEventListener('DOMContentLoaded', function () {
    // export button 
    var exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-secondary';
    exportBtn.innerHTML = 'Export';
    exportBtn.onclick = function () { window.diary.exportEntries(); };

    var controls = document.querySelector('.entry-controls');
    controls.appendChild(exportBtn);
});

// export method to GhanaDiary class
GhanaDiary.prototype.exportEntries = function () {
    if (this.entries.length === 0) {
        this.showNotification('No entries to export', 'warning');
        return;
    }

    var exportData = {
        exportDate: new Date().toISOString(),
        entries: this.entries
    };

    var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ghana-diary-export-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showNotification('Entries exported successfully!', 'success');
};
