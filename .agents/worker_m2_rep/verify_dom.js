const fs = require('fs');

const html = fs.readFileSync('templates/index.html', 'utf8');

// Extract element IDs from html
const ids = new Set();
const matches = html.matchAll(/id=["']([^"']+)["']/g);
for (const m of matches) {
    ids.add(m[1]);
}
console.log('Found IDs in HTML:', Array.from(ids));

// Build DOM mock
const elements = {};
ids.forEach(id => {
    elements[id] = {
        id: id,
        value: '',
        innerHTML: '',
        innerText: '',
        style: {},
        classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); }
        },
        querySelectorAll(sel) { return []; },
        querySelector(sel) { return null; },
        addEventListener(event, fn) {}
    };
});

global.window = global;
global.window.addEventListener = (evt, fn) => {};
global.window.location = { href: '', reload: () => {} };
global.lucide = { createIcons: () => {} };

global.fetch = async () => ({ json: async () => ({ conversations: [] }) });
global.document = {
    addEventListener(event, fn) {},
    getElementById(id) {
        if (!elements[id]) {
            elements[id] = {
                id: id,
                value: '',
                innerHTML: '',
                innerText: '',
                style: {},
                classList: {
                    classes: new Set(),
                    add(c) { this.classes.add(c); },
                    remove(c) { this.classes.delete(c); },
                    contains(c) { return this.classes.has(c); }
                },
                querySelectorAll(sel) { return []; },
                querySelector(sel) { return null; },
                addEventListener(event, fn) {}
            };
        }
        return elements[id];
    },
    querySelectorAll(sel) {
        if (sel.startsWith('.')) {
            const cls = sel.slice(1);
            return Object.values(elements).filter(e => e.classList.contains(cls));
        }
        return [];
    },
    querySelector(sel) {
        if (sel.startsWith('#')) {
            return this.getElementById(sel.slice(1));
        }
        return null;
    }
};

const appJs = fs.readFileSync('static/js/app.js', 'utf8');
const inboxJs = fs.readFileSync('static/js/inbox.js', 'utf8');
const viewsJs = fs.readFileSync('static/js/views.js', 'utf8');
const clientsJs = fs.readFileSync('static/js/clients.js', 'utf8');

eval(appJs);
eval(inboxJs);
eval(viewsJs);
eval(clientsJs);

console.log('\n--- VERIFICATION 1: renderInboxList() ---');
try {
    renderInboxList();
    console.log('SUCCESS: renderInboxList() executed without error.');
    console.log('HTML in inbox-list:', elements['inbox-list'] ? elements['inbox-list'].innerHTML.slice(0, 100) : 'N/A');
} catch(e) {
    console.error('FAIL: renderInboxList() threw error:', e);
}

console.log('\n--- VERIFICATION 2: Sidebar View Switching ---');
const requiredViews = [
    'v-accounts', 'v-inbox', 'v-scheduler', 'v-kb',
    'v-crm', 'v-analytics', 'v-automation', 'v-settings',
    'v-logs', 'v-help'
];

console.log('Checking view elements in HTML structure:');
requiredViews.forEach(v => {
    const existsInHtml = html.includes(`id="${v}"`);
    console.log(`View ${v}: ${existsInHtml ? 'EXISTS' : 'MISSING'}`);
});

const switchFn = typeof switchView === 'function' ? switchView : (typeof showView === 'function' ? showView : null);
console.log('\nChecking view functions: switchView:', typeof switchView, 'showView:', typeof showView);

if (switchFn) {
    console.log('\nTesting view switching function:');
    requiredViews.forEach(v => {
        try {
            switchFn(v);
            console.log(`switchView('${v}'): SUCCESS`);
        } catch(e) {
            console.error(`switchView('${v}'): ERROR - ${e.message}`);
        }
    });
} else {
    console.log('\nInspecting available functions in global scope...');
    Object.keys(global).filter(k => k.includes('View') || k.includes('nav') || k.includes('switch')).forEach(k => console.log('Global window key:', k));
}
