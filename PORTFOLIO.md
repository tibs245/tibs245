# Portfolio — development, checks and publication

The French portfolio lives in `docs/` and is published at **https://tibs245.github.io/tibs245/**. It is a static HTML/CSS/JavaScript page: no runtime dependencies, build service, form backend, analytics or third-party font requests. The GitHub profile remains in the root README.

## Local preview

Use Node.js 22.19+ (Node 22 LTS is used in CI):

```sh
npm ci --ignore-scripts
npm run serve
```

Open http://127.0.0.1:4174/tibs245/. This reproduces the project subdirectory used by Pages. `docs/` can also be served by any static HTTP server.

## Validation

```sh
npm run check
npm run audit
```

`check` validates HTML, JavaScript syntax, local asset paths, anchors, unique IDs, the primary heading, French language, canonical URL, sitemap, structured data and a 400 kB total asset budget (including the social card and font licenses).

`audit` requires Chrome/Chromium. Set `CHROME_PATH` if it is not automatically detected. It starts an isolated local server, runs Lighthouse three times for mobile and desktop, writes HTML/JSON reports in `reports/`, then shuts the server down. It fails below 95 in median performance (three runs per device preset) or below 100 in accessibility, best practices or SEO on any run. All individual results are kept; a runtime error is always a failure. The median reduces shared-runner noise without lowering the performance threshold. npm packages are development tools only; deploy only `docs/`.

## Audit — 24 October 2026

Lighthouse 13.5.0, local HTTP, simulated mobile throttling and desktop preset:

| Category | Mobile | Desktop |
| --- | --- | --- |
| Performance | 99 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |

Mobile LCP approximately 2.0 seconds. These are laboratory measurements on the local page, not field measurements of GitHub Pages. Scores may vary with hardware and hosting. CI preserves reports as downloadable artifacts.

Corrections made during the audit:

- Raised secondary-text contrast to meet the automated WCAG AA checks, including dates, labels and footer text.
- Verified the skip link transfers keyboard focus into main content and the next Tab reaches the main action. Focus indicators are visible; decorative symbols are hidden from assistive technology.
- Removed the continuous decorative animation. Motion preferences are respected, including changes during a session. Keyboard focus reveals an animated section immediately. Content remains readable when JavaScript is absent.
- Updated canonical, Open Graph, social image, JSON-LD and sitemap URLs for the actual GitHub Pages project path. Added social-image alternative text.
- Kept fonts local, fixed image dimensions, deferred the small enhancement script and removed abandoned portrait assets/styles.
- Added a restrictive Content Security Policy and referrer policy. No third-party scripts, trackers or runtime packages. `npm install` reported no known dependency vulnerabilities at audit time.
- Checked rendered image loading, browser console errors and horizontal overflow at the browser's narrow viewport.

Automated checks do not constitute a complete accessibility certification. A screen-reader user test, the full keyboard journey at every viewport/zoom level and real-device testing remain useful. No claim is made about search ranking, rich-result eligibility or Core Web Vitals in the field.

## GitHub Pages

`.github/workflows/portfolio.yml` runs validation and mobile/desktop Lighthouse audits on pull requests and on `main`. Only a successful run on `main` can deploy; pull requests cannot publish. The deployment uploads **only `docs/`**, with minimal permissions and the `github-pages` environment. The local Sites sandbox, screenshots, archives and `.openai` metadata are excluded.

The repository's Pages publishing source must be **GitHub Actions** (`build_type: workflow`). Once configured, merge the portfolio PR to trigger the first deployment. Later pushes to `main` run the same checks before publication. A manual workflow dispatch from `main` can republish the current version. Deployments use GitHub's HTTPS Pages origin.

If moving to a custom domain, update canonical, Open Graph, structured-data, robots/sitemap URLs and the URL checks in `scripts/check-site.mjs` together. For a project site, `docs/robots.txt` is served under `/tibs245/`; robots exclusion rules are only authoritative at the origin root. The page is indexable without custom robots rules.

Font licensing is preserved in `docs/assets/FONT-LICENSES.txt`. MyGameMaster's mark and palette come from the user's own project. Its map illustration is original portfolio artwork, not a screenshot of the application.

## Personal portrait

`docs/assets/thibault-barske-cutout.webp` is a transparent cutout prepared with the built-in ImageGen tool from the author’s supplied photo, optimized to 576 × 864 pixels (approximately 55 kB). The portfolio uses CSS for horizontal mirroring, subtle tint and a fade restricted to the body; the face stays clear above the copy with the same reserved space at each breakpoint. No rectangular backdrop or external image service is used. The header contact link uses the primary blue CTA treatment with visible keyboard focus.
