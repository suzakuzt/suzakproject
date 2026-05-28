import { rename, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const assetsRoot = path.join(projectRoot, 'public', 'assets')
const DEFAULT_THRESHOLD_KB = 500
const DEFAULT_QUALITY = 80

const args = new Set(process.argv.slice(2))
const getNumberArg = (name, fallback) => {
  const prefix = `--${name}=`
  const raw = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
  const value = Number(raw)

  return Number.isFinite(value) && value > 0 ? value : fallback
}

const thresholdBytes = getNumberArg('threshold-kb', DEFAULT_THRESHOLD_KB) * 1024
const quality = Math.min(82, Math.max(75, getNumberArg('quality', DEFAULT_QUALITY)))
const dryRun = args.has('--dry-run')
const force = args.has('--force')
const writeOriginal = args.has('--in-place')
const imageExtensions = new Set(['.png', '.jpg', '.jpeg'])

const walkImages = async (dir) => {
  const { readdir } = await import('node:fs/promises')
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkImages(fullPath)))
      continue
    }

    if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath)
    }
  }

  return files
}

const getExistingSize = async (filePath) => {
  try {
    return (await stat(filePath)).size
  } catch {
    return 0
  }
}

const formatKb = (bytes) => `${Math.round((bytes / 1024) * 10) / 10}KB`

const compressOriginal = async (filePath, sourceSize) => {
  if (!writeOriginal || dryRun) {
    return 0
  }

  const ext = path.extname(filePath).toLowerCase()
  const tempPath = `${filePath}.tmp-compressed${ext}`
  const pipeline = sharp(filePath).rotate()

  if (ext === '.jpg' || ext === '.jpeg') {
    await pipeline
      .jpeg({
        mozjpeg: true,
        progressive: true,
        quality,
      })
      .toFile(tempPath)
  } else {
    await pipeline
      .png({
        compressionLevel: 9,
        effort: 10,
        palette: true,
        quality,
      })
      .toFile(tempPath)
  }

  const compressedSize = await getExistingSize(tempPath)
  if (compressedSize > 0 && compressedSize < sourceSize) {
    await rm(filePath)
    await rename(tempPath, filePath)
    return compressedSize
  }

  await rm(tempPath, { force: true })
  return sourceSize
}

const compressImage = async (filePath) => {
  const sourceSize = (await stat(filePath)).size
  if (sourceSize <= thresholdBytes) {
    return null
  }

  const parsed = path.parse(filePath)
  const outputPath = path.join(parsed.dir, `${parsed.name}.webp`)
  const existingSize = await getExistingSize(outputPath)
  const relativeSource = path.relative(projectRoot, filePath).replaceAll(path.sep, '/')
  const relativeOutput = path.relative(projectRoot, outputPath).replaceAll(path.sep, '/')

  if (existingSize > 0 && !force) {
    return {
      source: relativeSource,
      output: relativeOutput,
      before: sourceSize,
      after: existingSize,
      skipped: true,
    }
  }

  if (!dryRun) {
    await sharp(filePath)
      .rotate()
      .webp({
        effort: 5,
        quality,
      })
      .toFile(outputPath)
  }

  const originalAfter = await compressOriginal(filePath, sourceSize)

  return {
    source: relativeSource,
    output: relativeOutput,
    before: sourceSize,
    after: dryRun ? 0 : await getExistingSize(outputPath),
    originalAfter,
    skipped: false,
  }
}

const images = await walkImages(assetsRoot)
const results = (await Promise.all(images.map(compressImage))).filter(Boolean)

if (!results.length) {
  console.log(`No PNG/JPG/JPEG images above ${DEFAULT_THRESHOLD_KB}KB found in public/assets.`)
  process.exit(0)
}

console.table(
  results.map((result) => ({
    source: result.source,
    output: result.output,
    before: formatKb(result.before),
    after: result.after ? formatKb(result.after) : dryRun ? 'dry-run' : 'missing',
    saved: result.after ? formatKb(result.before - result.after) : dryRun ? 'dry-run' : 'n/a',
    original: result.originalAfter ? formatKb(result.originalAfter) : result.skipped ? 'unchanged' : 'unchanged',
    status: result.skipped ? 'exists' : dryRun ? 'dry-run' : 'written',
  })),
)
