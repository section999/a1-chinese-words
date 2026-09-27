#!/usr/bin/env node
/*
 * vocabulary.txt (TSV, no header) -> data/vocabulary.js (+ data/vocabulary.json with --json)
 *
 * Columns: id, level, hanzi, pinyin, english, korean, ukrainian
 *
 * Usage:
 *   node scripts/convert.js                 # writes data/vocabulary.js
 *   node scripts/convert.js --json          # also writes data/vocabulary.json
 *   node scripts/convert.js path/to/file.txt
 *
 * No dependencies. Works with Node 12+.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const writeJson = args.includes('--json');
const inputArg = args.find((a) => !a.startsWith('--'));
const INPUT = inputArg ? path.resolve(inputArg) : path.join(ROOT, 'vocabulary.txt');
const OUT_DIR = path.join(ROOT, 'data');

// Part-of-speech markers used in the source, e.g. 白(形), 分(名、量)
const POS_CODES = {
  名: 'n',
  动: 'v',
  形: 'adj',
  副: 'adv',
  量: 'mw',
  代: 'pron',
  数: 'num',
  介: 'prep',
  连: 'conj',
  助: 'part',
  叹: 'intj',
};

// Obvious typos in the source data
const HANZI_FIXES = { O: '〇', o: '〇', 0: '〇' };

// Words written with the same character need a context word so speech picks the
// right reading (地 de / dì, 干 gān / gàn, 还 hái / huán).
const SPEAK_BY_ID = {
  66: '慢慢地', // de
  69: '地上', // dì
  111: '干净', // gān
  113: '干什么', // gàn
  132: '还有', // hái
  153: '还书', // huán
};

/** "白(形)" -> { text: "白", inner: "形" }; no parens -> inner: null */
function splitParen(s) {
  const m = s.match(/^(.*?)\((.*?)\)(.*)$/);
  if (!m) return { text: s.trim(), inner: null, before: s.trim(), after: '' };
  return { text: (m[1] + m[3]).trim(), inner: m[2].trim(), before: m[1], after: m[3] };
}

/** "名、量" -> ["n", "mw"], or null if it isn't a POS marker */
function parsePos(inner) {
  const parts = inner.split(/[、,，]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length && parts.every((p) => POS_CODES[p])) return parts.map((p) => POS_CODES[p]);
  return null;
}

/**
 * Removes the dictionary markers from a pinyin string:
 *   "bāng/máng", "chàng//gē" (separable verbs) -> "bāngmáng", "chànggē"
 *   "chū/·lái", "bié·rén" (optional neutral tone) -> "chūlái", "biérén"
 */
function cleanPinyin(s) {
  return s.replace(/\/+/g, '').replace(/·/g, '').replace(/\s+/g, ' ').trim();
}

function parseLine(line, lineNo) {
  const cols = line.split('\t').map((c) => c.trim());
  if (cols.length !== 7) {
    throw new Error(`line ${lineNo}: expected 7 columns, got ${cols.length}`);
  }
  const [idRaw, level, hanziRaw, pinyinRaw, en, ko, uk] = cols;
  const id = Number(idRaw);
  if (!Number.isInteger(id)) throw new Error(`line ${lineNo}: invalid id "${idRaw}"`);
  if (!hanziRaw || !pinyinRaw) throw new Error(`line ${lineNo}: missing hanzi or pinyin`);

  const hanziParts = hanziRaw.split('|').map((h) => HANZI_FIXES[h.trim()] || h.trim());
  const pinyinParts = pinyinRaw.split('|').map((p) => p.trim());

  // Main form: strip "(...)", which is either a POS marker or a usage example.
  const main = splitParen(hanziParts[0]);
  let pos = [];
  let example = null;
  if (main.inner) {
    const parsed = parsePos(main.inner);
    if (parsed) pos = parsed;
    else example = { hanzi: main.inner, pinyin: '' };
  }

  const mainPinyin = splitParen(pinyinParts[0]);
  let pinyinSource = mainPinyin.text;
  if (mainPinyin.inner) {
    if (example) {
      // 第(第二) / dì(dì-èr): the parens hold the example's pinyin
      example.pinyin = cleanPinyin(mainPinyin.inner);
    } else {
      // 有一些 / yǒu(yī)xiē: optional syllable that is part of the word -> keep it
      pinyinSource = mainPinyin.before + mainPinyin.inner + mainPinyin.after;
    }
  }

  // 谁 / shéi/shuí: a single "/" on a one-character word is an alternate reading,
  // not a separable-verb marker.
  let pinyin;
  const pinyinAlt = [];
  const isSingleChar = Array.from(main.text).length === 1;
  const altReading = pinyinSource.match(/^([^/·]+)\/([^/·]+)$/);
  if (isSingleChar && altReading) {
    pinyin = altReading[1].trim();
    pinyinAlt.push(altReading[2].trim());
  } else {
    pinyin = cleanPinyin(pinyinSource);
  }

  // Alternate written forms: 爸爸|爸 / bàba|bà
  const variants = hanziParts.slice(1).map((h, i) => ({
    hanzi: splitParen(h).text,
    pinyin: cleanPinyin(splitParen(pinyinParts[i + 1] || pinyinParts[0]).text),
  }));

  const entry = {
    id,
    level,
    hanzi: main.text,
    pinyin,
    pinyinAlt,
    variants,
    pos,
    example,
    // Text sent to speech synthesis. Suffixes like 子/们 are misread on their own,
    // so the example word is spoken instead.
    speak: SPEAK_BY_ID[id] || (example ? example.hanzi : main.text),
    en,
    ko,
    uk,
    raw: { hanzi: hanziRaw, pinyin: pinyinRaw },
  };
  return entry;
}

function main() {
  const text = fs.readFileSync(INPUT, 'utf8').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/);
  const words = [];
  const errors = [];

  lines.forEach((line, i) => {
    if (!line.trim()) return;
    try {
      words.push(parseLine(line, i + 1));
    } catch (err) {
      errors.push(err.message);
    }
  });

  const seen = new Set();
  for (const w of words) {
    if (seen.has(w.id)) errors.push(`duplicate id ${w.id}`);
    seen.add(w.id);
  }

  if (errors.length) {
    console.error(`Found ${errors.length} problem(s) in ${path.relative(ROOT, INPUT)}:`);
    errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }

  words.sort((a, b) => a.id - b.id);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const body = words.map((w) => '  ' + JSON.stringify(w)).join(',\n');
  const js =
    '/* Generated by scripts/convert.js from vocabulary.txt. Do not edit by hand. */\n' +
    'window.VOCABULARY = [\n' + body + '\n];\n';
  fs.writeFileSync(path.join(OUT_DIR, 'vocabulary.js'), js, 'utf8');
  console.log(`Wrote data/vocabulary.js (${words.length} words)`);

  if (writeJson) {
    fs.writeFileSync(path.join(OUT_DIR, 'vocabulary.json'), JSON.stringify(words, null, 2) + '\n', 'utf8');
    console.log(`Wrote data/vocabulary.json (${words.length} words)`);
  }
}

main();
