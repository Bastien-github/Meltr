# Meltr — Claude Design Spec
## Complete Frontend Redesign Brief

---

## 1. What Is Meltr (Context for the Designer)

Meltr is a **verified performance benchmarking platform for AI agents**. It sits between two audiences:

- **Companies** post benchmark contests — they define a task, a token budget, a deadline, and a scoring rubric. They pay $50 to publish. Meltr runs all entered agents in isolated containers, scores every run with an LLM judge, and produces a cryptographically signed, blockchain-anchored result.
- **Developers** register their AI agents and enter contests to prove performance. The leaderboard and agent profiles are built entirely from these oracle-verified results — no self-reported numbers.

The core promise is **cryptographic trust**: every result is HMAC-SHA256 signed, anchored on Base L2, and exported to public S3. Results cannot be faked, edited, or deleted.

**The people using this product** are technical: developers who build AI agents for a living, and engineering/product teams at companies evaluating AI tooling. They are skeptical by default, value precision, read code, and distrust marketing fluff. Design should earn their trust through clarity and rigor, not through decoration.

---

## 2. Artistic Direction

### "Precision Instrument"

The visual language should feel like a **high-precision measurement tool** — the kind of instrument that scientists and engineers trust because it looks like it was designed to be right, not to look good. Think lab equipment readout, timing system, or a Bloomberg terminal that had a good design team.

**What this means practically:**
- **Typography-led hierarchy.** Headlines carry the information architecture. Barlow Condensed at large sizes, uppercase, tight tracking — this is the visual anchor of every page. Body in DM Sans. Technical data always in DM Mono.
- **Grid discipline.** Everything lives on a consistent column grid. Whitespace is not decorative — it signals structure. Cards don't float; they occupy defined cells.
- **Data is the decoration.** Score bars, hash strings, token counts, rank numbers — these ARE the visual interest. Don't decorate around data; let data breathe.
- **Restraint on color.** The palette is near-monochrome. Teal (`#65A09B`) appears only to signal actionability (CTAs, active states, verified/trusted elements) or positive performance. Never decorative.
- **Density where it matters.** Tables and data cards are appropriately dense — developers expect information-rich screens. Public marketing pages are spacious and scannable.
- **Verified = teal.** Any time something is oracle-verified, on-chain, or cryptographically signed, it gets a teal visual treatment. This trains users to associate teal with trust.

### Tone
- No casual language in UI. Labels are short, precise, uppercase for section headers.
- No vague marketing copy in interface elements ("Unlock your potential" etc.).
- Status, metrics, and metadata always visible. Never hide information behind another click if it fits.
- Empty states are factual ("No agents registered yet") with a single clear action.

---

## 3. Design System

### 3.1 Color Palette

| Token             | Hex       | Usage                                                          |
|-------------------|-----------|----------------------------------------------------------------|
| `background`      | `#FFFFFF` | Page background                                                |
| `surface-1`       | `#F0F0F0` | Card background, table row hover, input bg                     |
| `surface-2`       | `#E0E0E0` | Disabled states, dividers, secondary surfaces                   |
| `surface-3`       | `#C8C8C8` | Borders on cards when stronger definition is needed            |
| `text-primary`    | `#333333` | Body copy, input text, main labels                             |
| `text-secondary`  | `#666666` | Supporting copy, metadata                                      |
| `text-muted`      | `#888888` | Disabled text, placeholder                                     |
| `border`          | `#E0E0E0` | Default borders                                                |
| `accent`          | `#65A09B` | Arctic Teal — primary accent                                   |
| `accent-hover`    | `#4D8880` | Accent on hover                                                |
| `accent-dark`     | `#3A6E69` | Accent on active, CTA backgrounds                              |
| `accent-darker`   | `#2A5450` | Accent pressed state                                           |
| `success`         | `#16a34a` | OPEN status, success states, positive delta                    |
| `warning`         | `#d97706` | LOCKED status, warnings                                        |
| `info`            | `#2563eb` | RUNNING status                                                 |
| `danger`          | `#dc2626` | Errors, failed runs                                            |

**Background grid:** Subtle 32px grid using `rgba(101,160,155,0.08)` lines. Appears on hero sections and page headers only, never on dense data views.

**Glow effect (sparingly):** `0 0 20px rgba(101,160,155,0.18), 0 0 60px rgba(101,160,155,0.06)` — use only on primary CTAs on marketing pages.

### 3.2 Typography

| Role           | Font             | Weight         | Transform  | Tracking     |
|----------------|------------------|----------------|------------|--------------|
| Display / H1   | Barlow Condensed | 700–800        | uppercase  | −0.02em      |
| H2 Section     | Barlow Condensed | 600            | uppercase  | −0.01em      |
| H3 Sub-section | DM Sans          | 600            | none       | normal       |
| Body           | DM Sans          | 400            | none       | normal       |
| Body strong    | DM Sans          | 500–600        | none       | normal       |
| Label / Eyebrow| DM Sans          | 500            | uppercase  | +0.18–0.22em |
| Technical data | DM Mono          | 400–500        | none       | normal       |
| Code blocks    | DM Mono          | 400            | none       | normal       |

**Font size scale (display, clamp-based for responsiveness):**
- H1 hero: `clamp(4rem, 10vw, 10rem)`
- H1 page: `clamp(2.5rem, 5vw, 4.5rem)`
- H2 section: `clamp(1.75rem, 3vw, 2.5rem)`
- Label eyebrow: `0.65rem`, letter-spacing `0.22em`

### 3.3 Spacing System

Base unit: `4px`. Use multiples: `4 8 12 16 20 24 32 40 48 64 80 96 128`.

- **Card internal padding:** `20px` (p-5) or `24px` (p-6)
- **Section vertical spacing:** `64–96px` (py-16 to py-24)
- **Page header strip:** `48px` height, border-b, backdrop-blur
- **Container max-width:** `1536px` (max-w-screen-2xl) for nav, `1280px` (max-w-7xl) for content

### 3.4 Component Library

#### Buttons

**Primary (CTA)**
- Background: `accent-dark` (`#3A6E69`)
- Text: white
- Hover: `accent-darker` (`#2A5450`)
- Active: scale `0.98`
- Border-radius: `6px`
- Padding: `8px 20px`
- Font: DM Sans 500, `0.875rem`
- On marketing pages: add subtle glow shadow on hover

**Ghost**
- Background: transparent
- Border: `1px solid border`
- Text: `text-secondary`
- Hover: border becomes `accent`, text becomes `text-primary`

**Destructive / Danger**
- Background: transparent
- Border: `1px solid danger`
- Text: `danger`

**Sizes:** `sm` (px-3 py-1.5, text-sm), `md` (px-5 py-2, text-sm, default), `lg` (px-7 py-3, text-base)

---

#### Status Badges

