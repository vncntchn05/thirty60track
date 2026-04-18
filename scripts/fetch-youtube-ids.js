#!/usr/bin/env node
/**
 * fetch-youtube-ids.js
 *
 * Reads ALL exercises from the CSV export, then:
 *   1. For exercises WITH a help_url: fetches the video title via videos.list
 *      (1 quota unit per 50 videos — very cheap) and checks if the title
 *      actually matches the exercise name.  Mismatches are queued for a new
 *      search.
 *   2. For exercises WITHOUT a help_url: queued for a new search.
 *   3. Searches are run with a 200 ms delay.  Use --max-searches to stay
 *      inside the free-tier cap (100 searches = 10 000 units/day).
 *
 * Usage:
 *   node scripts/fetch-youtube-ids.js <API_KEY> [CSV_PATH] [--max-searches N]
 *
 * Defaults:
 *   CSV_PATH        = supabase/Supabase Snippet Link Client Row to Auth User (3).csv
 *   --max-searches  = 80
 *
 * Output:
 *   supabase/migration_029c_youtube_urls.sql
 */

'use strict';
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── CLI args ────────────────────────────────────────────────────────────────
const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error('Usage: node scripts/fetch-youtube-ids.js <YOUTUBE_API_KEY> [CSV_PATH] [--max-searches N]');
  process.exit(1);
}

let csvPath = path.join(__dirname, '..', 'supabase',
  'Supabase Snippet Link Client Row to Auth User (3).csv');
let maxSearches = 80;

for (let i = 3; i < process.argv.length; i++) {
  if (process.argv[i] === '--max-searches' && process.argv[i + 1]) {
    maxSearches = parseInt(process.argv[++i], 10);
  } else if (!process.argv[i].startsWith('--')) {
    csvPath = process.argv[i];
  }
}

// ── Exercises to skip entirely (too generic / not a real movement) ───────────
const SKIP_NAMES = new Set([
  'strength 1',
  'Rest Periods Between Every Set',
]);

// ── CSV parser ───────────────────────────────────────────────────────────────
// Handles RFC-4180: quoted fields, embedded commas, embedded newlines, "" escapes.
function parseCSV(content) {
  const rows = [];
  let fields = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') { field += '"'; i += 2; continue; } // escaped "
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if      (ch === '"')  { inQuotes = true; }
      else if (ch === ',')  { fields.push(field); field = ''; }
      else if (ch === '\n' || (ch === '\r' && content[i + 1] === '\n')) {
        if (ch === '\r') i++;
        fields.push(field);
        rows.push(fields);
        fields = [];
        field = '';
      } else {
        field += ch;
      }
    }
    i++;
  }
  if (field || fields.length > 0) { fields.push(field); rows.push(fields); }
  return rows;
}

// ── Video-match heuristic ────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'the','and','for','how','with','from','that','this','are','your','you',
  'not','does','can','its','was','has','had','but','have','been',
]);

function doesVideoMatchExercise(exerciseName, videoTitle) {
  const norm  = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = norm(exerciseName)
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
  if (words.length === 0) return true; // nothing to check
  const title = norm(videoTitle);
  return words.some(w => title.includes(w));
}

// ── Extract YouTube video ID from any YouTube URL format ─────────────────────
function extractVideoId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── YouTube API helpers ───────────────────────────────────────────────────────
function apiGet(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com${endpoint}&key=${encodeURIComponent(API_KEY)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// videos.list — costs 1 quota unit per call (up to 50 IDs per call)
async function getVideoDetailsBatch(videoIds) {
  const map = {};
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50).join(',');
    const json  = await apiGet(`/youtube/v3/videos?part=snippet&id=${chunk}`);
    if (json.error) throw new Error(json.error.message);
    for (const item of (json.items || [])) {
      map[item.id] = { title: item.snippet.title, channel: item.snippet.channelTitle };
    }
  }
  return map;
}

