/**
 * Remove empty properties in an object
 *
 * - Empty string
 *
 * - String with only whitespaces
 *
 * - Number 0
 *
 * **WARNING**: This mutates the given object instead of returning a new one.
 */
export function removeEmpty(obj: any) {
  const isValueEmpty = (k: string) => {
    const emptyString = typeof obj[k] === 'string' && obj[k].trim().length === 0
    const empty = obj[k] == null
    const emptyNumber = typeof obj[k] === 'number' && obj[k] === 0

    return empty || emptyString || emptyNumber
  }

  Object.keys(obj).forEach((k) => isValueEmpty(k) && delete obj[k])
}