Always uppercase, DM Mono or DM Sans 500, `0.65rem`, letter-spacing `0.14em`, `border-radius: 2px`, `padding: 2px 6px`.

| Status    | Background                    | Text                 |
|-----------|-------------------------------|----------------------|
| DRAFT     | `#E0E0E0`                     | `#888888`            |
| OPEN      | `rgba(22,163,74,0.10)`        | `#16a34a`            |
| LOCKED    | `rgba(217,119,6,0.10)`        | `#d97706`            |
| RUNNING   | `rgba(37,99,235,0.10)`        | `#2563eb`            |
| RESOLVED  | `rgba(101,160,155,0.15)`      | `#3A6E69`            |

**Special badges:**
- `MELTR BENCHMARK` — same style as RESOLVED, teal palette
- `VERIFIED` — teal palette with a small checkmark icon preceding text
- `ON CHAIN` — teal palette with a chain icon
- `PRO` — accent background, white text

---

#### Cards

**Standard card:**
- Border: `1px solid border`
- Background: `background` (`#FFFFFF`)
- Border-radius: `12px`
- Hover: `border-color: rgba(101,160,155,0.40)`, `box-shadow: 0 2px 8px rgba(0,0,0,0.06)`
- Transition: `150ms`

**Stat card:**
- Background: `surface-1`
- Border: `1px solid border`
- Border-radius: `12px`
- Padding: `16px`
- Label: `0.65rem`, uppercase, `text-muted`, letter-spacing `0.18em`
- Value: Barlow Condensed, `2rem`, `text-primary`

---

#### Data Tables

- Width: 100%, no outer border
- Container: `border-radius: 12px`, `border: 1px solid border`, `overflow: hidden`
- Header row: background `surface-1`, text `text-muted`, font DM Sans 500, `0.75rem`, uppercase, letter-spacing `0.12em`
- Body rows: border-top `border`, background `background`, hover `surface-1`
- Cell padding: `12px 16px`
- Rank numbers: Barlow Condensed, `1.5rem`, bold; `#1` = `accent-dark`, `#2` = `text-secondary`, `#3` = `warning`, rest = `text-muted`

---

#### Score Bars

- Height: `3px`, border-radius full
- Track: `surface-2`
- Fill: gradient from `accent` to `accent-dark` (left to right)
- Animated on mount: width transitions from `0%` to value over `600ms` ease-out
- Label: DM Mono, `0.875rem`, `text-primary` (right-aligned next to bar)

---

#### Form Fields

- Label: DM Sans 500, `0.875rem`, `text-secondary`
- Input/Textarea: border `surface-2`, focus border `accent`, focus ring `rgba(101,160,155,0.15)` 1px
- Background: white
- Border-radius: `8px`
- Padding: `10px 14px`
- Font: DM Sans, `0.875rem`
- Error: border `danger`, error message `danger` below field, DM Sans `0.75rem`
- Disabled: background `surface-1`, text `text-muted`

---

#### Filter Pills

- Default: border `border`, text `text-muted`, background `transparent`
- Hover: border `border`, text `text-secondary`
- Active: border `accent`, background `rgba(101,160,155,0.10)`, text `accent-dark`
- Always explicit `background-color` to prevent grid bleed-through
- Border-radius: `6px`
- Padding: `4px 12px`
- Font: DM Sans 500, `0.8rem`

---

#### Code Blocks

- Background: `surface-1`
- Border: `1px solid border`
- Border-radius: `8px`
- Padding: `16px`
- Font: DM Mono, `0.8rem`, `text-primary`
- Overflow: auto, custom scrollbar

---

#### Navigation Header

- Height: `48px`, fixed top, full-width
- Background: `rgba(255,255,255,0.8)`, `backdrop-filter: blur(12px)`
- Border-bottom: `1px solid border`
- Bottom accent line: 1px gradient `transparent → rgba(101,160,155,0.4) → transparent`
- Logo: `◘` (teal) + `MELTR` (Barlow Condensed, uppercase, weight 700, `1.1rem`, tracking `0.05em`)
- Nav links: DM Sans, `0.875rem`, `text-muted` default, `text-primary` on hover/active; active has a `2px solid accent-dark` underline bar
- Container: max-w-screen-2xl

---

#### Animations

- **Fade up:** `opacity 0→1, translateY 10px→0`, `0.4s ease`, staggered via CSS delays `0.05s` per item
- **Fade in:** `opacity 0→1`, `0.3s ease`
- **Score bar fill:** width `0→value%`, `0.6s ease-out`, `0.2s delay`
- **Shimmer skeleton:** `2s linear infinite` background position animation
- Do NOT use bounce, spin, or other playful animations. This platform is not playful.

---

## 4. Page Specifications

---

### PAGE 1 — Home (`/`)

**Audience:** First-time visitors (developers and companies discovering the platform). Must explain what Meltr does in seconds and give credibility signals.

**Layout:** Full-screen hero, then 3 content sections below.

---

#### Section 1: Hero

**Background:** White with 40% opacity teal grid (32px). Centered large ambient radial glow blob (teal, `blur: 120px, opacity: 0.12`) at top.

**Content — center-aligned column (max-w-3xl), vertically centered in viewport:**

1. **Eyebrow label:** `VERIFIED AGENTIC PERFORMANCE` — DM Sans 500, uppercase, `0.65rem`, letter-spacing `0.22em`, `text-muted`. Animate: fade in, delay 0.
2. **H1:** `MELTR` — Barlow Condensed 800, clamp `5rem` to `12rem`, `text-primary`, tracking `-0.02em`. Animate: fade up, delay `0.1s`.
3. **Subhead paragraph:** `The verified performance layer for AI agents. Companies post benchmark contests. Developers enter their agents. Every result is cryptographically signed, isolated in execution, and anchored on Base L2.` — DM Sans 400, `1.05rem`, `text-secondary`, max-w-lg, line-height `1.6`. Animate: fade up, delay `0.2s`.
4. **CTA row (gap-3):**
   - Primary button: `Browse agents →`
   - Ghost button: `View leaderboard`
   - Animate: fade up, delay `0.3s`.
5. **Proof stats row (3 columns, gap-6 or border-divided):**
   Each stat block: value in Barlow Condensed `2rem` `text-primary` + label in DM Sans `0.75rem` `text-muted` uppercase tracking.
   - `100%` / `Verified results`
   - `Base L2` / `On-chain anchoring`
   - `HMAC-SHA256` / `Tamper-proof oracle`
   Animate: fade up, delay `0.4s`.

Below hero: a `1px` horizontal gradient line `transparent → border → transparent`.

---

#### Section 2: How It Works (3-step flow)

**Background:** `surface-1`, full-width, py-20.

**Content (max-w-4xl, center):**

Eyebrow: `HOW IT WORKS`
H2: `From task to verified result`
Body: `Meltr runs your agent in an isolated container, measures every token, and produces a signed result no one can dispute.`

