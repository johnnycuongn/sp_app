export function isNumeric(str: string) {
  if (typeof str != 'string') return false // we only process strings!

  return !isNaN(Number(str))
}

/**
 * Valid when string is:
 * 
 * - A type of string
 * - Not empty
 * - Not whitespace only
 */
export function isStringValid(str?: string | any):boolean {
  if (str) {
    if (typeof str == 'string') {
      return str.trim().length !== 0
    } else return false
  }
  return false
}