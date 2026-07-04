# 5060 Institution Map Dashboard Benchmark

## Current Objective

The dashboard must help the operator find and manage 5060+ outreach targets across Korea:

- See senior facilities, churches, libraries, lifelong education institutions, and similar targets on a Korea-wide map.
- Switch institution types and regions without losing context or forcing the map back to the whole country unless explicitly requested.
- Keep an email/contact list visible and usable while the map is explored.
- Open an institution-level management view for sales status, contact verification, email source, next action, and notes.
- Automate email sending later, while the current phase keeps sending locked until emails are verified.

## Current Dashboard Problems Observed

Screenshot: `docs/benchmarks/screenshots/current-dashboard.png`

- `전국` interactions over-fit the map and repeatedly collapse the user's selected zoom back to the national view.
- The Kakao map and fallback dot layer are both visually present, making the canvas look like two map systems are stacked.
- Hundreds of raw markers are rendered at once, causing visual noise and likely contributing to pan/zoom lag.
- The right email/sales panel has overlapping blocks when the list grows; the automation panel intrudes into the contact list area.
- There is no clear separation between `real map exploration`, `static regional overview`, and `list/contact operations`.
- Filters compete for width with the map instead of acting as compact controls above the canvas or as a collapsible drawer.

## Benchmarks Visited

### Baymard Split View Research

Source: https://baymard.com/blog/accommodations-split-view

Screenshot: `docs/benchmarks/screenshots/baymard-split-view.png`

Benchmark value:

- Use a stable list-map split when the user compares many places.
- Keep the selected entity visible in a list while the map remains spatial context.
- Avoid forcing users into map-only navigation for operational work.

Apply to current dashboard:

- Main `실지도` mode should use a left or right entity list with independent scroll.
- Selecting a card highlights one marker and opens the institution detail drawer.
- The map should not auto-reset on every filter click.

### Kakao MarkerClusterer

Source: https://apis.map.kakao.com/web/sample/basicClusterer/

Screenshot: `docs/benchmarks/screenshots/kakao-clusterer.png`

Benchmark value:

- Native Kakao cluster bubbles reduce hundreds of pins into regional counts.
- Cluster rendering is more readable than raw markers for nationwide data.
- This keeps Kakao as the primary map stack, avoiding a costly map provider switch.

Apply to current dashboard:

- Replace raw nationwide markers with Kakao MarkerClusterer in `실지도`.
- Remove fallback dots from the real map layer entirely.
- Use marker clustering as the default for 775+ institutions.

### Mapbox Store Locator

Source: https://docs.mapbox.com/help/tutorials/building-a-store-locator-react/

Screenshot: `docs/benchmarks/screenshots/mapbox-store-locator.png`

Benchmark value:

- Store-locator UX is close to our institution outreach workflow.
- List cards and map points should be synchronized.
- The selected location should become the working object, not just a marker.

Apply to current dashboard:

- Add a selected institution card with sales status, contact status, phone, homepage, email confidence, and next action.
- Make the right panel detail-oriented after selection, not a permanently crowded mixed panel.

### Open User Map List View

Source: https://www.open-user-map.com/list-view/

Screenshot: `docs/benchmarks/screenshots/open-user-map-list.png`

Benchmark value:

- Long lists need pagination or virtualization.
- The list view should be a first-class mode, not a side effect of the map.

Apply to current dashboard:

- Add `목록/검수` mode for contact verification and email collection work.
- Use fixed-height scroll regions and pagination to prevent panel overlap.
- Keep bulk actions at the top or bottom sticky bar, not floating over cards.

### NSW School Finder

Source: https://schoolfinder.education.nsw.gov.au/

Screenshot: `docs/benchmarks/screenshots/nsw-school-finder.png`

Benchmark value:

- National or broad search can start with search and region selection before showing dense map detail.
- It reduces initial overload and forces the workflow into a narrower geography.

Apply to current dashboard:

- `전국` state should default to regional summary, not raw individual marker overload.
- The user should drill down by province/city before individual markers dominate.

### deck.gl ScreenGridLayer

Source: https://deck.gl/docs/api-reference/aggregation-layers/screen-grid-layer

Screenshot: `docs/benchmarks/screenshots/deckgl-screen-grid.png`

Benchmark value:

- Aggregated density layers communicate concentration without showing every point.
- Useful if Kakao clusterer remains slow with larger datasets.

Apply to current dashboard:

- Treat deck.gl-style grid as an optional later performance layer.
- For the immediate build, use a simpler static regional aggregation mode instead of adding a second map engine.

### Mapbox Cluster Example

Source: https://docs.mapbox.com/mapbox-gl-js/example/cluster/

Screenshot: `docs/benchmarks/screenshots/mapbox-cluster.png`

Benchmark value:

- Cluster styling can encode count and priority.
- Clicking a cluster can zoom into that region.

Apply to current dashboard:

- Keep cluster click as the only cluster-driven zoom.
- Regular filter changes should not auto-zoom unless the user clicks `지도에 맞추기`.

### TEA School District Locator

Source: https://tea.texas.gov/families-and-students/school-district-locator/school-district-locator

