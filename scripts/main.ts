import { csvFormat, csvFormatRows, csvParseRows } from 'd3-dsv'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { BASE_BY_LANG, CSV_FILES, fetchContent } from './source.ts'
import { join } from 'node:path'
import { parseFFxivCSV } from './csv.ts'

async function main() {
  const outDir = await prepareFolder()
  console.info(`Prepared folder at ${outDir}`)
  const dupes_en = []
  const dupes_ja = []
  for (const _name of Object.keys(CSV_FILES)) {
    console.info(`Processing ${_name}`)
    const name = _name as keyof typeof CSV_FILES
    const text_en = await fetchContent(name, 'en')
    const text_cn = await fetchContent(name, 'cn')
    
    const en_cn = generateDictionary(name, text_en, text_cn)
    if (en_cn) {
      const filename = `${name}_dictionary_en-cn.csv`
      writeFile(join(outDir, filename), en_cn.text)
      dupes_en.push(...en_cn.dupes.values())
    }
    const text_ja = await fetchContent(name, 'ja')
    const ja_cn = generateDictionary(name, text_ja, text_cn)
    if (ja_cn) {
      const filename = `${name}_dictionary_ja-cn.csv`
      writeFile(join(outDir, filename), ja_cn.text)
      dupes_ja.push(...ja_cn.dupes.values())
    }
  }
  writeFile(join(outDir, `duplicates_en-cn.csv`), csvFormat(dupes_en.flat(1), ['file', 'original', 'translation']))
  writeFile(join(outDir, `duplicates_ja-cn.csv`), csvFormat(dupes_ja.flat(1), ['file', 'original', 'translation']))
}

function generateDictionary(name: keyof typeof CSV_FILES, fromText: string, toText: string) {
  const option = CSV_FILES[name]
  const words_from = parseFFxivCSV(fromText, { keepIndexes: [option.column] }, false)
  const words_to = parseFFxivCSV(toText, { keepIndexes: [option.column] }, false)
  const words = zipWords(words_from, words_to)
  words.sort((a, b) => {
    return a[0]!.localeCompare(b[0]!)
  })
  const map = new Map<string, string>()
  const dupes = new Map<string, {file: string, original: string, translation: string}[]>()
  for (const [_from, _to] of words) {
    const from = _from!
    const to = _to!
    if (map.has(from)) {
      const translation = map.get(from)!
      // duplicate but doesn't conflict
      if (translation === to) {
        continue
      }
      if (!dupes.has(from)) {
        // also add the one in use for comparison
        const array = [{file: name, original: from, translation }, {file:name, original: from, translation: to}]
        dupes.set(from, array)
      } else {
        const array = dupes.get(from)!
        // can be duplicated with another dupe
        if (array.find(it=>it.translation === to)) {
          continue
        }
        array.push({file:name, original: from, translation: to})
      }
      continue
    }
    map.set(from, to)
  }
  const text = csvFormatRows([...map.entries()])
  return {
    text,
    dupes,
  }
}

const invalid_RE = /(^[?？]+$|【未使用】|●未使用|削除予定)/

function zipWords(original: string[][], translation: string[][]) {
  const length = Math.min(original.length, translation.length)
  const wordsPair = []
  for (let idx = 0; idx < length; idx++) {
    const originalWord = original[idx]![0]
    const translatedWord = translation[idx]![0]

    // empty string
    if (!originalWord || !translatedWord) continue
    // untranslated
    if (originalWord === translatedWord) continue
    // single character string
    if (originalWord.length <= 1) continue
    // deprecated
    if (invalid_RE.test(originalWord)) continue
    wordsPair.push([originalWord, translatedWord])
  }
  return wordsPair
}

async function prepareFolder() {
  const dir = fileURLToPath(new URL('../dist', import.meta.url))

  await mkdir(dir, { recursive: true })
  return dir
}

main()