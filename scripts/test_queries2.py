"""Test field-specific queries."""
import json
import urllib.request

URL = 'https://searchplatform.rospatent.gov.ru/patsearch/v0.2/search'
TOKEN = '97c2da8395104ccab95a117c3d07f000'

QUERIES = [
    # Try searching in description (DE) field
    'DE="Обязательство заключить договор об отчуждении патента"',
    'DE="об отчуждении патента на основании"',
    'DE="об отчуждении патента"',
    'DE="договор об отчуждении патента"',
    'DE=отчуждении AND DE=патента AND DE=1366',
    'DE=(отчуждении AND патента AND 1366)',
    # Try ALLTEXT field  
    'ALLTEXT="об отчуждении патента"',
    'ALLTEXT="договор об отчуждении патента"',
    'ALLTEXT="Обязательство заключить договор"',
    # Look for explicit field that may store this
    # Try just the article number in description
    'DE=1366 AND DE=отчуждении',
    'DE=1366 AND DE=отчуждения',
    # Try fuzzy
    'DE="об отчуждении патента"~3',
    'DE="договор об отчуждении"~3',
    'DE="Обязательство заключить договор"~5',
    # Try broader
    'DE=(Обязательство AND договор AND отчуждении AND патента)',
    # Stemming
    'DE=отчужден* AND DE=1366',
    'DE=обязательств* AND DE=отчужден* AND DE=патент*',
    # RU country + search
    'DE="об отчуждении патента" AND country:RU',
    # Different way to specify country
    'DE="об отчуждении патента" AND publishing_office:RU',
    # Maybe field is "PT" or something else - try common variations
    'PT="об отчуждении патента"',
    'FT="об отчуждении патента"',
    'TXT="об отчуждении патента"',
    # The Russian phrase may have different forms
    'DE="отчуждения патента на основании"',
    'DE="отчуждении патента на основании"',
    'DE="заключить договор об отчуждении"',
    'DE="обязательство заключить договор"',
    # Look at description with broader context
    'DE=отчужд* AND DE=1366',
    'DE=отчужден* WITHIN 10 1366',
    'DE="п.1 ст.1366"',
    'DE="п.1 ст. 1366"',
    'DE="п. 1 ст. 1366"',
    'DE="ст. 1366"',
    'DE="ст.1366"',
    # Check ALLTEXT
    'ALLTEXT="п.1 ст.1366"',
    'ALLTEXT="ст.1366"',
    'ALLTEXT="ст. 1366"',
    'ALLTEXT="Обязательство заключить договор об отчуждении"',
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
    except urllib.error.HTTPError as e:
        body_text = e.read().decode('utf-8')[:200]
        print(f"HTTP {e.code}: {body_text}  | q = {q}")
    except Exception as e:
        print(f"ERROR: {e}  | q = {q}")
