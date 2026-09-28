# A1 Chinese Words

A site for learning 500 A1-level Chinese words. Plain HTML/CSS/JavaScript with no build step.

## Running

Open `index.html` directly in a browser (it also works from `file://`).

- Type follows the freeCodeCamp style guide: Hack-ZeroSlash (monospace, `vendor/fonts/`), Lato (longer text) and SaxMono (the logo, as SVG outlines in `index.html`). Lato and Noto Sans KR load from the web; offline, system fonts are used instead.
- Pronunciation uses the browser's Web Speech API (zh-CN). If no Chinese voice is installed, the default voice may read the word or there may be no sound.
- Stroke-order writing uses `data/strokes.js` and `vendor/hanzi-writer.min.js`, so it works without internet. Both files (about 650 KB) load the first time the Writing tab opens, so they don't slow down the first page load.

## Stroke-order writing (tab 4: Writing)

The whole word is written one character per grid box (田字格). When one character is done, the next box starts automatically.

- **Watch**: plays every stroke from the first character's first stroke to the last character's last stroke. Pick the speed (0.4x / 0.7x / 1.3x); pressing a speed replays at that speed.
- **Trace**: trace the faint characters. A hint appears after 2 misses on the same stroke.
- **From memory**: write from the meaning and pinyin only. A hint appears after 3 misses on the same stroke. The result (score, missed strokes, hints) is recorded; the Writing screen shows the best score.
- **Score** (Trace and From memory): each stroke earns 1 point on the first try, 0.5 after mistakes, 0 after a hint; the word's score is the average × 100 (★★★ from 90, ★★ from 70). "↺ Again" on a character can't raise its strokes' scores.
- Stroke matching is more forgiving than Hanzi Writer's default (leniency 1.5 in Trace, 1.25 in From memory), and tapping a dot stroke (丶) counts as drawing it.

The ← / → buttons at the bottom of the card move to the previous / next word, following the **Order** setting (By number / Shuffle). A word can also be opened directly by address, like `#write/83`; the pencil buttons in the word list and flashcards go to that address.
"From memory" records are stored separately from learned-word progress and are shown on the Writing screen and in the home progress summary.

### Re-downloading stroke data

If you change the word data, download the stroke data again (Node 18+, internet required, one time).

```sh
node scripts/convert.js
node scripts/fetch-strokes.js    # creates data/strokes.js (currently 301 characters, about 614 KB)
```

Characters without stroke data (currently only `〇`, a variant of 零) show "no stroke data" in their box.

## Data conversion

If you edit `vocabulary.txt`, convert it again (Node.js required, no external packages).

```sh
node scripts/convert.js          # creates data/vocabulary.js
node scripts/convert.js --json   # also creates data/vocabulary.json
```

`fetch()` can't read JSON from `file://`, so the site loads `data/vocabulary.js` (which defines `window.VOCABULARY`) with a `<script>` tag.

### Source notation rules

| Source | Result |
|---|---|
| `爸爸\|爸` / `bàba\|bà` | Main form `爸爸 bàba` + variant `爸 bà` |
| `白(形)`, `分(名、量)` | Part of speech (`pos: ["adj"]`, `["n","mw"]`). Kept in the data only, not shown on screen |
| `们(朋友们)` / `men(péngyoumen)` | Example `朋友们 péngyoumen` |
| `bāng/máng`, `chàng//gē` | Separable-verb marks removed → `bāngmáng`, `chànggē` |
| `chū/·lái`, `bié·rén` | Neutral-tone marks removed → `chūlái`, `biérén` |
| `shéi/shuí` (one-character word) | Alternative reading `pinyinAlt: ["shuí"]` |
| `yǒu(yī)xiē` | Only the parentheses removed → `yǒuyīxiē` |
| `零\|O` | Latin letter O corrected to `〇` |

The original values are kept in each entry's `raw`. Suffixes that sound odd on their own, like 子 and 们, are pronounced through their example word (桌子, 朋友们) via the `speak` field.

## File structure

