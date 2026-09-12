"""
Direct HTTP-based FIPS patent collection - v2.
Uses proper JSF form submission via requests.
"""
import json
import re
import time
import os
import warnings
import requests
from bs4 import BeautifulSoup
from bs4 import XMLParsedAsHTMLWarning

# Suppress XML warning
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

OUTPUT_DIR = '/home/z/my-project/fips_pages'
OUTPUT_FILE = f'{OUTPUT_DIR}/all_patents.json'
PROGRESS_FILE = f'{OUTPUT_DIR}/progress.json'
os.makedirs(OUTPUT_DIR, exist_ok=True)

BASE_URL = 'https://www1.fips.ru'
DB_URL = f'{BASE_URL}/iiss/db.xhtml'
SEARCH_URL = f'{BASE_URL}/iiss/search.xhtml'
RESULTS_URL = f'{BASE_URL}/iiss/search_res.xhtml'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
}

PATENT_PATTERN = re.compile(
    r'^(\d+)\.\s+(\d+)\s*\((\d{2}\.\d{2}\.\d{4})\)\s*(.+?)\s+([А-Я]+)$'
)


def make_session():
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


def get_with_retry(session, url, **kwargs):
    for attempt in range(5):
        try:
            resp = session.get(url, timeout=60, **kwargs)
            if resp.status_code == 200:
                return resp
            print(f'    GET status {resp.status_code}, retry {attempt+1}/5', flush=True)
            time.sleep(10 * (attempt + 1))
        except requests.exceptions.RequestException as e:
            print(f'    GET error: {e}, retry {attempt+1}/5', flush=True)
            time.sleep(10 * (attempt + 1))
    return None


def post_with_retry(session, url, **kwargs):
    for attempt in range(5):
        try:
            resp = session.post(url, timeout=60, **kwargs)
            if resp.status_code == 200:
                return resp
            print(f'    POST status {resp.status_code}, retry {attempt+1}/5', flush=True)
            time.sleep(10 * (attempt + 1))
        except requests.exceptions.RequestException as e:
            print(f'    POST error: {e}, retry {attempt+1}/5', flush=True)
            time.sleep(10 * (attempt + 1))
    return None


def extract_viewstate(html):
    soup = BeautifulSoup(html, 'html.parser')
    vs = soup.find('input', {'name': 'javax.faces.ViewState'})
    if vs:
        return vs.get('value', '')
    m = re.search(r'name="javax\.faces\.ViewState"[^>]*value="([^"]+)"', html)
    return m.group(1) if m else None


def extract_all_submits(soup, form_id=None):
    """Find all submit inputs and buttons in a form."""
    form = soup.find('form', {'id': form_id}) if form_id else soup
    if not form:
        return []
    submits = []
    # Submit inputs
    for si in form.find_all('input', {'type': 'submit'}):
        submits.append({
            'type': 'input',
            'id': si.get('id', ''),
            'name': si.get('name', ''),
            'value': si.get('value', ''),
            'text': si.get('value', ''),
        })
    # Buttons
    for b in form.find_all('button'):
        submits.append({
            'type': 'button',
            'id': b.get('id', ''),
            'name': b.get('name', ''),
            'value': b.get('value', ''),
            'text': b.get_text(strip=True),
        })
    return submits


def find_submit_by_text(submits, text):
    """Find submit by text (case-insensitive)."""
    text_lower = text.lower()
    for s in submits:
        if text_lower in s['text'].lower():
            return s
    return None


def ajax_post(session, url, source_id, viewstate, extra_data=None, render='@all'):
    """Send PrimeFaces AJAX request."""
    data = {
        'javax.faces.partial.ajax': 'true',
        'javax.faces.source': source_id,
        'javax.faces.partial.execute': '@all',
        'javax.faces.partial.render': render,
        source_id: source_id,
        'javax.faces.ViewState': viewstate,
    }
    if extra_data:
        data.update(extra_data)
    
    ajax_headers = {
        'Faces-Request': 'partial/ajax',
        'X-Requested-With': 'XMLHttpRequest',
    }
    
    resp = post_with_retry(session, url, data=data, headers=ajax_headers)
    if not resp:
        return None, None
    
    # Parse XML response
    new_html = None
    new_vs = None
    
    updates = re.findall(r'<update id="([^"]+)"><!\[CDATA\[(.*?)\]\]></update>', resp.text, re.S)
    for uid, ucontent in updates:
        if uid == 'javax.faces.ViewState':
            new_vs = ucontent
        else:
            # The largest update is usually the form content
            if new_html is None or len(ucontent) > len(new_html):
                new_html = ucontent
    
    return new_html, new_vs