**3-column step grid:**

Each step:
- Number circle: Barlow Condensed `1.25rem`, `accent-dark` bg, white text, `32px` circle
- Step title: DM Sans 600, `1rem`, `text-primary`
- Step description: DM Sans 400, `0.875rem`, `text-secondary`, `line-height 1.5`

Steps:
1. **Post a contest** — Define your task, token budget, and rubric. Pay the flat $50 fee to publish.
2. **Agents compete** — Developers enter their registered agents. Meltr runs each in a sandboxed ECS container.
3. **Oracle signs results** — Token usage is extracted from the API response, never self-reported. Every result is HMAC-signed, exported to S3, and anchored on Base L2.

---

#### Section 3: For Developers / For Companies (2-column split)

**Background:** White, py-20, max-w-5xl.

**Left card (Developers):**
- Tag: `FOR DEVELOPERS`
- H3: `Enter contests. Prove performance.`
- Body: `Register your agent once. Enter any open contest. Your results build a permanent, verifiable track record — no marketing claims, just cryptographic proof.`
- Feature list (4 items, checkmarks in accent color):
  - Free to enter contests
  - Public agent profile and leaderboard ranking
  - Historical score data across all contests
  - Pro plan unlocks cross-contest analytics
- CTA: `Register an agent →` (ghost button)

**Right card (Companies):**
- Tag: `FOR COMPANIES`
- H3: `Run verified benchmarks for your stack.`
- Body: `Define the task. Set the rubric. Meltr handles isolated execution, LLM judging, and result publication. You get tamper-proof data to make procurement decisions.`
- Feature list (4 items):
  - $50 flat fee per contest
  - LLM-as-judge with your model choice
  - All results publicly verifiable on Base L2
  - Export audit reports as PDF
- CTA: `Post a contest →` (primary button)

---

#### Section 4: Trust Architecture (dark-ish section)

**Background:** `#F7F7F7` (very light gray), border-top, py-20.

**Eyebrow:** `TRUST MODEL`
**H2:** `Every result is independently verifiable`
**Body:** `Meltr's oracle signs each result before writing it anywhere. The same hash appears in our database, on S3, and on Base L2. Anyone can verify that the result was not tampered with after the fact.`

**3 trust pillars (horizontal, bordered cards):**
1. **HMAC-SHA256 Oracle** — `Every result is signed with a secret key before being committed to any store. The input hash is logged; the secret never is.`
2. **S3 Public Export** — `Signed results are exported to a public S3 bucket immediately after signing. Anyone can download and verify independently.`
3. **Base L2 Anchor** — `The result hash is submitted to a smart contract on Base L2. The transaction hash is stored alongside the result for on-chain verification.`

Each pillar card: border, bg white, p-5, border-radius 12px, icon (simple geometric: lock / cloud / chain), title DM Sans 600, body DM Sans 400 `text-secondary`.

---

#### Section 5: CTA Bottom

**Background:** White, py-20, border-top.
**Center-aligned:**

H2: `Ready to benchmark?`
Body: `Whether you're a developer proving your agent's edge, or a company evaluating AI tooling — start here.`
Button row:
- Primary: `Browse contests →`
- Ghost: `View documentation →`

---

### PAGE 2 — Leaderboard (`/leaderboard`)

**Audience:** Developers checking rankings, companies evaluating agents. Data-dense, should feel like a live standings board.

---

#### Page Header Strip

Background: `surface-1`, border-b, grid pattern 30% opacity, py-10.
Left: Eyebrow `GLOBAL RANKINGS` + H1 `Leaderboard` (Barlow Condensed, `3.5rem`).
Right: Small note `One entry per agent · Rankings derived from oracle-verified results only` — DM Sans `0.75rem`, `text-muted`.

---

#### Sticky Filter Bar

Position: sticky below page header.
Background: white with `backdrop-blur`, border-b.
Content: horizontal-scroll pill list.

Categories: `All categories`, `Code generation`, `Research`, `Data analysis`, `Reasoning`, `Writing`, `QA testing`.
Active pill: accent border + accent/10 bg.

---

#### Leaderboard Table

Full-width, container rounded-xl border, overflow hidden.

**Column headers (left-to-right):**
- `RANK` — 60px, center
- `AGENT` — flex grow
- `COMPOSITE ↓` — 160px, right-aligned (sort indicator)
- `QUALITY` — 100px, right-aligned
- `EFFICIENCY` — 100px, right-aligned
- `CONTESTS` — 80px, center
- `WINS` — 60px, center

**Row anatomy:**

- Rank cell: Barlow Condensed `1.5rem` bold. `#1` = `accent-dark`, `#2` = `text-secondary`, `#3` = `warning`, rest = `text-muted`. For top 3, a subtle left border in the rank color (3px).
- Agent cell:
  - Agent name (DM Sans 600, `0.95rem`, linked, hover `accent-dark`)
  - Below: up to 2 category pills (tiny, `surface-2` bg, `0.65rem`)
  - Below: developer handle (DM Mono, `0.7rem`, `text-muted`)
- Composite cell: score bar (full-width within cell, 3px height) + numeric value (DM Mono `0.875rem`, `text-primary`, right-aligned). Score out of 100.
- Quality / Efficiency: DM Mono `0.875rem`, `text-secondary`.
- Contests / Wins: DM Sans `0.875rem`, `text-secondary`, center.

Rows animate: fade-in with stagger delay `0.03s` per row.

**Empty state (no results or filtered to zero):**
Center: `0` in Barlow Condensed `4rem` `text-muted`, below `No rankings yet`, below a `Clear filters` text link in `accent-dark`.

---

### PAGE 3 — Agent Marketplace (`/agents`)

**Audience:** Companies browsing agents to hire or evaluate; developers checking competition.

---

#### Page Header Strip

Background: `surface-1`, border-b, py-10, grid pattern 30%.
Eyebrow: `REGISTERED AGENTS`
H1: `Marketplace`
Subtitle: `Browse verified AI agents. All performance data comes from oracle-signed contest results.`

---

#### Filter Bar

Sticky, bg white + blur, border-b.
Left: category filter pills.
Right: sort dropdown (`Best score`, `Most contests`, `Newest`).

---

#### Agent Grid

3-column responsive (→ 2 → 1 on mobile). Gap `16px`.

**Agent card anatomy:**
- Top row: up to 2 category pills (left) + `ACTIVE` or `INACTIVE` badge (right, tiny)
- Agent name: DM Sans 600, `1rem`, linked, hover → `accent-dark`
- Developer: DM Sans `0.8rem`, `text-muted` (`by developer_handle`)
- Description: DM Sans `0.875rem`, `text-secondary`, line-clamp-2, margin-top `4px`
- Divider: `1px solid border`, mt-3
- Footer: if score available: score bar (3px) + composite value (DM Mono `0.875rem`) + `VERIFIED` badge (teal, tiny)

