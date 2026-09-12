"""
Collect all 4000 patent search results from FIPS search page.
Navigate through 80 pages (50 results per page) and parse each.
Save to JSON file for further processing.
"""
import json
import re
import subprocess
import time
import os

OUTPUT_FILE = '/home/z/my-project/fips_pages/all_patents.json'
PROGRESS_FILE = '/home/z/my-project/fips_pages/progress.json'

# Pattern to parse patent entries like:
# "1. 2869222 (01.09.2026) СПОСОБ ИЗГОТОВЛЕНИЯ... НИЗ"
PATENT_PATTERN = re.compile(
    r'^(\d+)\.\s+(\d+)\s*\((\d{2}\.\d{2}\.\d{4})\)\s*(.+?)\s+([А-Я]+)$'
)


def run_browser_cmd(cmd_args, timeout=120):
    """Run agent-browser command and return output."""
    cmd = ['agent-browser'] + cmd_args
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return '', 'TIMEOUT', -1


def get_snapshot_json():
    """Get page snapshot as JSON."""
    stdout, stderr, rc = run_browser_cmd(['snapshot', '--json'], timeout=60)
    if rc != 0:
        print(f'  ERROR getting snapshot: {stderr}')
        return None
    try:
        data = json.loads(stdout)
        return data.get('data', {})
    except json.JSONDecodeError as e:
        print(f'  ERROR parsing JSON: {e}')
        return None


def parse_patents_from_snapshot(snap_data):
    """Extract patent entries from snapshot refs."""
    refs = snap_data.get('refs', {})
    patents = []
    for ref_id, ref_info in refs.items():
        name = ref_info.get('name', '')
        role = ref_info.get('role', '')
        if role != 'link':
            continue
        # Try to match patent pattern
        m = PATENT_PATTERN.match(name)
        if m:
            num_str, doc_num, pub_date, title, db = m.groups()
            # Convert date from DD.MM.YYYY to YYYY-MM-DD
            try:
                d, mth, y = pub_date.split('.')
                iso_date = f'{y}-{mth}-{d}'
            except Exception:
                iso_date = pub_date
            patents.append({
                'position': int(num_str),
                'doc_number': doc_num,
                'publication_date': pub_date,
                'publication_date_iso': iso_date,
                'publication_year': int(pub_date.split('.')[2]) if pub_date else None,
                'title': title.strip(),
                'database': db.strip(),
                'ref_id': ref_id,
            })
    return patents


def goto_page(page_num):
    """Navigate to specific page number (1-indexed)."""
    if page_num == 1:
        # Click "‹‹" or just navigate to first page
        # Actually we are usually on page 1 already after search
        return True
    
    # Use the "К странице" input - type page number and submit
    # First, find the input box ref
    snap_data = get_snapshot_json()
    if not snap_data:
        return False
    
    refs = snap_data.get('refs', {})
    page_input_ref = None
    for ref_id, ref_info in refs.items():
        if ref_info.get('role') == 'textbox' and ref_info.get('name', '').strip() == '':
            # Could be the page input - but need to be careful, there are multiple
            pass
    
    # Easier approach: click the page number link directly
    # Look for a link with name matching the page number
    target_ref = None
    for ref_id, ref_info in refs.items():
        if ref_info.get('role') == 'link' and ref_info.get('name', '').strip() == str(page_num):
            target_ref = ref_id
            break
    
    if target_ref:
        stdout, stderr, rc = run_browser_cmd(['click', f'@{target_ref}'], timeout=60)
        if rc != 0:
            print(f'  ERROR clicking page {page_num}: {stderr}')
            return False
        # Wait for page load
        time.sleep(3)
        run_browser_cmd(['wait', '--load', 'networkidle'], timeout=30)
        time.sleep(2)
        return True
    
    # If link not found (e.g., page 50 not in pagination 1,2,3,4,5...80), use input
    # Find the page input box
    for ref_id, ref_info in refs.items():
        if ref_info.get('role') == 'textbox':
            name = ref_info.get('name', '').strip()
            if name == '':
                page_input_ref = ref_id
                break
    
    if page_input_ref:
        # Type page number
        stdout, stderr, rc = run_browser_cmd(['fill', f'@{page_input_ref}', str(page_num)], timeout=30)
        if rc != 0:
            return False
        # Press Enter
        stdout, stderr, rc = run_browser_cmd(['press', 'Enter'], timeout=30)
        time.sleep(3)
        run_browser_cmd(['wait', '--load', 'networkidle'], timeout=30)
        time.sleep(2)
        return True
    
    print(f'  Could not find way to navigate to page {page_num}')
    return False


def main():
    # Load progress if exists
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            progress = json.load(f)
        all_patents = progress.get('patents', [])
        start_page = progress.get('next_page', 1)
        print(f'Resuming from page {start_page}, already have {len(all_patents)} patents')
    else:
        all_patents = []
        start_page = 1
    
    # We're already on results page 1
    current_page = start_page
    
    for page_num in range(start_page, 81):  # 80 pages total
        print(f'\n=== Page {page_num}/80 ===')
        
        if page_num > 1:
            # Navigate to next page
            if not goto_page(page_num):
                print(f'Failed to navigate to page {page_num}, retrying...')
                time.sleep(5)
                if not goto_page(page_num):
                    print(f'Skipping page {page_num}')
                    continue
        
        # Get snapshot and parse
        snap_data = get_snapshot_json()
        if not snap_data:
            print(f'Failed to get snapshot for page {page_num}')
            time.sleep(3)
            snap_data = get_snapshot_json()
            if not snap_data:
                continue
        
        patents = parse_patents_from_snapshot(snap_data)
        if not patents:
            print(f'No patents parsed on page {page_num}')
            # Save current page HTML for debugging
            continue
        
        print(f'  Found {len(patents)} patents on page {page_num}')
        for p in patents[:3]:
            print(f'    {p["position"]}. RU{p["doc_number"]} ({p["publication_date"]}) - {p["title"][:60]}... [{p["database"]}]')
        if len(patents) > 3:
            print(f'    ... and {len(patents)-3} more')
        
        all_patents.extend(patents)
        
        # Save progress every page
        with open(PROGRESS_FILE, 'w') as f:
            json.dump({
                'next_page': page_num + 1,
                'patents': all_patents,
                'total_collected': len(all_patents),
            }, f, ensure_ascii=False, indent=2)
        
        # Small delay between pages
        time.sleep(1.5)
    
    # Save final results
    with open(OUTPUT_FILE, 'w') as f:
        json.dump({
            'total': len(all_patents),
            'patents': all_patents,
        }, f, ensure_ascii=False, indent=2)
    
    print(f'\n=== DONE ===')
    print(f'Collected {len(all_patents)} patents total')
    print(f'Saved to: {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
