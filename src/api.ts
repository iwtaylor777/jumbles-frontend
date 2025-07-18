// src/api.ts
export type Puzzle = { id: string; grid: string[][] };

const BASE = "https://jumbles-api.onrender.com";

export async function fetchToday(): Promise<Puzzle> {
  const r = await fetch(`${BASE}/puzzle/today`);
  if (!r.ok) throw new Error("API error");
  return r.json();
}

