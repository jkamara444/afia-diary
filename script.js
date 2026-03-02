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
            // your entries are hardcoded here for public viewing
            return [
                {
                    id: "entry1",
                    title: "Who are our Ancestors?",
                    content: "\n\nI keep thinking about what it means to call someone an ancestor. I used to think it was strictly blood, strictly DNA, strictly who came from who. But that feels too narrow now... Ancestors can be yours even if you are not directly related at all. If you are tied through struggle, through care, through a shared history of loss or love, that feels just as real and maybe even more real.\n\nI think about Marcus Garvey like this. He never set foot on the African continent, yet he is venerated as an ancestor. There is something powerful about that. His body was not buried here. His feet did not press into this soil. But his ideas did. His dream of return, of Black sovereignty, of dignity, traveled further than he ever physically could.\n\nStill, I cannot ignore how the manifestation of DNA feels significant. When thinking about kin, and the parts of DNA that the museum has, these are nails and hair. The physical remnants of his son. The way a curl pattern repeats across generations. The way hands may look alike. DNA can make a person feel whole, and in the museum, it brings us closer to the physical form of Marcus Garvey. But it is not the only thing that creates a connection.\n\nThere is a system to all of this. Even in strengthening and forming relationships with ancestors, there are rituals. Pouring libation. Bringing them their favorite alcohol if you knew them. If you did not, then bring them a drink from their time period. It is thoughtful, and it is intentional. It says I see you, even if I never met you.",
                    mood: "connected",
                    date: "2026-03-01T09:30:00.000Z",
                    wordCount: 15,
                    charCount: 120
                },
                {
                    id: "entry2",
                    title: "Systems of Care",
                    content: "Dear Diary,\n\nI have been thinking a lot about how systems are created, as none of this just appears out of nowhere. These systems around ancestors, libation, and ritual, they were made with purpose. They were created to connect people to those who came before them, and to make memory something almost more tangible.\n\nIn that same way, I had a stool. In Asante culture, a stool represents something similar to what the West understands as a crown. It denotes authority and marks kingship. I have always been interested in the royal hierarchies around chieftaincy, in the way power is symbolized and preserved, so the story of the Asante Golden Stool stays with me. The idea that a nation’s soul can reside in an object and that something carved from wood can carry lineage, spirit, and legitimacy is so beautiful. I thought it was very coincidental that, of all the tools, I was handed the stool.\n\nWhen I used the stool in my own system, I would place it down and move in a counterclockwise circle, pulling out weeds from the ground. I chose counterclockwise intentionally. It is cultural here in Ghana to move that way. My feet pressed into the dirt, and the ants crawling on my feet felt almost like a service to nature. It was simple, just me and the stool and the ground, but it felt structured. Like I was participating in something larger than myself, and when we finished, and I looked around, I was proud of myself and all my sub chiefs lol. Systems are not random..they are built. And when you step into them, you feel the weight of all the people who stepped there before you.",
                    mood: "thoughtful",
                    date: "2026-03-01T16:45:00.000Z",
                    wordCount: 15,
                    charCount: 125
                },
                {
                    id: "entry3",
                    title: "Unfilfilled Dreams - a conversation with Carmen",
                    content: "I had a conversation with my Bronnie Henna, Carmen, aka my sub chief of tickling. We were talking about how Marcus Garvey never came to Africa, but is such a celebrated hero, even more so than he is in the United States. We discussed unfulfilled dreams, and more specifically, his unfulfilled dream of returning to Africa.\n\nHow he imagined and inspired others to have a physical homecoming that he never experienced in his lifetime. It reminded Carmen and me of the Paa Joe coffins, those sculptural coffins shaped like objects that represent the life someone lived or the dream they carried. They make space for desires that were never fully realized. In a way, Garvey’s dream feels like it is still moving. Like it did not die with him. Like every return, every reconnection is a piece of that dream coming into fruition.\n\nI think the fact too that the man who trained Paa Joe is the one that created the casket next to the Marcus Garvey sculpture that holds his DNA emphasizes this connection even more!",
                    mood: "connected",
                    date: "2026-03-02T07:15:00.000Z",
                    wordCount: 15,
                    charCount: 118
                },
                {
                    id: "entry4",
                    title: "Culture and Art as a Language",
                    content: "I have been thinking about culture within art and how you can see differences just by looking closely. Yoruba and Akan art, for example, carry different beauty standards in their forms. You can tell by the eyes. In some Akan representations, even if someone had small eyes in real life, they might be portrayed with large eyes if they were considered beautiful. Big eyes symbolize beauty. Other design choices can symbolize that a person was alert, wise, and present. The art does not always aim to replicate exactly what was seen, but instead it aims to represent what was valued in the person.\n\n\ I find that fascinating. The way culture shapes perception so deeply that it even reshapes the body in art. A sculpted face with wide, rounded eyes feels different from one with narrower, more elongated features. The proportions communicate ideals. They communicate who was admired, who was seen as beautiful, and who was intelligent. \n\nArt becomes another system, another way of connecting to ancestors. Not just through blood, but through shared aesthetics, shared values, and shared ways of seeing beauty. And in that, I feel connected too in that I can look at a sculpture and see what traits the people they loved, loved about them <3",
                    mood: "thoughtful",
                    date: "2026-03-02T19:30:00.000Z",
                    wordCount: 15,
                    charCount: 115
                }
            ];
        } catch (error) {
            console.error('error loading entries:', error);
            return [];
        }
    }

    saveEntries() {
        try {
            localStorage.setItem('ghanaDiaryEntries', JSON.stringify(this.entries));
        } catch (error) {
            console.error('error saving entries:', error);
            this.showNotification('error saving entries', 'error');
        }
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