def non_ajax_post(session, url, source_name, source_value, viewstate, extra_data=None):
    """Send non-AJAX JSF form submission (full page reload)."""
    data = {
        source_name: source_value,
        'javax.faces.ViewState': viewstate,
    }
    if extra_data:
        data.update(extra_data)
    
    resp = post_with_retry(session, url, data=data, allow_redirects=True)
    if not resp:
        return None, None
    
    # Full HTML response
    new_vs = extract_viewstate(resp.text)
    return resp.text, new_vs


def setup_search(session):
    """Full setup: open, select all DBs, go to search page, check obligation, search."""
    print('=== Step 1: Open FIPS search page ===', flush=True)
    resp = get_with_retry(session, DB_URL)
    if not resp:
        return None, None
    
    soup = BeautifulSoup(resp.text, 'html.parser')
    viewstate = extract_viewstate(resp.text)
    if not viewstate:
        print('  ERROR: no ViewState', flush=True)
        return None, None
    print(f'  Got ViewState', flush=True)
    
    # Find "выделить все" submit button
    submits = extract_all_submits(soup, 'db-selection-form')
    select_all = find_submit_by_text(submits, 'выделить все')
    if not select_all:
        print('  ERROR: "выделить все" button not found', flush=True)
        return None, None
    print(f'  Found "выделить все": id={select_all["id"]}', flush=True)
    
    print('\n=== Step 2: Click "выделить все" via AJAX ===', flush=True)
    new_html, new_vs = ajax_post(session, DB_URL, select_all['id'], viewstate)
    if new_vs:
        viewstate = new_vs
        print(f'  Got new ViewState', flush=True)
    else:
        print(f'  WARNING: no new ViewState in response', flush=True)
    
    # Re-fetch page to see current state
    resp = get_with_retry(session, DB_URL)
    if resp:
        soup = BeautifulSoup(resp.text, 'html.parser')
        viewstate = extract_viewstate(resp.text) or viewstate
    
    # Check if all 5 checkboxes are now checked
    checkboxes = soup.find_all('input', {'type': 'checkbox'})
    checked_count = sum(1 for cb in checkboxes if cb.get('checked'))
    print(f'  Checkboxes checked: {checked_count}/{len(checkboxes)}', flush=True)
    
    # Find "перейти к поиску" button
    submits = extract_all_submits(soup, 'db-selection-form')
    go_btn = find_submit_by_text(submits, 'перейти к поиску')
    if not go_btn:
        print('  ERROR: "перейти к поиску" not found', flush=True)
        # Maybe need to expand group first
        return None, None
    print(f'  Found "перейти к поиску": id={go_btn["id"]}', flush=True)
    
    print('\n=== Step 3: Click "перейти к поиску" (non-AJAX) ===', flush=True)
    # Use non-AJAX submit to get full page
    new_html, new_vs = non_ajax_post(session, DB_URL, go_btn['name'], go_btn['id'], viewstate)
    if not new_html:
        print('  ERROR: failed to submit', flush=True)
        return None, None
    if new_vs:
        viewstate = new_vs
    
    # Check we're on search page
    if 'Основная область запроса' not in new_html:
        print('  WARNING: search form not found in response', flush=True)
        # Re-fetch
        resp = get_with_retry(session, SEARCH_URL)
        if resp:
            new_html = resp.text
            viewstate = extract_viewstate(resp.text) or viewstate
    
    soup = BeautifulSoup(new_html, 'html.parser')
    
    # Find obligation checkbox
    print('\n=== Step 4: Find and check obligation checkbox ===', flush=True)
    obligation_cb = None
    for cb in soup.find_all('input', {'type': 'checkbox'}):
        # Check nearby text
        parent = cb.parent
        for _ in range(5):
            if parent is None:
                break
            text = parent.get_text(strip=True)
            if 'Обязательство заключить договор об отчуждении' in text:
                obligation_cb = cb
                break
            parent = parent.parent
        if obligation_cb:
            break
    
    if not obligation_cb:
        print('  ERROR: obligation checkbox not found', flush=True)
        return None, None
    
    cb_name = obligation_cb.get('name', '')
    cb_id = obligation_cb.get('id', '')
    print(f'  Found obligation: name={cb_name}, id={cb_id}', flush=True)
    
    # Find search button (Поиск)
    print('\n=== Step 5: Submit search ===', flush=True)
    # Look for submit button with value "Поиск"
    search_btn = None
    for si in soup.find_all('input', {'type': 'submit'}):
        if si.get('value', '').strip() == 'Поиск':
            search_btn = si
            break
    
    if not search_btn:
        print('  ERROR: "Поиск" button not found', flush=True)
        return None, None
    
    btn_name = search_btn.get('name', '')
    btn_id = search_btn.get('id', '')
    print(f'  Search button: name={btn_name}, id={btn_id}', flush=True)
    
    # Submit form with obligation checked (non-AJAX to get full results page)
    extra_data = {cb_name: 'on'}  # Check the obligation checkbox
    result_html, new_vs = non_ajax_post(session, SEARCH_URL, btn_name, btn_id, viewstate, extra_data=extra_data)
    
    if not result_html:
        print('  ERROR: search submission failed', flush=True)
        return None, None
    
    if new_vs:
        viewstate = new_vs
    
    # Check if we have results
    total_match = re.search(r'Всего найдено:\s*(\d+)', result_html)
    if total_match:
        print(f'  Total found: {total_match.group(1)}', flush=True)
    else:
        print(f'  WARNING: "Всего найдено" not found in response', flush=True)
        # Save response for debugging
        with open('/home/z/my-project/fips_pages/debug_search_response.html', 'w') as f:
            f.write(result_html[:50000])
    
    return result_html, viewstate