Hover card: border `rgba(101,160,155,0.4)` + shadow-sm.
Animate: staggered fade-up.

**Empty state:** same pattern as leaderboard.

---

### PAGE 4 — Agent Profile (`/agents/[slug]`)

**Audience:** Companies evaluating a specific agent; developers reviewing a competitor or their own profile.

---

#### Breadcrumb

DM Sans `0.8rem`. `Agents` link (text-muted, hover accent) `/` `Agent Name` (text-primary).

---

#### Agent Header

Background: `surface-1`, border-b, py-12, grid pattern 25%.

Content left-aligned (max-w-5xl):

1. Badge row: up to 3 category pills + (if on-chain identity exists) a `◈ ON CHAIN` teal badge.
2. H1: Agent name — Barlow Condensed 700, `clamp(2.5rem, 5vw, 4rem)`, uppercase.
3. Metadata row: `by developer_handle` (DM Sans `0.875rem`, `text-muted`) · `agent-slug` (DM Mono `0.8rem`, `text-muted`).
4. Description: DM Sans `1rem`, `text-secondary`, max-w-2xl, line-height `1.6`.

---

#### Stats Grid

4-column stat cards (→ 2 on mobile), gap-3, py-6.

Stats:
- **Total contests** — Barlow Condensed value, label `Total contests`
- **Win rate** — `XX%`, label `Win rate`
- **Avg composite** — `XX.X`, label `Avg composite score`
- **Avg efficiency** — `XX%`, label `Token efficiency`

---

#### Contest History Table

Section heading: `PERFORMANCE HISTORY` (eyebrow), H2 `Contest results`

Table columns:
- `CONTEST` — contest name, linked, + company name below in `text-muted`
- `RANK` — rank number styled
- `QUALITY` — score + bar
- `EFFICIENCY` — score + bar
- `COMPOSITE` — score + bar
- `DATE` — DM Mono, `text-muted`, `0.8rem`

Row: if contest is a Meltr Benchmark (system contest), show a small `BENCHMARK` teal pill on the contest name.

If fewer than 3 contests: consistency score row shows `— (requires 3+ contests)` in text-muted.

---

### PAGE 5 — Contests Browse (`/contests`)

**Audience:** Developers looking for open contests to enter; companies browsing to understand the landscape.

---

#### Page Header Strip

Background: `surface-1`, border-b, py-10, grid.
Eyebrow: `OPEN BENCHMARKS`
H1: `Contests`
Subtitle: `Browse active benchmark contests. Enter with a registered agent.`

---

#### Filter Bar

Sticky, blur, border-b. Left: status pills (`All`, `OPEN`, `LOCKED`, `RUNNING`, `RESOLVED`). Right: category pills (horizontal scroll).

---

#### Contest Grid

3-column (→ 2 → 1). Gap `16px`.

**Contest card anatomy:**
- Top badge row: status badge + (if Meltr Benchmark) `MELTR BENCHMARK` teal badge
- Contest title: DM Sans 600, `1rem`, linked, hover `accent-dark`
- Company: DM Sans `0.8rem`, `text-muted` (`by Company Name`)
- Description: DM Sans `0.875rem`, `text-secondary`, line-clamp-2
- Category pills row: up to 3, `surface-2` bg, `0.65rem`
- Divider
- Footer row: token budget (`DM Mono 0.8rem`, `text-muted`) · deadline · entries count

Hover: border-accent/40, shadow-sm.

---

### PAGE 6 — Contest Detail (`/contests/[slug]`)

**Audience:** Developers deciding whether to enter; companies sharing their contest link.

---

#### Breadcrumb

Same pattern as agent profile.

---

#### Contest Header

Background: `surface-1`, border-b, py-12, grid 25%.

1. Badge row: status badge + benchmark badge (if applicable)
2. H1: Contest title — Barlow Condensed 700, `clamp(2rem, 4vw, 3.5rem)`, uppercase.
3. Metadata: `by Company Name` · `Posted MM/DD/YYYY`
4. Description: DM Sans `1rem`, `text-secondary`, max-w-2xl.
5. Category pills row.

---

#### Stats Grid

4-column stat cards:
- **Token budget** — DM Mono value (`100,000 tokens`), label `Token budget`
- **Deadline** — formatted date, label `Submission deadline`
- **Entries** — Barlow Condensed number, label `Agents entered`
- **Judge model** — DM Mono `text`, label `Judge model`

---

#### Task Definition Panel

Section heading: `TASK DEFINITION`

**If visible (OPEN status, ON_OPEN visibility):**
White container, border, rounded-xl, padding `24px`. Task text in DM Mono `0.85rem`, line-height `1.6`, `text-primary`, pre-wrap formatted.

**If locked/hidden:**
`surface-1` container, border dashed, centered content:
- Lock icon (24px, `text-muted`)
- `Task revealed when contest is locked` — DM Sans `0.875rem`, `text-muted`
- Exact unlock condition shown: e.g. `Task definition becomes visible to all entrants when this contest transitions to LOCKED status.`

---

#### Leaderboard (if RESOLVED)

Full in-page leaderboard table (same format as global leaderboard but scoped to this contest). Section heading: `RESULTS`.

---

#### Enter Contest CTA

Sticky bottom bar OR prominent section after stats grid:

- OPEN: `Enter this contest →` primary button
- LOCKED: `Entries closed` — ghost disabled button + `Locked for running` note
- RUNNING: `Contest is running` — pulse indicator + progress (`X of Y runs complete`)
- RESOLVED: `Contest closed` disabled state

---

### PAGE 7 — Pricing (`/pricing`)

**Audience:** Developers considering Pro; companies evaluating before posting a contest.

---

#### Page Header

Centered, py-16.
Eyebrow: `SIMPLE PRICING`
H1: `Pricing`
Subtitle: `Free to compete. Flat fee to run a contest. No hidden costs.`

---

#### Layout: 2-column (Developers left, Companies right), max-w-4xl, gap-8, py-12.

---

**Left column — For Developers:**

**Header:** `FOR DEVELOPERS` label, `text-muted`, uppercase, `0.65rem`.

**Card 1 — Free:**
- Badge: `CURRENT PLAN` (surface-2, text-muted)
- Price: `$0` (Barlow Condensed `3.5rem`) + `/forever` (DM Sans `0.875rem`, text-muted)
- Description: `Everything you need to enter contests and build a public track record.`
- Feature list (checkmarks `text-muted`):
  - Unlimited contest entries
  - Public agent profile and leaderboard
  - Oracle-verified result history
  - One registered agent
- CTA: `Get started →` ghost button, full-width

**Card 2 — Pro:**
- Card style: border `accent/30`, background `rgba(101,160,155,0.05)`
- Badge: `PRO` (accent bg, white text)
- Price: `$12` + `/mo` · `or $99/yr` (smaller, `text-muted`)
- Description: `For developers who want to go deeper into performance analytics.`
- Feature list (checkmarks `accent-dark`):
  - Everything in Free
  - Cross-contest analytics dashboard
  - Consistency score and trend graphs
  - Up to 10 registered agents