```
index.html            Page (Home / Word list / Flashcards / Quiz / Writing)
vocabulary.txt        Source data (TSV)
data/vocabulary.js    Conversion output
scripts/convert.js    Conversion script
scripts/fetch-strokes.js  Downloads stroke data → data/strokes.js
data/strokes.js       Stroke data (generated)
vendor/               Hanzi Writer 3.7.3, Hack-ZeroSlash fonts + license files
css/style.css         Styles, theme variables (dark default / light)
js/core.js            Namespace, events, shared helpers
js/storage.js         localStorage, learned-word progress
js/favorites.js       Favorite words storage, favorite buttons
js/i18n.js            UI text (English / Ukrainian / Korean), word display helpers
js/speech.js          Pronunciation (Web Speech API)
js/list.js            Word list
js/flashcards.js      Flashcards
js/quiz.js            Quiz
js/writing.js         Stroke-order writing (stroke data loads when the tab first opens)
js/backup.js          Progress backup export / import
js/home.js            Home (front page): start button, progress summary
js/app.js             Startup, view switching (URL hash), hamburger menu, theme, language, shortcuts
```

## Home and menu

- Opening the site without a hash shows the home page. Addresses like `#cards` or `#write/83` skip the home page. The "A1 Chinese Words" header title or Home in the menu goes back.
- The big home button is always **Start learning** and goes to the word list (Not yet filter).
- If there are learned words or writing records, a progress summary appears.
- The right side of the header has a freeCodeCamp donate link (❤️), a theme toggle, and a hamburger button (☰).
- The hamburger menu handles navigation, language (English / Українська / 한국어), and progress export / import. Language and Progress start folded and fold again every time the menu opens. Language changes both the interface text and the word meanings. The default is English (the English column of `vocabulary.txt`).

## Keyboard shortcuts

Shortcut hints are hidden on touch-only devices.

- Flashcards: `Space` flip, `←` I don't know, `→` I know, `P` listen
- Quiz: `1`–`4` choose, `Enter` next, `P` listen
- Writing: `←` / `→` previous / next word, `R` start over, `P` listen, (Watch mode) `Space` play

## Favorites

Press **Favorite** next to a word in the word list, or the ☆ in a flashcard's top-left corner, to add it to favorites. Press again to remove it.

- Word list, **Favorites** filter: the favorite words, with search and order like the other filters, and a "Practice with flashcards" button
- Flashcards, **Favorites** deck: flashcards with only the favorite words
- The ☰ menu's Favorites link (and old `#favorites` links) open the word list with the Favorites filter

## Stored values (localStorage, `a1zh:` prefix)

`learned` (array of learned word numbers), `writing` (per-word writing records: tries, fewest missed strokes, last date), `favorites` (array of favorite word numbers), `lang`, `theme`, list filter and order (`listFilter`, `listOrder`), flashcard deck and order (`deckMode`, `deckOrder`), quiz settings (`quizLength`, `quizSource`), writing settings (`writeWord`, `writeMode`, `writeSpeed`, `writeOrder`).

## Backup

**Export progress** in the hamburger menu (☰) downloads all the stored values above as `a1zh-backup-YYYY-MM-DD.json`. In another browser or device, choose that file with **Import progress** (menu or home page). After confirming, the current records are **replaced entirely** by the file's contents (not merged) and the page reloads. Files not exported from this site are not imported. Values left by removed features (`srs`, `sidebarCollapsed`, `missed`) are deleted at startup and skipped when importing an old backup.

## License

- Hanzi Writer: MIT (`vendor/LICENSE-hanzi-writer.txt`)
- Stroke data: hanzi-writer-data / Make Me a Hanzi, Arphic Public License (`vendor/ARPHICPL.txt`, `vendor/COPYING-stroke-data.md`)
- Hack-ZeroSlash: MIT + Bitstream Vera License (`vendor/LICENSE-hack.md`)
- SaxMono (logo): s.a.x. Software free license (`vendor/LICENSE-saxmono.txt`)
