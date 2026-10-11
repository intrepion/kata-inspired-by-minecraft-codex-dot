import { expect, it } from "vitest";
import { World } from "./model";
it("same seed yields same terrain and immutable glade limits", () => {
  const a = new World(42),
    b = new World(42);
  expect(a.get(7, 2, 7)).toBe(b.get(7, 2, 7));
  expect(a.set(-1, 4, 4, "wood")).toBe(false);
  expect(a.set(4, 0, 4, "air")).toBe(false);
  expect(a.get(4, 0, 4)).toBe("bedrock");
});
import { Game } from "./model";
it("gathers finite wood, crafts boards atomically and rejects overlap", () => {
  const g = new Game();
  expect(g.mine({ x: 20, y: 5, z: 16 })).toBe(true);
  expect(g.mine({ x: 20, y: 5, z: 16 })).toBe(false);
  expect(g.inventory.wood).toBe(1);
  expect(g.craft("boards")).toBe(false);
  for (let y = 6; y <= 8; y++) g.mine({ x: 20, y, z: 16 });
  expect(g.craft("boards")).toBe(true);
  expect(g.inventory.wood).toBe(0);
  expect(g.inventory.board).toBe(8);
  const p = { x: 20, y: 5, z: 20 };
  expect(g.place(p, "board", { x: 20.5, y: 5, z: 20.5 })).toBe(false);
  expect(g.inventory.board).toBe(8);
  expect(g.place(p, "board", { x: 22.5, y: 5, z: 20.5 })).toBe(true);
  expect(g.inventory.board).toBe(7);
});
import { encodeSave, decodeSave } from "./model";
it("roundtrips edits and rejects a corrupt snapshot without partial state", () => {
  const g = new Game();
  g.mine({ x: 20, y: 5, z: 16 });
  const raw = encodeSave(g, { x: 20.5, y: 5.01, z: 20.5 });
  const loaded = decodeSave(raw);
  expect(loaded?.game.inventory.wood).toBe(1);
  expect(loaded?.game.world.get(20, 5, 16)).toBe("air");
  expect(decodeSave(raw.replace('"wood":1', '"wood":-2'))).toBe(null);
  expect(decodeSave("{broken")).toBe(null);
});
it("pick unlocks finite stone, crafting and building complete a resource-conserving loop", () => {
  const g = new Game();
  expect(g.mine({ x: 23, y: 5, z: 18 })).toBe(false);
  for (let y = 5; y <= 8; y++) g.mine({ x: 20, y, z: 16 });
  for (let y = 5; y <= 8; y++) g.mine({ x: 18, y, z: 16 });
  expect(g.craft("boards")).toBe(true);
  expect(g.craft("pick")).toBe(true);
  expect(g.craft("pick")).toBe(false);
  expect(g.mine({ x: 23, y: 5, z: 18 })).toBe(true);
  expect(g.craft("glow")).toBe(true);
  expect(g.inventory.stone).toBe(0);
  expect(g.inventory.board).toBe(4);
  for (let x = 15; x <= 18; x++)
    expect(
      g.place({ x, y: 5, z: 21 }, "board", { x: 20.5, y: 5, z: 20.5 }),
    ).toBe(true);
  expect(
    g.place({ x: 19, y: 5, z: 21 }, "board", { x: 20.5, y: 5, z: 20.5 }),
  ).toBe(false);
  expect(g.inventory.board).toBe(0);
  expect(
    g.place({ x: 15, y: 6, z: 21 }, "glow", { x: 20.5, y: 5, z: 20.5 }),
  ).toBe(true);
});
it("collision protects walls, floor and world edges; recovery finds headroom", () => {
  const w = new World();
  expect(w.collides({ x: 20.5, y: 4, z: 20.5 })).toBe(true);
  expect(w.collides({ x: 0.1, y: 10, z: 20 })).toBe(true);
  const spawn = w.safeSpawn();
  expect(w.collides(spawn)).toBe(false);
  w.set(20, 5, 20, "board");
  expect(w.collides(spawn)).toBe(true);
  expect(w.collides(w.safeSpawn())).toBe(false);
});
it("save rejects unsupported versions, duplicate edits, bedrock edits and unsafe inventory", () => {
  const g = new Game();
  const s = JSON.parse(encodeSave(g, g.world.safeSpawn()));
  for (const change of [
    { version: 2 },
    { inventory: { ...g.inventory, wood: 1.5 } },
    { edits: [["20,0,20", "air"]] },
    {
      edits: [
        ["20,5,20", "wood"],
        ["20,5,20", "air"],
      ],
    },
    { edits: [["40,5,20", "wood"]] },
    { pick: "yes" },
  ])
    expect(decodeSave(JSON.stringify({ ...s, ...change }))).toBe(null);
  const loaded = decodeSave(
    JSON.stringify({ ...s, player: { x: -50, y: 8, z: 20 } }),
  );
  expect(loaded).not.toBe(null);
  expect(loaded!.game.world.collides(loaded!.player)).toBe(false);
});
it("public operations reject invalid runtime materials and recipes", () => {
  const g = new Game();
  expect(g.world.set(20, 6, 20, "lava" as never)).toBe(false);
  expect(g.craft("unknown" as never)).toBe(false);
});
it("invalid player inputs reject placement without consuming resources", () => {
  const g = new Game();
  g.inventory.board = 1;
  expect(
    g.place({ x: 20, y: 5, z: 20 }, "board", { x: NaN, y: 5, z: 20.5 }),
  ).toBe(false);
  expect(g.inventory.board).toBe(1);
  expect(g.world.collides({ x: NaN, y: 5, z: 20 })).toBe(true);
});
it("gathered stone stays completed after spending it, and mined building blocks reduce current placement totals", () => {
  const g = new Game();
  g.pick = true;
  g.mine({ x: 23, y: 5, z: 18 });
  g.inventory.board = 8;
  g.craft("glow");
  expect(g.gatheredStone).toBe(true);
  g.place({ x: 20, y: 5, z: 19 }, "board", { x: 20.5, y: 5, z: 20.5 });
  g.mine({ x: 20, y: 5, z: 19 });
  expect(g.placedBoards).toBe(0);
  expect(
    decodeSave(encodeSave(g, g.world.safeSpawn()))?.game.gatheredStone,
  ).toBe(true);
});
