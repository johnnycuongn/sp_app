/**
 * Get current months that have passed by in current year
 * 
 * 
 * @output ['January', 'Feburary']
 */
export function getMonthsOfYear(year: number): string[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  let monthsRange = 11

  if (currentYear == year) {
    monthsRange = currentDate.getMonth()
  }

  const months = [];

  for (let i = 0; i <= monthsRange; i++) {
    months.push(new Date(year, i).toLocaleString('default', { month: 'long' }));
  }

  return months
}

/**
 * 
 * Get quarter number from a month index
 * 
 * @param monthIndex 0-11
 * 
 * @returns {number} 0-3
 */
export function getQuarterFor(monthIndex: number) {
  let quarter;

  if (monthIndex >= 0 && monthIndex <= 2) {
    quarter = 0;
  } else if (monthIndex >= 3 && monthIndex <= 5) {
    quarter = 1;
  } else if (monthIndex >= 6 && monthIndex <= 8) {
    quarter = 2;
  } else {
    quarter = 3;
  }

  return quarter
}