Screenshot: `docs/benchmarks/screenshots/tea-school-district-locator.png`

Benchmark value:

- Public-service locator pages often separate explanatory/search UI from the embedded locator.
- Not directly strong for our dashboard, but useful for search-first public sector data.

Apply to current dashboard:

- Do not copy its content-heavy public page structure.
- Keep this as a weak reference only.

### Mark-a-Spot Amsterdam

Source: https://demo.mark-a-spot.com/amsterdam

Screenshot: `docs/benchmarks/screenshots/mark-a-spot-amsterdam.png`

Benchmark value:

- Civic issue maps are relevant to status workflows, but this demo was less useful than the cluster/list references.

Apply to current dashboard:

- Keep the concept of status-coded records, not the full UI.

## Recommended Product Structure

### Mode Tabs

- `실지도`: Kakao real map with MarkerClusterer, entity list, selected institution detail drawer.
- `지역 요약`: static Korea regional canvas with province/city counts by institution type and priority; no panning lag.
- `목록/검수`: table/card list for email source verification, contact status, sales status, and bulk export.

### 실지도 Mode

- Top bar: institution type toggles, region selector, status selector, search, `지도에 맞추기`.
- Main canvas: Kakao map only, no fallback dot overlay.
- Marker strategy: cluster nationwide, expand only when zoomed in.
- List: independently scrollable institution cards, sorted by priority.
- Detail drawer: opens on card or marker click, showing contact and sales fields.

### 지역 요약 Mode

- Static Korea map or region grid, not a live Kakao map.
- Each province/city shows count, verified contacts, unverified contacts, high-priority institutions, and last collection date.
- Clicking a region sets the filter and switches to `실지도` only if the user chooses `지도에서 보기`.

### 목록/검수 Mode

- Fixed header with total counts and active filters.
- Table columns: institution name, type, region, phone, homepage, email status, source URL, outreach status, priority, next action.
- Right drawer for selected institution notes and source verification.
- Bulk actions: CSV export, mark verified, mark excluded, prepare campaign.

## Required Data Attributes

- `institution_name`
- `institution_type`
- `sido`
- `sigungu`
- `address`
- `lat`
- `lng`
- `phone`
- `homepage`
- `email`
- `email_status`: `missing`, `candidate`, `verified`, `excluded`, `bounced`
- `email_source_url`
- `source_dataset`
- `source_updated_at`
- `outreach_status`: `not_contacted`, `queued`, `sent`, `replied`, `meeting`, `ordered`, `excluded`
- `priority_score`
- `last_contacted_at`
- `next_action`
- `owner`
- `notes`

## Implementation Priorities

1. Remove fallback-dot overlay from `실지도` and make fallback/static dots a separate `지역 요약` mode.
2. Add Kakao MarkerClusterer and render clusters by default in national or high-density views.
3. Stop auto-fit on filter changes; only `전국 보기` or `지도에 맞추기` may call fitBounds.
4. Split the right panel into independent scroll sections or replace it with a selected-institution drawer.
5. Add `목록/검수` mode with pagination or virtual scrolling before adding more data sources.

## Replacement Assessment

- Full replacement with Mapbox is not recommended now because Kakao/VWorld/Korean coordinate workflows are already working and Kakao has native clustering.
- deck.gl is useful later if the dataset grows into tens of thousands of points, but it is unnecessary for the current 775-point dataset.
- The strongest immediate pattern is Kakao MarkerClusterer plus split-view list and a separate static regional summary.

## Oracle Review Summary

Review target:

- GitHub: https://github.com/kmw1wlog/5060_book
- Vercel: https://5060book.vercel.app/dashboard.html

Oracle verdict:

- Proposed IA: `PASS`
- Current implementation as an operational dashboard: `FAIL`
- Replacement with another map provider: not justified now

Oracle's priority order:

1. Stop treating filter changes as map-navigation commands. Only `전국 보기`, `지도에 맞추기`, and cluster clicks should move the camera.
2. Remove the fallback-dot layer from `실지도`; it belongs only in `지역 요약` or a real fallback state.
3. Use Kakao MarkerClusterer as the default nationwide rendering path.
4. Separate map exploration from contact operations.
5. Move long email/contact lists into `목록/검수`; the map rail should only show the selected institution's working record.
6. Replace the landing-page-style headline and KPI blocks with an operator command bar.
7. Refactor state around stable `selectedInstitutionId`, derived filtered views, preserved viewport, and debounced map events.

Oracle benchmark triage:

- Keep: Kakao MarkerClusterer, Baymard split view, Mapbox Store Locator as UX reference, Open User Map list view, NSW School Finder.
- Drop or demote: TEA School District Locator, Mark-a-Spot Amsterdam, Mapbox cluster example, deck.gl ScreenGridLayer.

Oracle replacement decision:

- Keep Kakao because the current stack already depends on Kakao, VWorld, Korean public datasets, and Supabase.
- Replace only if the product later needs tens of thousands of points, custom vector-tile styling, heavy WebGL aggregation, non-Korea expansion, or Kakao licensing constraints.
