import { execFile } from 'node:child_process';
import { access, mkdtemp, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const logPrefix = '[stitch-e2e]';

// Raw agent-browser recordings are named `<session>.webm` plus optional
// `-partN` continuation segments, and every session name ends in `e2e-<pid>`.
// Stitched outputs are named after the test slug instead, so this pattern tells
// leftover raw recordings (no manifest entry) apart from earlier outputs.
const rawRecordingNamePattern = /^.*-e2e-\d+(?:-part\d+)?\.webm$/;

const durationToleranceSeconds = 0.5;

const subtitleFontFamilies = ['DejaVu Sans', 'Liberation Sans', 'Noto Sans'];

const subtitleFontFileFallbacks = [
  '/usr/share/fonts/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/liberation-sans/LiberationSans-Regular.ttf',
  '/usr/share/fonts/google-noto/NotoSans-Regular.ttf',
];

function currentRootDirectory() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

const recordingsDirectory = join(currentRootDirectory(), 'tests', 'e2e', '.recordings');

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStringProperty(record, propertyName) {
  const value = record[propertyName];

  return typeof value === 'string' ? value : undefined;
}

function readNumberProperty(record, propertyName) {
  const value = record[propertyName];

  return typeof value === 'number' ? value : undefined;
}

// ffprobe reports some fields (for example format.duration) as numeric strings.
function readFiniteNumberProperty(record, propertyName) {
  const value = record[propertyName];

  if (typeof value !== 'number' && typeof value !== 'string') {
    return undefined;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugifyTestName(testName) {
  const slug = testName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug === '' ? 'untitled-test' : slug;
}

// ffmpeg filter values are quoted so spaces, colons, and commas survive the
// filtergraph parser; backslashes and single quotes stay escapable inside quotes.
function quoteFilterValue(value) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function formatConcatListEntry(filePath) {
  return `file '${filePath.replaceAll("'", "'\\''")}'`;
}

async function precheckVideoTools() {
  for (const tool of ['ffmpeg', 'ffprobe']) {
    try {
      await execFileAsync(tool, ['-version']);
    } catch (error) {
      throw new Error(`${tool} is required to stitch e2e recordings but could not be executed: ${error.message}`);
    }
  }
}

async function matchFontFile(family) {
  try {
    const { stdout } = await execFileAsync('fc-match', ['-f', '%{file}', family]);
    const fontFilePath = stdout.trim();

    return fontFilePath !== '' && (await pathExists(fontFilePath)) ? fontFilePath : undefined;
  } catch {
    return undefined;
  }
}

async function findSubtitleFont() {
  for (const family of subtitleFontFamilies) {
    const fontFilePath = await matchFontFile(family);

    if (fontFilePath !== undefined) {
      return fontFilePath;
    }
  }

  for (const candidate of subtitleFontFileFallbacks) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `No subtitle font found. Tried fc-match for ${subtitleFontFamilies.join(', ')} and known paths ${subtitleFontFileFallbacks.join(', ')}.`,
  );
}

function buildSubtitleFilter(fontFilePath, testName) {
  return [
    'drawtext=',
    `fontfile=${quoteFilterValue(fontFilePath)}`,
    `:text=${quoteFilterValue(testName)}`,
    ':fontsize=20',
    ':fontcolor=white',
    ':box=1',
    ':boxcolor=black@0.55',
    ':boxborderw=10',
    ':x=(w-text_w)/2',
    ':y=h-text_h-14',
    ':expansion=none',
  ].join('');
}

async function probeVideo(filePath) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'stream=codec_name,codec_type,width,height:format=duration',
    '-of',
    'json',
    filePath,
  ]);

  let parsed;

  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error(`ffprobe returned invalid JSON for ${filePath}.`);
  }

  const streams = isRecord(parsed) && Array.isArray(parsed.streams) ? parsed.streams : [];
  const videoStream = streams.find(
    (stream) => isRecord(stream) && readStringProperty(stream, 'codec_type') === 'video' && readStringProperty(stream, 'codec_name') !== undefined,
  );

  if (!isRecord(videoStream)) {
    throw new Error(`No video stream found in ${filePath}.`);
  }

  const format = isRecord(parsed) && isRecord(parsed.format) ? parsed.format : undefined;
  const duration = format === undefined ? undefined : readFiniteNumberProperty(format, 'duration');
  const width = readNumberProperty(videoStream, 'width');
  const height = readNumberProperty(videoStream, 'height');

  if (duration === undefined || duration <= 0) {
    throw new Error(`Could not read a valid duration for ${filePath}.`);
  }

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error(`Could not read valid dimensions for ${filePath}.`);
  }

  return {
    codec: readStringProperty(videoStream, 'codec_name'),
    width,
    height,
    duration,
  };
}

