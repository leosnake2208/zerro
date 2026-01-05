/**
 * Lingva Translate API service
 * Uses Lingva as a free translation API (Google Translate frontend)
 */

const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://lingva.lunar.icu',
  'https://translate.plausibility.cloud',
]

let currentInstanceIndex = 0

async function fetchWithFallback(
  path: string,
  retries = LINGVA_INSTANCES.length
): Promise<Response> {
  const instance = LINGVA_INSTANCES[currentInstanceIndex]
  const url = `${instance}${path}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return response
  } catch (error) {
    if (retries > 1) {
      currentInstanceIndex =
        (currentInstanceIndex + 1) % LINGVA_INSTANCES.length
      return fetchWithFallback(path, retries - 1)
    }
    throw error
  }
}

export type TranslationResult = {
  translation: string
  detectedLanguage?: string
}

/**
 * Translate text using Lingva API
 * @param text Text to translate
 * @param target Target language code (default: 'en')
 * @param source Source language code (default: 'auto' for auto-detect)
 */
export async function translate(
  text: string,
  target: string = 'en',
  source: string = 'auto'
): Promise<TranslationResult> {
  if (!text || text.trim() === '') {
    return { translation: '' }
  }

  const encodedText = encodeURIComponent(text)
  const path = `/api/v1/${source}/${target}/${encodedText}`

  const response = await fetchWithFallback(path)
  const data = await response.json()

  return {
    translation: data.translation || '',
    detectedLanguage: data.info?.detectedSource,
  }
}

/**
 * Translate multiple texts at once
 */
export async function translateMultiple(
  texts: { key: string; text: string }[],
  target: string = 'en',
  source: string = 'auto'
): Promise<Record<string, TranslationResult>> {
  const results: Record<string, TranslationResult> = {}

  // Translate sequentially to avoid rate limiting
  for (const { key, text } of texts) {
    if (text && text.trim()) {
      try {
        results[key] = await translate(text, target, source)
      } catch (error) {
        console.error(`Failed to translate "${key}":`, error)
        results[key] = { translation: '' }
      }
    } else {
      results[key] = { translation: '' }
    }
  }

  return results
}