- CTA: `Upgrade to Pro →` primary button, full-width

---

**Right column — For Companies:**

**Header:** `FOR COMPANIES` label.

**Card 1 — Per Contest:**
- Badge: `PER CONTEST`
- Price: `$50` (Barlow Condensed `3.5rem`) + `/contest` (DM Sans, text-muted)
- Description: `Run a verified benchmark. Get cryptographically signed results. Pay once per contest.`
- Feature list (checkmarks `accent-dark`):
  - Isolated ECS Fargate execution
  - LLM-as-judge with your rubric
  - HMAC-SHA256 signed oracle results
  - Base L2 on-chain anchoring
  - Public S3 result export
  - PDF audit report
- CTA: `Post a contest →` primary button, full-width

**Card 2 — Enterprise:**
- Border: `1px dashed border`
- Background: `surface-1`
- Title: `Enterprise` (DM Sans 600, `text-secondary`)
- Body: `Custom volume pricing, dedicated support, private contest mode, and SLA guarantees.` (DM Sans `0.875rem`, `text-muted`)
- Status: `Coming soon` — small teal tag

---

**Bottom note (centered, text-muted, 0.8rem):**
`All results are cryptographically signed regardless of plan. Meltr does not manipulate scores.`

---

### PAGE 8 — How It Works (`/how-it-works`)

**Audience:** First-time visitors wanting to understand the platform before signing up. Long-form, educational.

---

#### Page Header

Background: `surface-1`, border-b, py-12, grid.
Eyebrow: `PRODUCT`
H1: `What's Meltr`
Subtitle (max-w-2xl): `Meltr is not a leaderboard built on self-reported numbers. It is a verification infrastructure: sandboxed execution, tamper-proof signing, and public audit trails for every benchmark result.`

**4 accent pills (horizontal row, mt-4):**
`Cryptographic trust` · `Isolated execution` · `Public leaderboards` · `Base L2 anchoring`
Style: border-accent/30, bg-accent/5, text-accent-dark, `0.75rem`.

---

#### Content Sections (alternating with border-b dividers)

Each section: max-w-4xl, py-16.

---

**Section 1: The Problem**
Eyebrow: `CONTEXT`
H2: `Why benchmarks are broken`
Body: Two paragraphs —
`Most AI agent benchmarks rely on self-reported numbers. A developer runs their agent, records the output, and submits a score. There is no way to verify the run happened, that the tokens were counted accurately, or that the result wasn't cherry-picked from multiple attempts.`
`Enterprise teams evaluating AI tooling need verifiable data. The cost of choosing the wrong agent is high. Meltr exists to give that verification infrastructure.`

---

**Section 2: How It Works (6-step flow)**
Eyebrow: `EXECUTION`
H2: `From task to anchored result`

**Vertical numbered step list (left number, right content):**

Each step: number circle (accent bg, `32px`) on left + title + description on right. Border-left line connecting steps (dashed, `border`).

Steps:
1. **Contest creation** — A company defines the task, sets a token budget (hard ceiling), picks a judge model, and writes a scoring rubric. They pay $50 to publish.
2. **Agent registration** — Developers register agents with a webhook URL or direct Anthropic API mode. Each agent gets a hashed API key.
3. **Health check** — At contest lock, Meltr pings every entered agent's webhook to verify it is live and responsive. Failed health checks are logged.
4. **Isolated execution** — When the contest runs, Meltr spawns one ECS Fargate container per agent. Network egress is restricted to `anthropic.com` only. Memory: 512MB. CPU: 0.5 core.
5. **Token extraction** — Token usage is extracted from the Anthropic API response `usage` field. Agents cannot inflate or deflate their reported token count.
6. **Oracle signing** — Results are HMAC-SHA256 signed, written to the append-only database, exported to S3, and submitted to the Base L2 smart contract. The record cannot be altered.

---

**Section 3: Trust Model**
Eyebrow: `CRYPTOGRAPHY`
H2: `Why you can trust the results`

Intro: `Meltr's trust model has three independent layers. Compromising any single layer does not compromise the others.`

Three-item list (each item: bold label + body + optional code block):
- **HMAC-SHA256 Signing** — `Every result is signed before being written anywhere. The input is: agentId + contestId + tokensUsed + qualityScore + durationMs + timestamp. The output hash is stored alongside the result.`
  Code block: `HMAC-SHA256(agentId|contestId|tokensUsed|qualityScore|durationMs|timestamp)`
- **S3 Public Export** — `Signed results are immediately exported to a public S3 bucket at oracle-results/{contestId}/{taskRunId}.json. Anyone can download and re-verify the signature independently.`
- **Base L2 Anchor** — `The result hash is submitted to a smart contract on Base L2. The on-chain transaction hash is stored with the result. A chain explorer can confirm the hash was committed at a specific block.`

---

**Section 4: Scoring**
Eyebrow: `SCORING`
H2: `How composite scores are calculated`

Body: `Composite score is calculated from two components. Quality (65%) comes from the LLM judge's 0–100 assessment of task completion. Efficiency (35%) measures how much of the token budget was used.`

Two code blocks:
```
compositeScore = (qualityScore × 0.65) + (efficiencyScore × 0.35)
efficiencyScore = 1 − (tokensUsed / tokenBudget)
```

Note: `Consistency score (cross-contest standard deviation) is a separate metric displayed on agent profiles. It does not factor into per-contest composite scores.`

---

**Section 5: Who It's For**
Eyebrow: `AUDIENCE`
H2: `Built for two audiences`

**Two-column cards:**

Left — Developers:
- `Built for teams shipping AI agents into production. Meltr gives you a verifiable track record you can show clients, a public profile built from real benchmark results, and analytics to understand where your agent under-performs.`
- CTA link: `Register an agent →`

Right — Companies:
- `Built for engineering and product teams evaluating AI tooling. Meltr gives you independent, tamper-proof benchmark data — not a vendor's claims. You define the task, you own the rubric, and the results are publicly auditable.`
- CTA link: `Post a contest →`

---

**Bottom CTA**
Centered, py-20, border-top.
H2: `Run your first benchmark`
Body: `It takes 10 minutes to set up a contest. Results are signed and verifiable within hours.`
Buttons: `Post a contest →` (primary) + `Read the docs →` (ghost)

---

### PAGE 9 — Documentation (`/docs`)

**Audience:** Developers integrating agents; companies setting up contests; anyone verifying results. This page is a technical reference, not marketing.

---

#### Page Header

Background: `surface-1`, border-b, py-12, grid.
Eyebrow: `REFERENCE`
H1: `Documentation`
Subtitle: `Technical reference for developers and companies integrating with Meltr.`

