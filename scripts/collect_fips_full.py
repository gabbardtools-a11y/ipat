"""
End-to-end FIPS patent collection script - v2.
Uses text-based snapshot parsing for more reliable element finding.
"""
import json
import re
import subprocess
import time
import os
import sys

OUTPUT_DIR = '/home/z/my-project/fips_pages'
OUTPUT_FILE = f'{OUTPUT_DIR}/all_patents.json'
PROGRESS_FILE = f'{OUTPUT_DIR}/progress.json'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Pattern: "1. 2869222 (01.09.2026) TITLE... НИЗ"
PATENT_PATTERN = re.compile(
    r'^(\d+)\.\s+(\d+)\s*\((\d{2}\.\d{2}\.\d{4})\)\s*(.+?)\s+([А-Я]+)$'
)


def browser(*args, timeout=60, ignore_errors=False):
    cmd = ['agent-browser'] + list(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if result.returncode != 0 and not ignore_errors:
            sys.stderr.write(f'  CMD FAILED: {" ".join(args)}\n    stderr: {result.stderr[:300]}\n')
        return result.stdout
    except subprocess.TimeoutExpired:
        sys.stderr.write(f'  CMD TIMEOUT: {" ".join(args)}\n')
        return ''


def get_snapshot_text():
    """Get page snapshot as text (accessibility tree)."""
    out = browser('snapshot', '--json', timeout=60)
    if not out:
        return ''
    try:
        data = json.loads(out)
        return data.get('data', {}).get('snapshot', '')
    except json.JSONDecodeError:
        return ''


def get_refs_with_names():
    """Get refs that have non-empty names + the snapshot text for context."""
    out = browser('snapshot', '--json', timeout=60)
    if not out:
        return {}, ''
    try:
        data = json.loads(out)
        refs = data.get('data', {}).get('refs', {})
        snapshot = data.get('data', {}).get('snapshot', '')
        return refs, snapshot
    except json.JSONDecodeError:
        return {}, ''


def find_ref_in_snapshot(snapshot_text, search_text, role=None):
    """Find ref id by searching for text in snapshot (case-insensitive).
    
    Snapshot lines look like:
    - generic [ref=e14] clickable [cursor:pointer, onclick]
      - StaticText "ПАТЕНТНЫЕ ДОКУМЕНТЫ РФ (РУС.)"
    - link "Поиск" [ref=e34]
    - checkbox [checked=false, ref=e93]
    """
    if not snapshot_text:
        return None
    search_lower = search_text.lower()
    lines = snapshot_text.split('\n')
    for i, line in enumerate(lines):
        if search_lower not in line.lower():
            continue
        # Extract ref from this line OR from nearby lines (parent generic)
        m = re.search(r'\[ref=([a-z0-9]+)\]', line)
        if m:
            return m.group(1)
        # If text is in StaticText child, look for parent's ref in previous lines
        # Walk backwards to find the closest line with ref= and matching role
        for j in range(i-1, max(i-10, -1), -1):
            prev_line = lines[j]
            m = re.search(r'\[ref=([a-z0-9]+)\]', prev_line)
            if m:
                if role is None or f'- {role} ' in prev_line or f'- {role}\n' in prev_line:
                    return m.group(1)
                # Even if role doesn't match, return it (better than nothing)
                return m.group(1)
    return None


def parse_patents_from_snapshot(snapshot_text):
    """Parse patent entries from snapshot text."""
    patents = []
    if not snapshot_text:
        return patents
    refs, _ = get_refs_with_names()
    for ref_id, ref_info in refs.items():
        if ref_info.get('role') != 'link':
            continue
        name = ref_info.get('name', '')
        m = PATENT_PATTERN.match(name)
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


def wait_for_page_load():
    time.sleep(2)
    browser('wait', '--load', 'networkidle', timeout=30, ignore_errors=True)
    time.sleep(1)


def initial_setup():
    """Open FIPS, select all DBs, check obligation, click search."""
    print('=== Step 1: Open FIPS ===')
    browser('open', 'https://www1.fips.ru/iiss/search.xhtml', timeout=120)
    wait_for_page_load()
    
    url = browser('get', 'url', timeout=15).strip()
    print(f'  URL: {url}')
    
    print('=== Step 2: Expand RU patents group ===')
    refs, snapshot = get_refs_with_names()
    ru_group_ref = find_ref_in_snapshot(snapshot, 'Патентные документы РФ (рус.)')
    if not ru_group_ref:
        print('  ERROR: RU group not found in snapshot')
        print(f'  Snapshot first 500 chars: {snapshot[:500]}')
        return False
    print(f'  RU group ref: {ru_group_ref}')
    browser('click', f'@{ru_group_ref}', timeout=30)
    time.sleep(2)
    
    print('=== Step 3: Mark all 5 RU databases ===')
    refs, snapshot = get_refs_with_names()
    # Mark all unchecked checkboxes (they are the 5 RU DBs, plus status checkboxes which we skip)
    # Status checkboxes appear AFTER "Статус документа" - check if our checkboxes are before that
    # Simpler: just check all unchecked checkboxes with ref <= e93 (before obligation)
    checkboxes_to_check = []
    for ref_id, ref_info in refs.items():
        if ref_info.get('role') == 'checkbox' and ref_info.get('checked') == False:
            # Parse ref number
            m = re.match(r'e(\d+)', ref_id)
            if m:
                num = int(m.group(1))
                checkboxes_to_check.append((num, ref_id))
    checkboxes_to_check.sort()
    # Check first 5 (RU DBs) - they have lowest ref numbers
    for num, ref_id in checkboxes_to_check[:5]:
        browser('check', f'@{ref_id}', timeout=15)
    time.sleep(2)
    
    # Find and click "перейти к поиску" button
    refs, snapshot = get_refs_with_names()
    go_ref = None
    for ref_id, ref_info in refs.items():
        if ref_info.get('role') == 'button' and 'перейти к поиску' in ref_info.get('name', ''):
            go_ref = ref_id
            break
    if not go_ref:
        print('  ERROR: "перейти к поиску" button not found')
        return False
    print(f'=== Step 4: Click "перейти к поиску" (ref={go_ref}) ===')
    browser('click', f'@{go_ref}', timeout=60)
    wait_for_page_load()
    
    # Verify we're on search page
    refs, snapshot = get_refs_with_names()
    if 'Основная область запроса' not in snapshot:
        print('  ERROR: search form not found')
        return False
    print('  On search page')
    
    print('=== Step 5: Check obligation checkbox ===')
    # Find checkbox for obligation - look for ref after "Обязательство заключить договор" text
    obligation_ref = find_ref_in_snapshot(snapshot, 'Обязательство заключить договор об отчуждении')
    if not obligation_ref:
        # Find next checkbox after the obligation text in snapshot
        lines = snapshot.split('\n')
        for i, line in enumerate(lines):
            if 'Обязательство заключить договор об отчуждении' in line:
                # Look for next checkbox ref
                for j in range(i, min(i+5, len(lines))):
                    m = re.search(r'\[ref=([a-z0-9]+)\]', lines[j])
                    if m and 'checkbox' in lines[j]:
                        obligation_ref = m.group(1)
                        break
                break
    if not obligation_ref:
        print('  ERROR: obligation checkbox not found')
        return False
    print(f'  Obligation ref: {obligation_ref}')
    browser('check', f'@{obligation_ref}', timeout=15)
    time.sleep(1)
    
    print('=== Step 6: Click search button ===')
    # Find top "Поиск" button - it's the first button with name "Поиск"
    search_btn_ref = None
    for ref_id, ref_info in refs.items():
        if ref_info.get('role') == 'button' and ref_info.get('name', '').strip() == 'Поиск':
            search_btn_ref = ref_id
            break
    if not search_btn_ref:
        print('  ERROR: search button not found')
        return False
    browser('click', f'@{search_btn_ref}', timeout=60)
    wait_for_page_load()
    
    # Verify we're on results page
    url = browser('get', 'url', timeout=15).strip()
    print(f'  URL after search: {url}')
    if 'search_res' not in url:
        # Retry
        print('  Not on results page, retrying...')
        time.sleep(15)
        browser('reload', timeout=120)
        wait_for_page_load()
        url = browser('get', 'url', timeout=15).strip()
        if 'search_res' not in url:
            print(f'  ERROR: still not on results page. URL: {url}')
            return False
    
    # Check we have results
    refs, snapshot = get_refs_with_names()
    if 'Всего найдено' in snapshot or 'Найденные документы' in snapshot:
        # Find the count
        m = re.search(r'Всего найдено:\s*(\d+)', snapshot)
        if m:
            print(f'  Total found: {m.group(1)}')
        else:
            print('  Results page loaded')
    return True


def find_next_page_ref_in_snapshot(snapshot_text):
    """Find '›' (next page) ref in snapshot."""
    if not snapshot_text:
        return None
    for line in snapshot_text.split('\n'):
        # Look for link with name "›"
        if '›' in line and 'link' in line and 'ref=' in line:
            # Make sure it's not "››" (last page)
            if '››' in line:
                continue
            m = re.search(r'\[ref=([a-z0-9]+)\]', line)
            if m:
                return m.group(1)
    return None


def collect_pages():
    all_patents = []
    seen_doc_numbers = set()
    last_position = 0
    consecutive_failures = 0
    
    for page_num in range(1, 81):
        print(f'\n=== Page {page_num}/80 ===')
        
        refs, snapshot = get_refs_with_names()
        if not snapshot:
            print(f'  Failed to get snapshot, retrying...')
            time.sleep(10)
            refs, snapshot = get_refs_with_names()
            if not snapshot:
                print(f'  Still no snapshot, retrying with reload...')
                browser('reload', timeout=120)
                wait_for_page_load()
                refs, snapshot = get_refs_with_names()
                if not snapshot:
                    consecutive_failures += 1
                    if consecutive_failures >= 3:
                        print(f'  3 consecutive failures, stopping')
                        break
                    continue
        
        patents = parse_patents_from_snapshot(snapshot)
        if not patents:
            print(f'  No patents parsed')
            consecutive_failures += 1
            if consecutive_failures >= 3:
                print(f'  3 consecutive failures, stopping')
                break
            continue
        
        # Check for duplicates
        new_patents = []
        for p in patents:
            key = (p['doc_number'], p['database'])
            if key not in seen_doc_numbers:
                seen_doc_numbers.add(key)
                new_patents.append(p)
        
        if not new_patents:
            print(f'  All {len(patents)} patents are duplicates! Navigation failed.')
            # Try to navigate again
            next_ref = find_next_page_ref_in_snapshot(snapshot)
            if not next_ref:
                print(f'  No next page button found')
                break
            browser('click', f'@{next_ref}', timeout=60)
            wait_for_page_load()
            time.sleep(3)
            # Retry once
            refs, snapshot = get_refs_with_names()
            patents = parse_patents_from_snapshot(snapshot)
            new_patents = []
            for p in patents:
                key = (p['doc_number'], p['database'])
                if key not in seen_doc_numbers:
                    seen_doc_numbers.add(key)
                    new_patents.append(p)
            if not new_patents:
                print(f'  Still duplicates, stopping')
                break
        
        consecutive_failures = 0
        all_patents.extend(new_patents)
        last_position = new_patents[-1]['position'] if new_patents else last_position
        
        # Stats
        years = {}
        for p in new_patents:
            y = p['publication_year']
            years[y] = years.get(y, 0) + 1
        years_str = ', '.join(f'{y}:{c}' for y, c in sorted(years.items(), key=lambda x: (x[0] is None, x[0])))
        
        print(f'  +{len(new_patents)} new (total: {len(all_patents)}, last pos: {last_position})')
        print(f'  Years: {years_str}')
        if new_patents:
            print(f'  First: {new_patents[0]["position"]}. RU{new_patents[0]["doc_number"]} ({new_patents[0]["publication_date"]})')
            print(f'  Last:  {new_patents[-1]["position"]}. RU{new_patents[-1]["doc_number"]} ({new_patents[-1]["publication_date"]})')
        
        # Save progress
        with open(PROGRESS_FILE, 'w') as f:
            json.dump({
                'next_page': page_num + 1,
                'patents': all_patents,
                'total_collected': len(all_patents),
                'last_position': last_position,
            }, f, ensure_ascii=False)
        
        # Navigate to next page
        if page_num < 80:
            next_ref = find_next_page_ref_in_snapshot(snapshot)
            if not next_ref:
                print(f'  No next page button, stopping')
                break
            browser('click', f'@{next_ref}', timeout=60)
            wait_for_page_load()
            time.sleep(1)
    
    # Save final results
    with open(OUTPUT_FILE, 'w') as f:
        json.dump({
            'total': len(all_patents),
            'patents': all_patents,
        }, f, ensure_ascii=False, indent=2)
    
    print(f'\n=== DONE ===')
    print(f'Collected {len(all_patents)} unique patents')
    
    years = {}
    for p in all_patents:
        y = p['publication_year']
        years[y] = years.get(y, 0) + 1
    print(f'Year distribution:')
    for y in sorted(years.keys(), key=lambda x: (x is None, x)):
        print(f'  {y}: {years[y]}')
    
    print(f'Saved to: {OUTPUT_FILE}')
    return all_patents


def main():
    url = browser('get', 'url', timeout=15).strip()
    print(f'Current URL: {url}')
    
    if 'search_res' not in url:
        if not initial_setup():
            print('Initial setup failed, exiting')
            return 1
    else:
        print('Already on results page, continuing collection')
    
    collect_pages()
    return 0


if __name__ == '__main__':
    sys.exit(main())
