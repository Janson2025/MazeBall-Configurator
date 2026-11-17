export const mazeSizes = [3, 5, 7, 9, 11, 13]
export const levelThemes = {
  3: { name: 'Clay Garden', color: '#bb775b', texture: 'clay' },
  5: { name: 'Slate Quarry', color: '#788ca5', texture: 'slate' },
  7: { name: 'Rootwood', color: '#987047', texture: 'wood' },
  9: { name: 'Basalt Furnace', color: '#644d50', texture: 'basalt' },
  11: { name: 'Steel Watch', color: '#65848b', texture: 'steel' },
  13: { name: 'Obsidian Vault', color: '#675183', texture: 'obsidian' },
}

export function levelDefaults(size) {
  return {
    mud: size >= 7 ? 2 : 0,
    lava: size >= 9 ? 2 : 0,
    gold: size >= 11 ? 2 : 0,
    chasers: size >= 13 ? 2 : Number(size >= 11),
    buddies: size === 3 ? 3 : 9,
    flee: size === 13,
  }
}
