# Worklog: FIPS patent search for "Обязательство заключить договор об отчуждении патента на основании п.1 ст.1366 ч.4 ГК РФ"

---
Task ID: 1
Agent: main
Task: Find patents with obligation under art.1366(4) of Civil Code, filter to 2023-2026, enrich via Rospatent API, save to Excel

Work Log:
- Tested Rospatent Search Platform API with provided token - works, 136M patents indexed
- Discovered that art.1366 obligation field is NOT exposed in API - it's a FIPS-internal metadata
- API /docs/{id} endpoint returns full text, but search by phrase "Обязательство..." returns 0 results (no full text indexed for this field)
- Fallback: use FIPS web search (has dedicated checkbox for this obligation)
- Web search returned 60,485 documents total, 4,000 accessible
- Filter by date 2023-2026 via FIPS form failed due to "Некорректный формат термина запроса" error and 502 Bad Gateway instability
- Strategy: collect all 4,000 patents from FIPS web, filter by year post-factum, enrich via API /docs/{id}

Stage Summary:
- Search URL: https://www1.fips.ru/iiss/search_res.xhtml?faces-redirect=true
- Total found: 60,485 patents
- Available for collection: 4,000 (80 pages × 50 per page)
- Will filter to 2023-2026 publication years post-collection
- For each filtered patent, will call Rospatent API /docs/{id} for full data
- Token: 97c2da8395104ccab95a117c3d07f000

---
Task ID: 2
Agent: main
Task: Collect patent data from FIPS web

Work Log:
- Successfully ran search on FIPS (60,485 patents found, 4,000 accessible)
- Attempted to filter by date 2023-2026 via FIPS form - failed with "Некорректный формат термина запроса" error
- Started collecting all 4,000 patents via browser automation
- First attempt collected ~305 unique patents (600 with duplicates) before script issues
- Rewrote collection script to use "next page" button with deduplication
- Tried to run new script but FIPS server started returning 502 Bad Gateway consistently
- Waited 2+ minutes - server still down

Stage Summary:
- FIPS server is currently unstable (502 Bad Gateway)
- Cannot continue collection at this time
- Options for user:
  A) Wait for FIPS to recover and retry later
  B) Use Rospatent API with workaround (filter RU patents by date 2023-2026, then check each for art.1366 in full text via /docs/{id} endpoint)
  C) Try open Rospatent registers (https://online.rospatent.gov.ru/registers)

---
Task ID: 3
Agent: main
Task: Collect all 4000 patents from FIPS

Work Log:
- Continued collection from page 31 (after server recovery)
- Successfully collected pages 31-44 (+700 patents, total 2200)
- Navigation broke at page 44 - JSF/PrimeFaces AJAX click stopped working via agent-browser
- Tried multiple approaches:
  * agent-browser click on next/› button - no effect
  * Click on page number links (e.g. "45") - no effect  
  * Direct JS eval PrimeFaces.ab() - executed but no navigation
  * JS dispatchEvent - no effect
  * agent-browser fill "К странице" + button click - no effect
- Tried direct HTTP approach via requests library:
  * Cannot submit JSF form with checkboxes - server doesn't preserve state
  * AJAX "выделить все" updates ViewState but doesn't show "перейти к поиску" button
  * Direct GET to search.xhtml redirects back to db.xhtml (server requires DB selection)
- JSF ViewState mechanism makes it very hard to bypass browser-based navigation

Stage Summary:
- Collected 2200 unique patents out of 4000 available (55%)
- For 2023-2026 filter: have 137 patents (117 unique doc numbers)
  * 2023: 2 patents (2 unique)
  * 2024: 0 patents
  * 2025: 35 patents (35 unique)
  * 2026: 100 patents (80 unique)
- Saved list of 2023-2026 patents to /home/z/my-project/fips_pages/patents_2023_2026.json
- Next step: parse Google Patents for these 117 unique doc numbers