async function readManifest(manifestPath) {
  const content = await readFile(manifestPath, 'utf8');
  const entries = new Map();
  const warnings = [];
  let lineNumber = 0;

  for (const line of content.split('\n')) {
    lineNumber += 1;

    const trimmedLine = line.trim();

    if (trimmedLine === '') {
      continue;
    }

    let parsed;

    try {
      parsed = JSON.parse(trimmedLine);
    } catch {
      warnings.push(`manifest line ${String(lineNumber)} is not valid JSON and was skipped: ${trimmedLine}`);
      continue;
    }

    if (!isRecord(parsed)) {
      warnings.push(`manifest line ${String(lineNumber)} is not an object and was skipped: ${trimmedLine}`);
      continue;
    }

    const session = readStringProperty(parsed, 'session');
    const testName = readStringProperty(parsed, 'testName');

    if (session === undefined || testName === undefined) {
      warnings.push(`manifest line ${String(lineNumber)} is missing session or testName and was skipped: ${trimmedLine}`);
      continue;
    }

    if (entries.has(session)) {
      warnings.push(`manifest contains duplicate entries for session ${session}; keeping the last one.`);
    }

    entries.set(session, testName);
  }

  return {
    entries: [...entries.entries()].map(([session, testName]) => ({ session, testName })),
    warnings,
  };
}

function collectSessionSegmentNames(session, webmFileNames) {
  const segmentPattern = new RegExp(`^${escapeRegExp(session)}(?:-part(\\d+))?\\.webm$`);
  const matches = [];

  for (const fileName of webmFileNames) {
    const match = segmentPattern.exec(fileName);

    if (match === null) {
      continue;
    }

    matches.push({ fileName, part: match[1] === undefined ? 1 : Number(match[1]) });
  }

  matches.sort((left, right) => left.part - right.part || left.fileName.localeCompare(right.fileName));

  return matches.map((match) => match.fileName);
}

async function stitchSession({ session, testName, slug, segmentFileNames }) {
  const baseFileName = `${session}.webm`;

  if (!segmentFileNames.includes(baseFileName)) {
    throw new Error(`base recording ${baseFileName} is missing; refusing to stitch partial segments.`);
  }

  const segmentPaths = segmentFileNames.map((fileName) => join(recordingsDirectory, fileName));
  const segmentProbes = [];

  for (const [index, segmentPath] of segmentPaths.entries()) {
    const probe = await probeVideo(segmentPath);

    segmentProbes.push(probe);
    console.log(
      `${logPrefix}   segment ${segmentFileNames[index]}: ${probe.duration.toFixed(1)}s ${probe.codec} ${String(probe.width)}x${String(probe.height)}`,
    );
  }

  const referenceProbe = segmentProbes[0];
  const expectedDuration = segmentProbes.reduce((total, probe) => total + probe.duration, 0);

  for (const [index, probe] of segmentProbes.entries()) {
    if (probe.width !== referenceProbe.width || probe.height !== referenceProbe.height) {
      throw new Error(
        `segment ${segmentFileNames[index]} is ${String(probe.width)}x${String(probe.height)}, expected ${String(referenceProbe.width)}x${String(referenceProbe.height)}.`,
      );
    }
  }

  const fontFilePath = await findSubtitleFont();
  const subtitleFilter = buildSubtitleFilter(fontFilePath, testName);
  const outputFileName = `${slug}.webm`;
  const outputPath = join(recordingsDirectory, outputFileName);

  console.log(`${logPrefix}   font: ${fontFilePath}`);
  console.log(`${logPrefix}   burning test name "${testName}" and stitching ${String(segmentPaths.length)} segment(s)...`);

  const workDirectory = await mkdtemp(join(tmpdir(), 'stitch-e2e-'));

  try {
    const concatListPath = join(workDirectory, 'concat.txt');

    await writeFile(concatListPath, `${segmentPaths.map(formatConcatListEntry).join('\n')}\n`, 'utf8');

    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatListPath,
        '-map',
        '0:v:0',
        '-an',
        '-vf',
        subtitleFilter,
        '-c:v',
        'libvpx',
        '-deadline',
        'good',
        '-cpu-used',
        '2',
        '-crf',
        '10',
        '-b:v',
        '2M',
        '-pix_fmt',
        'yuv420p',
        outputPath,
      ]);
    } catch (error) {
      throw new Error(`ffmpeg failed for session ${session}: ${error.message}`);
    }

    const outputProbe = await probeVideo(outputPath);

    if (outputProbe.codec !== 'vp8') {
      throw new Error(`output codec is ${String(outputProbe.codec)}, expected vp8.`);
    }

    if (outputProbe.width !== referenceProbe.width || outputProbe.height !== referenceProbe.height) {
      throw new Error(
        `output is ${String(outputProbe.width)}x${String(outputProbe.height)}, expected ${String(referenceProbe.width)}x${String(referenceProbe.height)}.`,
      );
    }

    if (Math.abs(outputProbe.duration - expectedDuration) > durationToleranceSeconds) {
      throw new Error(
        `output duration ${outputProbe.duration.toFixed(2)}s differs from the ${expectedDuration.toFixed(2)}s segment total by more than ${String(durationToleranceSeconds)}s.`,
      );
    }

    for (const segmentPath of segmentPaths) {
      await unlink(segmentPath);
    }

    return {
      outputFileName,
      duration: outputProbe.duration,
      expectedDuration,
      segmentCount: segmentPaths.length,
    };
  } catch (error) {
    await rm(outputPath, { force: true });
    throw error;
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
  }
}

