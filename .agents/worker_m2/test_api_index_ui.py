import sys
import os
sys.path.insert(0, r'C:\Users\mhmd\meta_ai_moderator')
sys.path.insert(0, r'C:\Users\mhmd\meta_ai_moderator\api')
import threading
import time
import asyncio
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

# Start api.index app in thread
import index as api_app_mod

def start_server():
    api_app_mod.app.run(host='127.0.0.1', port=5056, debug=False, use_reloader=False)

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(1.5)

async def main():
    print("=== STARTING PLAYWRIGHT VERCEL API INDEX UI VERIFICATION ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        page_errors = []
        console_errors = []
        page.on('pageerror', lambda e: page_errors.append(f"{e.name}: {e.message}\nStack: {e.stack}"))
        page.on('console', lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ['error'] else None)
        
        url = 'http://127.0.0.1:5056/'
        response = await page.goto(url, wait_until='domcontentloaded')
        await page.wait_for_timeout(1000)
        status = response.status
        content = await page.content()
        size_bytes = len(content.encode('utf-8'))
        
        print(f"1. URL: {url}")
        print(f"   HTTP Status: {status}")
        print(f"   HTML Size (bytes): {size_bytes} (KB: {size_bytes/1024:.2f} KB)")
        
        # 2. Check #inbox-search input element
        inbox_search = await page.query_selector('#inbox-search')
        inbox_search_exists = inbox_search is not None
        placeholder = await inbox_search.get_attribute('placeholder') if inbox_search else None
        print(f"2. #inbox-search element exists: {inbox_search_exists}")
        print(f"   Placeholder: '{placeholder}'")
        
        # 3. Test renderInboxList() JS function execution
        render_inbox_result = await page.evaluate("""() => {
            try {
                if (typeof renderInboxList !== 'function') {
                    return { success: false, error: 'renderInboxList is not defined' };
                }
                renderInboxList();
                return { success: true, error: null };
            } catch (err) {
                return { success: false, error: err.toString(), stack: err.stack };
            }
        }""")
        print(f"3. renderInboxList() execution result: {render_inbox_result}")
        
        # 4. Check #v-inbox.view.show grid style
        v_inbox_style = await page.evaluate("""() => {
            const el = document.getElementById('v-inbox');
            if (!el) return { exists: false };
            const comp = window.getComputedStyle(el);
            return {
                exists: true,
                classes: el.className,
                display: comp.display,
                gridTemplateColumns: comp.gridTemplateColumns,
                childrenCount: el.children.length
            };
        }""")
        print(f"4. #v-inbox view style: {v_inbox_style}")
        
        # 5. Check Top Bar button and green badge
        topbar_info = await page.evaluate("""() => {
            const header = document.querySelector('header');
            const button = header ? header.querySelector('button.btn-primary') : null;
            const badge = document.getElementById('bot-status-badge');
            return {
                headerExists: header !== null,
                buttonText: button ? button.textContent.trim() : null,
                badgeText: badge ? badge.textContent.trim() : null,
                badgeClasses: badge ? badge.className : null
            };
        }""")
        print(f"5. Top Bar inspection:")
        print(f"   Header Exists: {topbar_info['headerExists']}")
        print(f"   Primary Button Text: '{topbar_info['buttonText']}'")
        print(f"   Green Badge Text: '{topbar_info['badgeText']}'")
        print(f"   Green Badge Classes: '{topbar_info['badgeClasses']}'")
        
        # 6. Test all 10 sidebar view switching
        views = ['inbox', 'dash', 'rules', 'kb', 'crm', 'settings', 'logs', 'scheduler', 'chatwoot', 'analytics']
        view_results = {}
        for v in views:
            res = await page.evaluate(f"""() => {{
                try {{
                    go('{v}');
                    const pane = document.getElementById('v-{v}');
                    if (!pane) return {{ exists: false }};
                    const comp = window.getComputedStyle(pane);
                    return {{
                        exists: true,
                        isShown: pane.classList.contains('show'),
                        isHidden: pane.classList.contains('hidden'),
                        computedDisplay: comp.display,
                        hasContent: pane.children.length > 0 && pane.innerHTML.trim().length > 0
                    }};
                }} catch(err) {{
                    return {{ error: err.toString() }};
                }}
            }}""")
            view_results[v] = res
            
        print(f"6. View Pane switching tests (10 views):")
        for v, r in view_results.items():
            print(f"   - v-{v}: {r}")
            
        print(f"7. Page JS Errors captured: {page_errors}")
        print(f"8. Console errors: {console_errors}")
        
        await browser.close()
        print("=== VERCEL API INDEX VERIFICATION COMPLETE ===")

if __name__ == '__main__':
    asyncio.run(main())
