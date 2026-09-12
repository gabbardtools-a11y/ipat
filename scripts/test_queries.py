"""Test different query formulations to find the best match for ст.1366 obligation."""
import json
import urllib.request

URL = 'https://searchplatform.rospatent.gov.ru/patsearch/v0.2/search'
TOKEN = '97c2da8395104ccab95a117c3d07f000'

QUERIES = [
    # Full phrase variants (these come from the actual FIPS checkbox label)
    '"Обязательство заключить договор об отчуждении патента"',
    '"Обязательство заключить договор об отчуждении патента на основании"',
    # The exact text from FIPS checkbox
    '"об отчуждении патента на основании п.1 ст.1366"',
    '"об отчуждении патента на основании п. 1 ст. 1366"',
    # Sub-phrases
    '"об отчуждении патента на основании"',
    '"договор об отчуждении патента"',
    # Key parts combined
    'Обязательство AND отчуждении AND патента',
    'Обязательство AND "об отчуждении патента"',
    # Just the article reference
    '"ст.1366" AND отчуждении',
    '"ст. 1366" AND отчуждении',
    '1366 AND "об отчуждении"',
    '1366 AND отчуждения',
    '1366 AND отчуждении',
    # Try with "ГК" or "Гражданского кодекса"
    '1366 AND "ГК"',
    # Combined
    '"об отчуждении" AND 1366',
    '"об отчуждении патента" AND 1366',
    # Most literal
    '"Обязательство заключить договор об отчуждении патента на основании п.1 ст.1366 ч.4 ГК РФ"',
]

for q in QUERIES:
    body = json.dumps({"q": q, "limit": 0}).encode('utf-8')
    req = urllib.request.Request(
        URL,
        data=body,
        headers={
            'Authorization': f'Bearer {TOKEN}',
            'Content-Type': 'application/json',
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            total = data.get('total', 0)
            avail = data.get('available', 0)
            print(f"total={total:>10}  avail={avail:>6}  | q = {q}")
    except Exception as e:
        print(f"ERROR: {e}  | q = {q}")
