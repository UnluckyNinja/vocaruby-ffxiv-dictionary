
export const BASE_BY_LANG = {
  en: 'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/en/',
  cn: 'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/',
  ja: 'https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/ja/'
}

export const CSV_FILES = {
  Item: {
    path: './Item.csv',
    column: 10,
  },
  Action: {
    path: './Action.csv',
    column: 1,
  },
  ClassJob: {
    path: './ClassJob.csv',
    column: 1,
  },
  Emote: {
    path: './Emote.csv',
    column: 1,
  },
  Trait: {
    path: './Trait.csv',
    column: 1,
  },
  Status: {
    path: './Status.csv',
    column: 1,
  },
  CraftAction: {
    path: './CraftAction.csv',
    column: 1,
  },
  GeneralAction: {
    path: './GeneralAction.csv',
    column: 1,
  },
  PlaceName: {
    path: './PlaceName.csv',
    column: 1,
  },
  BNpcName: {
    path: './BNpcName.csv',
    column: 1,
  },
  ENpcResident: {
    path: './ENpcResident.csv',
    column: 1,
  },
  ContentFinderCondition: {
    path: './ContentFinderCondition.csv',
    column: 44,
  },
  Companion: {
    path: './Companion.csv',
    column: 1,
  },
  Mount: {
    path: './Mount.csv',
    column: 1,
  },
  EventAction: {
    path: './EventAction.csv',
    column: 1,
  },
}

// const cache = new Map<string, string>()

export async function fetchContent(name: keyof typeof CSV_FILES, lang: keyof typeof BASE_BY_LANG) {
  // const key = `${name}-${lang}`
  // if (cache.has(key)) {
  //   return cache.get(key)!
  // }
  const option = CSV_FILES[name]
  const url_from = new URL(option.path, BASE_BY_LANG[lang])
  console.debug(`Fetching ${url_from}`)
  const text = await (await fetch(url_from)).text()
  // cache.set(key, text)
  return text
}