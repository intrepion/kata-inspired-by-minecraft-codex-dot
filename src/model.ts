export const SIZE = 40,
  HEIGHT = 24;
export const PLAYER_RADIUS = 0.3,
  PLAYER_HEIGHT = 1.7;
export const validPoint = (p: Point) =>
  p && [p.x, p.y, p.z].every(Number.isFinite);
export const blocks = [
  "air",
  "grass",
  "dirt",
  "stone",
  "wood",
  "leaf",
  "board",
  "glow",
  "bedrock",
] as const;
export type Block = (typeof blocks)[number];
export type Point = { x: number; y: number; z: number };
export const items = [
  "dirt",
  "stone",
  "wood",
  "leaf",
  "board",
  "glow",
] as const;
export type Item = (typeof items)[number];
export type Inventory = Record<Item, number>;
export const emptyInventory = (): Inventory => ({
  dirt: 0,
  stone: 0,
  wood: 0,
  leaf: 0,
  board: 0,
  glow: 0,
});
export const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
export class World {
  readonly cells = new Map<string, Block>();
  readonly edits = new Map<string, Block>();
  constructor(readonly seed = 731) {
    for (let x = 0; x < SIZE; x++)
      for (let z = 0; z < SIZE; z++) {
        const h = this.surface(x, z);
        for (let y = 0; y <= h; y++)
          this.cells.set(
            key(x, y, z),
            y === 0
              ? "bedrock"
              : y === h
                ? "grass"
                : y >= h - 2
                  ? "dirt"
                  : "stone",
          );
      }
    for (let x = 3; x < 37; x += 6)
      for (let z = 3; z < 37; z += 7) {
        if (x >= 15 && x <= 25 && z >= 15 && z <= 25) continue;
        const h = this.surface(x, z);
        for (let y = h + 1; y <= h + 4; y++)
          this.cells.set(key(x, y, z), "wood");
        for (let dx = -2; dx <= 2; dx++)
          for (let dz = -2; dz <= 2; dz++)
            for (let dy = 3; dy <= 5; dy++)
              if (
                Math.abs(dx) + Math.abs(dz) < 4 &&
                !(dx === 0 && dz === 0 && dy < 5)
              )
                this.cells.set(key(x + dx, h + dy, z + dz), "leaf");
      }
    // Opening resources beside the clearing, reachable from ground level.
    for (const x of [18, 20])
      for (let y = 5; y <= 8; y++) this.cells.set(key(x, y, 16), "wood");
    for (let x = 23; x <= 26; x++) this.cells.set(key(x, 5, 18), "stone");
  }
  surface(x: number, z: number) {
    if (x >= 14 && x <= 27 && z >= 14 && z <= 27) return 4;
    return Math.max(
      3,
      Math.min(
        7,
        Math.floor(
          4.8 +
            1.3 * Math.sin((x + (this.seed % 13)) * 0.23) +
            1.2 * Math.cos(z * 0.27) +
            0.8 * Math.sin((x + z) * 0.4),
        ),
      ),
    );
  }
  inBounds(x: number, y: number, z: number) {
    return (
      [x, y, z].every(Number.isInteger) &&
      x >= 0 &&
      x < SIZE &&
      z >= 0 &&
      z < SIZE &&
      y >= 0 &&
      y < HEIGHT
    );
  }
  get(x: number, y: number, z: number): Block {
    return this.cells.get(key(x, y, z)) ?? "air";
  }
  set(x: number, y: number, z: number, b: Block) {
    if (
      !blocks.includes(b) ||
      b === "bedrock" ||
      !this.inBounds(x, y, z) ||
      y === 0
    )
      return false;
    const k = key(x, y, z);
    if (b === "air") this.cells.delete(k);
    else this.cells.set(k, b);
    this.edits.set(k, b);
    return true;
  }
  collides(p: Point) {
    if (!validPoint(p)) return true;
    for (
      let x = Math.floor(p.x - PLAYER_RADIUS);
      x <= Math.floor(p.x + PLAYER_RADIUS);
      x++
    )
      for (let y = Math.floor(p.y); y <= Math.floor(p.y + PLAYER_HEIGHT); y++)
        for (
          let z = Math.floor(p.z - PLAYER_RADIUS);
          z <= Math.floor(p.z + PLAYER_RADIUS);
          z++
        )
          if (
            x < 0 ||
            x >= SIZE ||
            z < 0 ||
            z >= SIZE ||
            y < 0 ||
            this.get(x, y, z) !== "air"
          )
            return true;
    return false;
  }
  safeSpawn(): Point {
    for (let radius = 0; radius < 19; radius++)
      for (let x = 20 - radius; x <= 20 + radius; x++)
        for (let z = 20 - radius; z <= 20 + radius; z++)
          for (let y = 5; y < HEIGHT - 2; y++) {
            const p = { x: x + 0.5, y: y + 0.01, z: z + 0.5 };
            if (this.get(x, y - 1, z) !== "air" && !this.collides(p)) return p;
          }
    return { x: 20.5, y: HEIGHT + 1, z: 20.5 };
  }
}
export const recipes = {
  boards: { label: "Timber boards", cost: { wood: 4 }, output: { board: 8 } },
  pick: { label: "Stoneworker pick", cost: { wood: 2, board: 2 }, output: {} },
  glow: {
    label: "Amber glow",
    cost: { board: 2, stone: 1 },
    output: { glow: 2 },
  },
} as const;
export type Recipe = keyof typeof recipes;
export class Game {
  world: World;
  inventory = emptyInventory();
  pick = false;
  gatheredStone = false;
  get placedBoards() {
    return [...this.world.edits.values()].filter((b) => b === "board").length;
  }
  get placedGlow() {
    return [...this.world.edits.values()].filter((b) => b === "glow").length;
  }
  constructor(seed = 731) {
    this.world = new World(seed);
  }
  mine(p: Point) {
    const b = this.world.get(p.x, p.y, p.z);
    if (b === "air" || b === "bedrock" || (b === "stone" && !this.pick))
      return false;
    if (!this.world.set(p.x, p.y, p.z, "air")) return false;
    const item = b === "grass" ? "dirt" : (b as Item);
    this.inventory[item]++;
    if (b === "stone") this.gatheredStone = true;
    return true;
  }
  canCraft(id: Recipe) {
    return (
      Object.hasOwn(recipes, id) &&
      !(id === "pick" && this.pick) &&
      Object.entries(recipes[id].cost).every(
        ([i, n]) => this.inventory[i as Item] >= n,
      )
    );
  }
  craft(id: Recipe) {
    if (!this.canCraft(id)) return false;
    const recipe = recipes[id];
    for (const [item, count] of Object.entries(recipe.cost))
      this.inventory[item as Item] -= count;
    for (const [item, count] of Object.entries(recipe.output))
      this.inventory[item as Item] += count;
    if (id === "pick") this.pick = true;
    return true;
  }
  place(p: Point, item: Item, player: Point) {
    if (
      !validPoint(player) ||
      !items.includes(item) ||
      this.inventory[item] <= 0 ||
      this.world.get(p.x, p.y, p.z) !== "air"
    )
      return false;
    if (
      p.x + 1 > player.x - PLAYER_RADIUS &&
      p.x < player.x + PLAYER_RADIUS &&
      p.z + 1 > player.z - PLAYER_RADIUS &&
      p.z < player.z + PLAYER_RADIUS &&
      p.y + 1 > player.y &&
      p.y < player.y + PLAYER_HEIGHT
    )
      return false;
    if (!this.world.set(p.x, p.y, p.z, item)) return false;
    this.inventory[item]--;
    return true;
  }
}
export function encodeSave(game: Game, player: Point) {
  return JSON.stringify({
    version: 1,
    seed: game.world.seed,
    inventory: game.inventory,
    pick: game.pick,
    gatheredStone: game.gatheredStone,
    placedBoards: game.placedBoards,
    placedGlow: game.placedGlow,
    edits: [...game.world.edits],
    player,
  });
}
export function decodeSave(raw: string): { game: Game; player: Point } | null {
  try {
    if (raw.length > 2_000_000) return null;
    const s = JSON.parse(raw);
    const count = (v: unknown) =>
      typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 100000;
    if (
      s.version !== 1 ||
      !count(s.seed) ||
      typeof s.pick !== "boolean" ||
      (s.gatheredStone !== undefined && typeof s.gatheredStone !== "boolean") ||
      !count(s.placedBoards) ||
      !count(s.placedGlow) ||
      !s.inventory ||
      !items.every((i) => count(s.inventory[i])) ||
      !Array.isArray(s.edits) ||
      s.edits.length > SIZE * SIZE * HEIGHT ||
      !s.player ||
      !["x", "y", "z"].every((i) => Number.isFinite(s.player[i]))
    )
      return null;
    const game = new Game(s.seed);
    const seen = new Set<string>();
    for (const edit of s.edits) {
      if (
        !Array.isArray(edit) ||
        edit.length !== 2 ||
        typeof edit[0] !== "string" ||
        seen.has(edit[0]) ||
        !blocks.includes(edit[1]) ||
        edit[1] === "bedrock"
      )
        return null;
      const coords = edit[0].split(",").map(Number);
      if (
        coords.length !== 3 ||
        key(coords[0], coords[1], coords[2]) !== edit[0] ||
        !game.world.set(coords[0], coords[1], coords[2], edit[1])
      )
        return null;
      seen.add(edit[0]);
    }
    game.inventory = { ...s.inventory };
    game.pick = s.pick;
    game.gatheredStone =
      s.gatheredStone ?? (s.inventory.stone > 0 || game.placedGlow > 0);
    if (
      game.placedBoards !== s.placedBoards ||
      game.placedGlow !== s.placedGlow
    )
      return null;
    let player = s.player as Point;
    if (player.y < 1 || player.y > HEIGHT + 3 || game.world.collides(player))
      player = game.world.safeSpawn();
    return { game, player };
  } catch {
    return null;
  }
}