async function main() {
  if (!(await pathExists(recordingsDirectory))) {
    console.log(`${logPrefix} no recordings directory at ${recordingsDirectory}; nothing to stitch.`);

    return;
  }

  await precheckVideoTools();

  const manifestPath = join(recordingsDirectory, 'manifest.json');
  const manifestExists = await pathExists(manifestPath);
  const manifest = manifestExists ? await readManifest(manifestPath) : { entries: [], warnings: [] };
  const warnings = [...manifest.warnings];
  const failures = [];
  const stitchedSessions = new Set();
  const droppedSessions = new Set();
  const claimedFileNames = new Set();
  const seenSlugs = new Set();
  let removedSegmentCount = 0;

  const webmFileNames = (await readdir(recordingsDirectory)).filter((fileName) => fileName.endsWith('.webm')).sort();

  for (const entry of [...manifest.entries].sort((left, right) => left.session.localeCompare(right.session))) {
    const segmentFileNames = collectSessionSegmentNames(entry.session, webmFileNames);

    segmentFileNames.forEach((fileName) => claimedFileNames.add(fileName));

    if (segmentFileNames.length === 0) {
      warnings.push(`manifest entry for session ${entry.session} has no recordings (test may have failed before recording started); dropping the entry.`);
      droppedSessions.add(entry.session);
      continue;
    }

    const slug = slugifyTestName(entry.testName);

    if (seenSlugs.has(slug)) {
      failures.push(`session ${entry.session}: test name "${entry.testName}" produces slug "${slug}" that was already used by another session.`);
      continue;
    }

    seenSlugs.add(slug);
    console.log(`${logPrefix} session ${entry.session} ("${entry.testName}") -> ${slug}.webm`);

    try {
      const result = await stitchSession({ session: entry.session, testName: entry.testName, slug, segmentFileNames });

      stitchedSessions.add(entry.session);
      removedSegmentCount += result.segmentCount;
      console.log(
        `${logPrefix}   stitched ${result.outputFileName}: ${result.duration.toFixed(1)}s (expected ${result.expectedDuration.toFixed(1)}s), removed ${String(result.segmentCount)} raw segment(s)`,
      );
    } catch (error) {
      failures.push(`session ${entry.session}: ${error instanceof Error ? error.message : String(error)} (raw segments kept)`);
    }
  }

  for (const fileName of webmFileNames) {
    if (claimedFileNames.has(fileName)) {
      continue;
    }

    if (rawRecordingNamePattern.test(fileName)) {
      warnings.push(`orphan recording without a manifest entry, keeping: ${fileName}`);
    } else {
      console.log(`${logPrefix} leaving existing non-recording file untouched: ${fileName}`);
    }
  }

  if (manifestExists) {
    const remainingEntries = manifest.entries.filter(
      (entry) => !stitchedSessions.has(entry.session) && !droppedSessions.has(entry.session),
    );

    if (remainingEntries.length === 0) {
      await rm(manifestPath, { force: true });
      console.log(`${logPrefix} manifest consumed and removed.`);
    } else if (remainingEntries.length !== manifest.entries.length) {
      await writeFile(manifestPath, `${remainingEntries.map((entry) => JSON.stringify({ session: entry.session, testName: entry.testName })).join('\n')}\n`, 'utf8');
      console.log(`${logPrefix} kept ${String(remainingEntries.length)} manifest entr${remainingEntries.length === 1 ? 'y' : 'ies'} for unstitched sessions.`);
    }
  }

  for (const warning of warnings) {
    console.warn(`${logPrefix} warning: ${warning}`);
  }

  for (const failure of failures) {
    console.error(`${logPrefix} error: ${failure}`);
  }

  console.log(
    `${logPrefix} done: stitched ${String(stitchedSessions.size)} video(s), removed ${String(removedSegmentCount)} raw segment(s), ${String(warnings.length)} warning(s), ${String(failures.length)} failure(s).`,
  );

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`${logPrefix} ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  process.exitCode = 1;
});
