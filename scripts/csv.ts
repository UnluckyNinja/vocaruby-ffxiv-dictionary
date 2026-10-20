import { csvParseRows } from 'd3-dsv'

export interface ParseOptions {
  skipRows?: number
  indexRow?: number
  labelRow?: number
  keepIndexes?: number[]
}

export function parseFFxivCSV(text: string, options: ParseOptions | undefined, asObj: true | undefined): {[key: string]: string}[]
export function parseFFxivCSV(text: string, options: ParseOptions | undefined, asObj: false): string[][]
export function parseFFxivCSV(text: string, options: ParseOptions = { skipRows: 4, indexRow: 0, labelRow: 1 }, asObj = true) {
  const {skipRows = 4, indexRow = 0, labelRow = 1, keepIndexes} = options

  if (keepIndexes && keepIndexes.length === 0) {
    throw new Error('Invalid keepIndexes option, either omit or length > 0')
  }

  if (indexRow >= skipRows || labelRow >= skipRows) {
    throw new Error('Index row/label row must be in skipped rows')
  }

  const lineends = [0]

  for (let i = skipRows; i > 0; --i) {
    const start = lineends.at(-1)!
    const found = text.indexOf('\n', start > 0 ? start + 1 : start)
    if (!found) {
      throw new Error(`No such many lines in provided text. Want to skip ${skipRows}, skipped ${skipRows - i} .`)
    }
    lineends.push(found)
  }
  
  // let lineend0 = text.indexOf('\n') // key,0,1 ...
  // let lineend1 = text.indexOf('\n', lineend0+1) // #, Name, ...
  // let lineend2 = text.indexOf('\n', lineend1+1) // int,str, ...
  // let lineend3 = text.indexOf('\n', lineend2+1) // 0, '', ...

  let idxes = null
  if (indexRow >= 0) {
    const start = lineends[indexRow]!
    const end = lineends[indexRow+1]!
    idxes = text.slice(start > 0 ? start + 1 : start, end).split(',').map(it=>it.replaceAll(/\r/g, ''))
  }
  let labels = null
  if (labelRow >= 0) {
    const start = lineends[labelRow]!
    const end = lineends[labelRow+1]!
    labels = text.slice(start > 0 ? start + 1 : start, end).split(',').map(it=>it.replaceAll(/\r/g, ''))
  }

  const keyNames = (function(){
    if(!idxes && !labels) return [] 
    if(idxes && !labels) return idxes
    if(!idxes && labels) return labels.map((label,idx)=>`${idx}: ${label}`)
    return idxes!.map((id, idx)=>{
      return `${id}: ${labels![idx]}`
    })
  })()

  function getKeyName(idx: number) {
    return keyNames[idx] ?? idx
  }

  const contentStart = lineends.at(-1)! > 0 ? lineends.at(-1)! + 1 : lineends.at(-1)

  if (asObj) {
    const data = csvParseRows(text.slice(contentStart), (d, i)=>{
      return Object.fromEntries(d.map((datum, idx)=>{
        if (keepIndexes && !keepIndexes.includes(idx)) {
          return null
        }
        return [getKeyName(idx), datum]
      }).filter(it=>it !== null))
    })
    return data as {[key: string]: string}[]
  } else {
    const data = csvParseRows(text.slice(contentStart), (d, i)=>{
      if (keepIndexes) {
        return d.filter((_,idx)=>keepIndexes.includes(idx))
      }
      return d
    })
    return data
  }
}