// search.list — costs 100 quota units per call
async function searchYouTube(query) {
  const json = await apiGet(
    `/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}`
  );
  if (json.error) throw new Error(json.error.message);
  const items = json.items || [];
  if (!items.length) return null;
  const item = items[0];
  return { videoId: item.id.videoId, title: item.snippet.title, channel: item.snippet.channelTitle };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Build a YouTube search query for an exercise
function buildQuery(name, muscleGroup) {
  return `${name} exercise tutorial how to`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  // 1. Parse CSV
  console.log(`Reading ${path.basename(csvPath)}…`);
  const content  = fs.readFileSync(csvPath, 'utf8');
  const rows     = parseCSV(content);
  const headers  = rows[0];

  const idIdx     = headers.indexOf('id');
  const nameIdx   = headers.indexOf('name');
  const urlIdx    = headers.indexOf('help_url');
  const muscleIdx = headers.indexOf('muscle_group');

  const exercises = rows.slice(1)
    .filter(r => r.length > Math.max(idIdx, nameIdx, urlIdx))
    .map(r => ({
      id:          (r[idIdx]     || '').trim(),
      name:        (r[nameIdx]   || '').trim(),
      helpUrl:     (r[urlIdx]    || '').trim() === 'null' ? null : (r[urlIdx] || '').trim() || null,
      muscleGroup: (r[muscleIdx] || '').trim(),
    }))
    .filter(e => e.id && e.name && !SKIP_NAMES.has(e.name));

  console.log(`Loaded ${exercises.length} exercises.\n`);

  // 2. Batch-verify existing help_urls (cheap: 1 unit / 50 videos)
  const withUrl    = exercises.filter(e => e.helpUrl);
  const withoutUrl = exercises.filter(e => !e.helpUrl);

  console.log(`${withUrl.length} exercises have an existing help_url → verifying…`);

  const exerciseToVid = {};
  for (const e of withUrl) {
    const vid = extractVideoId(e.helpUrl);
    if (vid) exerciseToVid[e.id] = vid;
  }

  let videoDetails = {};
  const uniqueVids = [...new Set(Object.values(exerciseToVid))];
  if (uniqueVids.length) {
    try {
      videoDetails = await getVideoDetailsBatch(uniqueVids);
      console.log(`Fetched details for ${Object.keys(videoDetails).length} / ${uniqueVids.length} videos.\n`);
    } catch (err) {
      console.error(`videos.list error: ${err.message}`);
    }
  }

  // 3. Categorise: keep OK ones, queue the rest for search
  const keepList = [];   // { id, name, videoId, title, channel }
  const searchQueue = []; // { id, name, muscleGroup, reason }

  for (const e of withUrl) {
    const vid     = exerciseToVid[e.id];
    const details = vid ? videoDetails[vid] : null;

    if (!vid) {
      console.log(`BROKEN URL : "${e.name}" (could not extract video ID)`);
      searchQueue.push({ ...e, reason: 'unparseable URL' });
    } else if (!details) {
      console.log(`NOT FOUND  : "${e.name}" — video ${vid} is deleted / private`);
      searchQueue.push({ ...e, reason: 'video deleted or private' });
    } else if (!doesVideoMatchExercise(e.name, details.title)) {
      console.log(`MISMATCH   : "${e.name}"\n             ↳ video: "${details.title}" (${details.channel})`);
      searchQueue.push({ ...e, reason: `title mismatch — was: "${details.title}"` });
    } else {
      console.log(`OK         : "${e.name}" → "${details.title}"`);
      keepList.push({ id: e.id, name: e.name, videoId: vid, title: details.title, channel: details.channel });
    }
  }

  // All exercises with no URL
  for (const e of withoutUrl) {
    searchQueue.push({ ...e, reason: 'no URL' });
  }

  console.log(`\n${keepList.length} URLs are already correct.`);

  // 4. Load already-processed IDs from previous SQL output (if any)
  const outPath = path.join(__dirname, '..', 'supabase', 'migration_029c_youtube_urls.sql');
  const alreadyDone = new Set();
  if (fs.existsSync(outPath)) {
    const existing = fs.readFileSync(outPath, 'utf8');
    for (const m of existing.matchAll(/WHERE id = '([0-9a-f-]{36})'/g)) {
      alreadyDone.add(m[1]);
    }
  }

  const remainingQueue = searchQueue.filter(e => !alreadyDone.has(e.id));

  console.log(`${remainingQueue.length} exercises need a new search${alreadyDone.size ? ` (${alreadyDone.size} already done from previous run)` : ''}.`);
  console.log(`Search limit: --max-searches ${maxSearches}  (100 units each, ${maxSearches * 100} units total)\n`);

  // 5. Run searches
  const newResults = [];
  let searchCount = 0;

  for (const e of remainingQueue) {
    if (searchCount >= maxSearches) {
      console.log(`\n⚠️  Search limit (${maxSearches}) reached. Re-run to continue remaining exercises.`);
      break;
    }
    const query = buildQuery(e.name, e.muscleGroup);
    process.stdout.write(`[${searchCount + 1}/${Math.min(remainingQueue.length, maxSearches)}] "${e.name}"… `);
    try {
      const hit = await searchYouTube(query);
      if (hit) {
        console.log(`✓ ${hit.videoId} — "${hit.title}" (${hit.channel})`);
        newResults.push({ id: e.id, name: e.name, videoId: hit.videoId, title: hit.title, channel: hit.channel });
      } else {
        console.log('(no result)');
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      if (err.message.toLowerCase().includes('quota')) {
        console.error('\n⚠️  YouTube API quota exceeded. Run again tomorrow or use a different key.');
        break;
      }
    }
    searchCount++;
    await sleep(200);
  }

  // 5. Write SQL
  const allUpdates = [
    ...keepList.map(r => ({ ...r, status: 'KEEP' })),
    ...newResults.map(r => ({ ...r, status: 'NEW' })),
  ];

  const lines = [
    '-- ================================================================',
    '-- Migration 029c: Verified YouTube help_url links',
    `-- Generated ${new Date().toISOString()}`,
    `-- Source CSV: ${path.basename(csvPath)}`,
    '-- [KEEP] = existing URL verified correct',
    '-- [NEW]  = replaced or newly added via YouTube Data API v3 search',
    '-- ================================================================',
    '',
  ];

  for (const r of allUpdates) {
    lines.push(`-- [${r.status}] ${r.name} | "${r.title}" (${r.channel})`);
    const safeUrl = `https://youtu.be/${r.videoId}`.replace(/'/g, "''");
    lines.push(`UPDATE exercises SET help_url = '${safeUrl}' WHERE id = '${r.id}';`);
    lines.push('');
  }

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

  const kept    = keepList.length;
  const added   = newResults.length;
  const total   = allUpdates.length;
  const remaining = remainingQueue.length - searchCount;

  console.log(`\n✓ Done.`);
  console.log(`  ${kept} existing URLs verified and kept`);
  console.log(`  ${added} new/replaced videos found (${searchCount} search${searchCount !== 1 ? 'es' : ''} used)`);
  console.log(`  ${total} UPDATE statements written to ${path.basename(outPath)}`);
  if (remaining > 0) {
    console.log(`  ${remaining} exercises not yet searched — re-run to continue`);
  }
})();
