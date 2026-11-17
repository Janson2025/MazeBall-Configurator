export const pickupPoints = 180
export const finishPoints = 4000

export function raceScore(milliseconds, collected) {
  const seconds = milliseconds / 1000
  const penalty = Math.floor(12 * seconds + 0.4 * seconds ** 2)
  return { penalty, points: finishPoints + collected * pickupPoints - penalty }
}