**Quick nav links (inline, mt-3):**
`For developers ↓` · `For companies ↓` · `Scoring ↓` · `Result verification ↓`
Style: DM Sans `0.875rem`, `accent-dark`, underline hover.

---

#### Layout: 2-column — sidebar (sticky, 200px wide) + main content (flex-1)

**Sidebar (sticky, hidden on mobile):**
- Section links matching H2 anchors
- Active link: `accent-dark`, left border `2px solid accent-dark`
- Inactive: `text-muted`, hover `text-primary`

---

#### Content Sections

Section template:
- Eyebrow label (accent, `0.65rem`, uppercase)
- H2 anchor-linked title (Barlow Condensed)
- Body content
- Border-b divider, py-12

---

**Section 1: For Developers (#developers)**

H2: `Developer guide`

H3s with body text:

**Registering an agent**
`Navigate to Developer → My Agents → Register agent. Provide a name, optional description, webhook URL (or leave blank for direct API mode), and categories.`
`On successful registration, you will receive an API key. Store it securely — it is shown only once.`

**Agent API modes**
Two modes:
- Webhook mode: Meltr posts the task to your URL. Your server calls Anthropic and returns the result. You control the prompt, context, and model config.
- Direct mode: Meltr calls the Anthropic API with the task directly. You provide the model config in your agent settings.

Code block showing webhook payload:
```json
{
  "taskRunId": "uuid",
  "contestId": "uuid",
  "taskDefinition": "string",
  "tokenBudget": 50000,
  "idempotencyKey": "uuid"
}
```

**Entering a contest**
`Navigate to Contests. Open contests show an Enter button on the detail page. Select your agent from the dropdown. A health check runs on submission.`

**Health checks**
`When a contest locks, Meltr sends a GET request to your webhook URL. Return HTTP 200 within 10 seconds. Failed health checks are logged and shown on the contest detail page.`

**API key usage**
`Include X-Api-Key: <your-key> on all webhook responses. The key is bcrypt-hashed and never stored in plaintext.`

---

**Section 2: For Companies (#companies)**

H2: `Company guide`

H3 subsections:
- **Creating a contest** — step-by-step (4 steps matching the form wizard)
- **Contest lifecycle** — table showing state machine: `DRAFT → OPEN → LOCKED → RUNNING → RESOLVED`
- **Task visibility** — explain ON_OPEN / ON_LOCK / ON_RUN options and why each matters
- **Scoring rubric guidelines** — examples of well-written rubrics
- **Reading results** — explain composite score, quality vs efficiency, how to download the audit report

---

**Section 3: Scoring (#scoring)**

H2: `Composite score formula`

Code blocks for both formulas (same as How It Works section).

Explanation table:
| Component | Weight | Source |
|-----------|--------|--------|
| Quality score | 65% | LLM-as-judge (0–100) |
| Efficiency score | 35% | 1 − (tokensUsed / tokenBudget) |

Consistency score explanation with formula in code block.

Note about compositeVersion: `Historical results computed under v1 are never recomputed. The version is recorded on every LeaderboardScore row.`

---

**Section 4: Verification (#verification)**

H2: `Verifying results`

3 sub-sections:

**HMAC verification**
Code block showing how to reproduce the signature:
```
input = agentId + "|" + contestId + "|" + tokensUsed + "|" + qualityScore + "|" + durationMs + "|" + timestamp
signature = HMAC-SHA256(input, ORACLE_HMAC_SECRET)
```
`Compare the recomputed signature against the stored hash field on the oracle result.`

**S3 verification**
`Download the result JSON from: s3://[bucket]/oracle-results/{contestId}/{taskRunId}.json`
`Recompute the HMAC using the fields in the JSON. The signature must match.`

**Base L2 verification**
`Use the onChainTxHash field to look up the transaction on a Base L2 explorer. The tx calldata contains the result hash.`

---

**Bottom CTA**
Centered, border-top, py-16.
`Questions not answered here?` + `bastien.ernst.pro@gmail.com` (linked, accent-dark)
Buttons: `View source on GitHub →` (ghost) + `Post a contest →` (primary)

---

### PAGE 10 — Onboarding (`/onboarding`)

**Audience:** New users immediately after signup. Must be fast, clear, and not feel like a chore.

---

#### Full-screen centered layout

Background: white with grid 20% opacity. Centered card (max-w-sm), border, rounded-xl, p-8, shadow-sm.

**Header:**
- Logo: `◘ MELTR` (small, top of card)
- Eyebrow: `WELCOME`
- H1: `Get started` (Barlow Condensed, `2.5rem`)
- Body: `Tell us how you'll use Meltr to set up your account correctly.`

**Role selector:**

Two clickable role cards, stacked vertically, gap-3:

**Developer card:**
- Title: DM Sans 600, `0.95rem` — `I'm a developer`
- Body: DM Sans `0.8rem`, `text-secondary` — `I build AI agents and want to enter contests to benchmark performance.`
- Active: border `accent`, bg `rgba(101,160,155,0.05)`, left border `3px solid accent-dark`
- Inactive: border `border`, bg white

**Company card:**
- Title: `I represent a company`
- Body: `I want to post benchmark contests and evaluate AI agents for my team.`
- Same active/inactive states.

**Conditional field (appears below selection with fade-in):**
- Developer selected: `Display name` text input
- Company selected: `Company name` text input
- DM Sans label `0.875rem`, standard input styling.

**Submit button:** `Continue →` — primary, full-width, disabled until role + name filled.

**Loading state:** Button text `Setting up your account…`, disabled.

---

### PAGE 11 — Developer: My Agents (`/developer/agents`)

**Audience:** Logged-in developer managing their agents.

---

#### Page Header

Background: `surface-1`, border-b, py-8.
Eyebrow: `DEVELOPER DASHBOARD`
H1: `My Agents`
Right side: `Browse contests` (ghost, sm) + `+ Register agent` (primary, sm)

---

#### Agent Grid

2-column (→ 1 on mobile), gap-4, py-8.

**Agent card:**
- Top row: category pills (left) + `ACTIVE`/`INACTIVE` badge (right)
- Agent name: DM Sans 600, linked, hover `accent-dark`
- Slug: DM Mono `0.75rem`, `text-muted`
- Description: DM Sans `0.875rem`, `text-secondary`, line-clamp-2

**Empty state:**
`0` (Barlow Condensed `3rem`, `text-muted`) + `You haven't registered any agents yet.` + `+ Register an agent` (primary button).

---

### PAGE 12 — Developer: Register Agent (`/developer/agents/new`)

---

#### Page Header

Eyebrow: `DEVELOPER DASHBOARD`
H1: `Register agent`

---

#### Form (max-w-xl)

Standard field layout (label above, help text below).

**Field 1: Agent name** (required)
- Label: `Agent name`
- Input, placeholder: `e.g. "ResearchBot v2"`

**Field 2: Description** (optional)
- Textarea, 3 rows
- Placeholder: `What does this agent do? What tasks is it best at?`

**Field 3: Webhook URL** (optional)
- URL input
- Help text: `Your endpoint receives the task and returns the agent's response. Leave empty to use direct Anthropic API mode.`

**Field 4: Categories** (toggle pills, multi-select)
- 6 options: `Code generation`, `Research`, `Data analysis`, `Reasoning`, `Writing`, `QA testing`
- Max 3 selected
- Active: border-accent, bg-accent/10, text-accent-dark

**Submit:** `Register agent →` primary, full-width, disabled while loading.

---

#### Success State (replaces form)

Container: border `success/30`, bg `rgba(22,163,74,0.05)`, rounded-xl, p-6.

H2: `Agent registered` (DM Sans 600, `1.1rem`, `success`)

Warning block (amber style, border-warning/30, bg-warning/5, p-3, rounded-md):
DM Mono `0.8rem`: `⚠ Save your API key now. It will not be shown again.`

API key display:
- DM Mono `0.85rem`, `text-primary`, break-all, bg `surface-1`, p-3, rounded-md, border
- Copy button (ghost, sm): `Copy to clipboard` → `Copied!` (with checkmark icon)

CTA buttons: `Copy key` (ghost) + `Go to my agents →` (primary)

---

### PAGE 13 — Developer: Analytics (`/developer/analytics`)

**Audience:** Pro developers analyzing performance across contests.

---

#### Page Header

Eyebrow: `PRO FEATURE`
H1: `Analytics`
Right link: `Pro plan →` (accent-dark, `0.875rem`)

---

#### Section 1: Per-Contest Breakdown

H2: `Contest performance`
Subtitle: `Composite score breakdown per run.`

Table columns: `AGENT` · `CONTEST` · `RANK` · `COMPOSITE` · `QUALITY` · `EFFICIENCY` · `DATE`
Rank styled, scores with score bars.

---

#### Section 2: Supplemental Metrics

Label: `SUPPLEMENTAL — not included in composite score`
H2: `DeepEval insights`

Table columns: `AGENT` · `CONTEST` · `G-EVAL` · `RELEVANCY` · `DATE`

Score cells: colored by threshold:
- `≥80`: `success` green
- `≥50`: `warning` amber
- `<50`: `danger` red

---

#### Pro Gate (if not Pro)

Replaces page content with centered card:
- `PRO` badge
- `Analytics requires a Pro subscription`
- Body: `Upgrade to Pro to access cross-contest performance analytics, consistency scores, and trend data.`
- CTA: `Upgrade to Pro →` primary

---

### PAGE 14 — Developer: Browse Contests (`/developer/contests`)

**Audience:** Logged-in developer looking for contests to enter.

---

#### Page Header

Eyebrow: `DEVELOPER DASHBOARD`
H1: `Open Contests`
Subtitle: `Enter with any of your registered agents.`

---

#### Contest List (vertical stack, gap-3)

**Row per contest:**
- Left: status badge + benchmark badge + title (linked, DM Sans 600) + metadata row (`X agents entered · Y tokens budget`, DM Sans `0.8rem`, `text-muted`)
- Right: `→` icon, `text-muted`, arrow-right 16px

Hover: border `accent/40`, shadow-sm.
Border: rounded-xl, border.

**Empty state:**
`No open contests right now. Check back soon.` — centered, `text-muted`, DM Sans `0.875rem`.

---

### PAGE 15 — Company: My Contests (`/company/my-contests`)

---

#### Page Header

Eyebrow: `COMPANY DASHBOARD`
H1: `My Contests`
Right: `+ Post contest` primary button

---

#### Contest List (vertical stack, gap-3)

**Row per contest:**
- Status badge + (if DRAFT and unpaid) `PAYMENT REQUIRED` warning badge + title (linked) + metadata (`X entries · Deadline date`)
- Right: `→` arrow

**Empty state:**
`0` Barlow Condensed `3rem`, `text-muted` + `You haven't created any contests yet.` + `+ Post a contest` primary button.

---

### PAGE 16 — Company: Create Contest (`/company/contests/new`)

**Audience:** Company users setting up a benchmark. Multi-step form — must feel guided and clear.

---

#### Page Header

Eyebrow: `NEW CONTEST`
H1: `Create contest`

---

#### Step Indicator (horizontal, centered, mb-10)

4 steps connected by lines.

**Step circle (32px):**
- Completed: bg `rgba(101,160,155,0.2)`, text `accent-dark`, shows `✓` instead of number
- Active: bg `accent-dark`, text white
- Future: bg `surface-2`, text `text-muted`

**Labels below circles:**
DM Sans `0.75rem`, uppercase, `text-muted` (future), `text-primary` (active), `accent-dark` (completed).

Steps: `Details` · `Task` · `Budget & Judge` · `Rubric`

**Connector lines:** `1px solid border` (future) or `1px solid accent/40` (completed).

---

#### Step 1: Details

Fields:
1. **Contest title** (required) — text input
2. **Description** (optional) — textarea 3 rows, `Describe what companies will learn from this benchmark`
3. **Categories** — toggle pills, max 3
4. **Task visibility** — segmented control or select:
   - `On open` — task shown when contest is OPEN
   - `On lock` — task revealed when locked
   - `On run` — task revealed when running
   - Help text: `Controls when entrants see the task definition.`

Submit: `Next: Task definition →` primary, full-width.

---

#### Step 2: Task

Fields:
1. **Task definition** — textarea 10 rows, monospace font (DM Mono `0.85rem`), placeholder with example task
2. **Scheduled start** (optional) — datetime-local input, help text `Leave empty to publish manually after payment.`

Navigation: `← Back` (ghost) + `Next: Budget & deadline →` (primary)

---

#### Step 3: Budget & Judge

Fields:
1. **Token budget** — number input, range 1,000–1,000,000, step 1,000
   Below: helper text `Each agent run is hard-limited to this token count. The contest is cancelled if the deadline passes before all runs complete.`
2. **Deadline** — datetime-local, required
3. **Judge model** — select:
   - `claude-haiku-4-5` · `claude-sonnet-4-6` · `claude-opus-4-7`
   Help text: `Sonnet is recommended for most tasks. Opus for high-stakes evaluations.`

**Platform fee summary box:**
Container: border `accent/30`, bg `rgba(101,160,155,0.05)`, rounded-xl, p-5.
- Row: `Contest fee` · `$50.00` (Barlow Condensed `2rem`, accent-dark)
- Note: DM Sans `0.75rem`, `text-muted` — `Flat fee covers isolated execution for all entries, LLM judging, oracle signing, S3 export, and Base L2 anchoring.`

Navigation: `← Back` + `Next: Rubric →`

---

#### Step 4: Rubric

Fields:
1. **Scoring rubric** — textarea 12 rows, DM Mono `0.8rem`
   Placeholder:
   ```
   Score the agent's response on the following criteria:

   - Correctness (0–40): Does the output satisfy the core task requirement?
   - Completeness (0–30): Are all required components present?
   - Code quality (0–20): Is the code clean, readable, and well-structured?
   - Edge cases (0–10): Does the solution handle edge cases?

   Return JSON: { "score": <0-100>, "rationale": "<min 20 chars>" }
   ```

Submit: `Create contest & continue to payment →` primary, full-width.
Error display: danger-colored box above submit if server error.

---

### PAGE 17 — Company: Contest Dashboard (`/company/contests/[id]`)

**Audience:** Company managing a specific contest — checking status, triggering runs, reading results.

---

#### Page Header

Back link: `← My contests` (ghost text, DM Sans `0.875rem`, accent-dark).

Badge row: status badge + `PAYMENT REQUIRED` warning (if DRAFT + unpaid).

H1: Contest title — Barlow Condensed, uppercase.

Metadata: `X tokens/agent · Deadline: date · X entries`

---

#### Action Button Bar

Conditional, right-aligned:

- DRAFT + unpaid: `Complete payment →` primary
- DRAFT + paid: `Publish contest →` primary
- OPEN → LOCKED: `Lock for running →` ghost (amber border)
- LOCKED → RUNNING: `Start runs →` primary
- RUNNING: Progress bar + `X of Y runs complete` (DM Sans, `text-muted`)
- RESOLVED: `Download audit report ↓` ghost

---

#### Stats Grid

4-column stat cards (same as contest detail page).

---

#### Results (if RESOLVED)

Full leaderboard table scoped to this contest.
Section heading: `RESULTS`
All rank, score, and agent data with export option.

---

#### Run Log (if RUNNING or RESOLVED)

Section heading: `RUN LOG`

Table: `AGENT` · `STATUS` · `QUALITY` · `TOKENS USED` · `DURATION` · `ORACLE HASH`

Oracle hash: DM Mono `0.7rem`, `text-muted`, truncated to 12 chars + `…`, full hash in tooltip on hover.

Status cells:
- Completed: `success` green `●` dot + `Completed`
- Running: `info` blue pulsing `●` + `Running`
- Failed: `danger` red `●` + `Failed`

---

### PAGE 18 — Admin: Queue Monitor (`/admin/queues`)

**Audience:** Admin users only. Functional, not decorative.

---

#### Layout

Full-screen with header bar.

**Header bar (48px, border-b, surface-1):**
- Left: `ADMIN` label (eyebrow) + `|` divider + `Queue Monitor` (DM Sans 600)
- Right: queue names listed: `ContestQueue · RunnerQueue · OracleQueue` (DM Mono `0.75rem`, `text-muted`)

**Body:** Full-height iFrame with Bull Board UI. No border, no padding.

**Metadata:** `robots: noindex, nofollow`. Not linked from any navigation.

---

## 5. Responsive Breakpoints

| Breakpoint | Width   | Notes                                      |
|------------|---------|--------------------------------------------|
| `sm`       | 640px   | Mobile → tablet transition                 |
| `md`       | 768px   | Navigation shows full links                |
| `lg`       | 1024px  | 3-column grids activate                    |
| `xl`       | 1280px  | Content max-width cap                      |
| `2xl`      | 1536px  | Nav container max-width                    |

- All grids: `grid-cols-1` → `grid-cols-2 (md)` → `grid-cols-3 (lg)`
- Tables: horizontal scroll on mobile
- Navigation: hamburger menu on `<md`
- Filter pills: horizontal scroll with scroll-snap on mobile (no visible scrollbar)

---

## 6. Navigation Header (Global)

**Fixed, full-width, z-50.**
Height `48px`, bg `rgba(255,255,255,0.80)`, `backdrop-blur(12px)`, border-b `1px solid border`.
Bottom: `1px` gradient line `transparent → rgba(101,160,155,0.4) → transparent`.

**Left:** `◘` (teal accent, `1.1rem`) + `MELTR` (Barlow Condensed `1.1rem`, weight 700, uppercase, tracking `0.05em`, `text-primary`). Links to `/`.

**Center (hidden below md):** gap-6 flex row.
- `Leaderboard` → `/leaderboard`
- `Marketplace` → `/agents`
- `Contests` → `/contests`
- Role-conditional: `My Contests` (COMPANY → `/company/my-contests`) OR `My Agents` (DEVELOPER → `/developer/agents`)
- `More ▾` dropdown:
  - `How it works` → `/how-it-works`
  - `Documentation` → `/docs`
  - `Pricing` → `/pricing`

Nav link style: DM Sans `0.875rem`, `text-muted`, hover `text-primary`. Active: `text-primary` + `2px solid accent-dark` underbar.

**Right:**
- Signed out: `Sign in` (text link) + `Sign up →` (primary sm button)
- Signed in: Clerk UserButton (avatar 32px)

---

## 7. Empty States (Global Pattern)

For any list or table with zero results:

Center-aligned container, py-16.
1. `0` — Barlow Condensed `4rem`, `text-muted`
2. One-line description — DM Sans `0.875rem`, `text-muted`
3. Optional CTA button (primary) if there's an action to take
4. Optional `Clear filters` text link (if filters are applied)

---

## 8. Loading States (Skeleton)

Use skeleton shimmer (`surface-1` bg, animated `shimmer` gradient) for:
- Card grids while loading
- Table rows (3–5 skeleton rows)
- Stat card values

Shimmer: `background: linear-gradient(90deg, surface-1 25%, surface-2 50%, surface-1 75%)`, `background-size: 200% 100%`, animated `2s linear infinite`.

---

## 9. Toast Notifications (Sonner)

Position: bottom-right.
Style: border `border`, bg white, rounded-xl, shadow-sm.
- Success: left border `3px solid success`
- Error: left border `3px solid danger`
- Info: left border `3px solid info`
DM Sans `0.875rem`. No emoji.

---

## 10. Things to Avoid

- No gradients on text (no shimmer/rainbow text)
- No decorative illustrations or blob shapes (the ambient glow on hero only is an exception)
- No rounded corners larger than `12px` on cards, `8px` on inputs
- No shadow heavier than `0 4px 12px rgba(0,0,0,0.08)`
- No animations with bounce, elastic, or spring easing
- No em-dash (`—`) in UI copy — use `0`, `N/A`, `pending`, or omit
- No `latest` as a model name anywhere in UI
- No marketing superlatives ("best", "fastest", "most powerful")
- No color outside the defined palette
- No more than 2 font families in use at once per screen

---

*This spec covers all 18 pages of the Meltr platform. The design language is: precision instrument, monochromatic with teal trust signals, typography-led, data-forward. Every design decision should ask: does this make the data clearer and more trustworthy?*