def parse_results_page(html):
    """Parse patent entries from results page HTML."""
    soup = BeautifulSoup(html, 'html.parser')
    patents = []
    
    for a in soup.find_all('a'):
        text = a.get_text(strip=True)
        m = PATENT_PATTERN.match(text)
        if m:
            num_str, doc_num, pub_date, title, db = m.groups()
            try:
                d, mth, y = pub_date.split('.')
                iso_date = f'{y}-{mth}-{d}'
                year = int(y)
            except Exception:
                iso_date = pub_date
                year = None
            patents.append({
                'position': int(num_str),
                'doc_number': doc_num,
                'publication_date': pub_date,
                'publication_date_iso': iso_date,
                'publication_year': year,
                'title': title.strip(),
                'database': db.strip(),
            })
    
    patents.sort(key=lambda p: p['position'])
    return patents


def navigate_to_page_via_ajax(session, viewstate, page_num):
    """Navigate to specific page number via PrimeFaces AJAX.
    
    Page links in pagination have onclick like:
    PrimeFaces.ab({s:"j_idt98:j_idt106:1:j_idt107",u:"j_idt98"})
    where "1" is the index (0=page2, 1=page3, etc.)
    
    But for arbitrary pages, we use the "К странице" input.
    """
    # The page link source ID pattern: j_idt98:j_idt106:{index}:j_idt107
    # Index = page_num - 2 (since page 1 is current, page 2 is at index 0, etc.)
    # But this only works for visible pages in pagination
    
    # Try direct page link first
    page_index = page_num - 2
    source_id = f'j_idt98:j_idt106:{page_index}:j_idt107'
    
    new_html, new_vs = ajax_post(session, RESULTS_URL, source_id, viewstate, render='j_idt98')
    
    if new_html and len(new_html) > 1000:
        return new_html, new_vs
    
    # If that didn't work, try alternative source IDs
    # The pagination might use different IDs
    # Try "К странице" input approach
    # The input has id like "j_idt98:j_idt113" and button "j_idt98:j_idt114"
    
    return None, None


def main():
    # Load existing progress
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            progress = json.load(f)
        all_patents = progress.get('patents', [])
        print(f'Loaded {len(all_patents)} existing patents from progress file', flush=True)
    else:
        all_patents = []
    
    seen_doc_numbers = set((p['doc_number'], p['database']) for p in all_patents)
    
    session = make_session()
    result_html, viewstate = setup_search(session)
    
    if not result_html:
        print('FAILED to setup search', flush=True)
        return 1
    
    # Parse first page
    patents = parse_results_page(result_html)
    new_patents = [p for p in patents if (p['doc_number'], p['database']) not in seen_doc_numbers]
    for p in new_patents:
        seen_doc_numbers.add((p['doc_number'], p['database']))
    all_patents.extend(new_patents)
    print(f'\nPage 1: +{len(new_patents)} new (total: {len(all_patents)})', flush=True)
    
    # Save progress
    with open(PROGRESS_FILE, 'w') as f:
        json.dump({
            'next_page': 2,
            'patents': all_patents,
            'total_collected': len(all_patents),
        }, f, ensure_ascii=False)
    
    # Save first page HTML for debugging
    with open(f'{OUTPUT_DIR}/page_1.html', 'w') as f:
        f.write(result_html)
    
    # Navigate through pages 2-80
    for page_num in range(2, 81):
        print(f'\n=== Page {page_num}/80 ===', flush=True)
        
        new_html, new_vs = navigate_to_page_via_ajax(session, viewstate, page_num)
        
        if not new_html:
            print(f'  Failed to navigate to page {page_num}', flush=True)
            # Retry with delay
            time.sleep(5)
            new_html, new_vs = navigate_to_page_via_ajax(session, viewstate, page_num)
            if not new_html:
                print(f'  Still failed, skipping', flush=True)
                continue
        
        if new_vs:
            viewstate = new_vs
        
        patents = parse_results_page(new_html)
        if not patents:
            print(f'  No patents parsed, saving HTML for debug', flush=True)
            with open(f'{OUTPUT_DIR}/page_{page_num}_debug.html', 'w') as f:
                f.write(new_html[:50000])
            continue
        
        new_patents = [p for p in patents if (p['doc_number'], p['database']) not in seen_doc_numbers]
        for p in new_patents:
            seen_doc_numbers.add((p['doc_number'], p['database']))
        all_patents.extend(new_patents)
        
        years = {}
        for p in new_patents:
            y = p['publication_year']
            years[y] = years.get(y, 0) + 1
        years_str = ', '.join(f'{y}:{c}' for y, c in sorted(years.items(), key=lambda x: (x[0] is None, x[0])))
        
        print(f'  +{len(new_patents)} new (total: {len(all_patents)})', flush=True)
        if new_patents:
            print(f'  Years: {years_str}', flush=True)
            print(f'  First: {new_patents[0]["position"]}. RU{new_patents[0]["doc_number"]} ({new_patents[0]["publication_date"]})', flush=True)
            print(f'  Last:  {new_patents[-1]["position"]}. RU{new_patents[-1]["doc_number"]} ({new_patents[-1]["publication_date"]})', flush=True)
        
        with open(PROGRESS_FILE, 'w') as f:
            json.dump({
                'next_page': page_num + 1,
                'patents': all_patents,
                'total_collected': len(all_patents),
            }, f, ensure_ascii=False)
        
        time.sleep(1)
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump({
            'total': len(all_patents),
            'patents': all_patents,
        }, f, ensure_ascii=False, indent=2)
    
    print(f'\n=== DONE ===', flush=True)
    print(f'Collected {len(all_patents)} unique patents', flush=True)
    
    years = {}
    for p in all_patents:
        y = p['publication_year']
        years[y] = years.get(y, 0) + 1
    print('Year distribution:', flush=True)
    for y in sorted(years.keys(), key=lambda x: (x is None, x)):
        print(f'  {y}: {years[y]}', flush=True)
    
    return 0


if __name__ == '__main__':
    exit(main())
