import { useState, useMemo, useEffect } from "react";
import WORDS from "../data/words5.json";

const WORD_SET = new Set(WORDS);

const MAX_SWAPS = 12;

type Props = {
  initial: string[][];
  onSolved: (moves: number) => void;
};

export default function Grid({ initial, onSolved }: Props) {
  const [grid, setGrid] = useState(initial);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [swaps, setSwaps] = useState(0);

  // 🔍 recompute valid rows every render
  const validRows = useMemo(() => grid.map((r) => WORD_SET.has(r.join("").toLowerCase())), [grid]);

  // 🎉 notify parent when all four rows are words
  useEffect(() => {
    if (validRows.every(Boolean)) onSolved(swaps);
  }, [validRows, swaps, onSolved]);

  function swap(r: number, c: number) {
    if (swaps >= MAX_SWAPS) return;          // move limit
    if (!selected) {
      setSelected([r, c]);
      return;
    }
    const [sr, sc] = selected;
    if (sr === r && sc === c) {
      setSelected(null);
      return;
    }
    const next = grid.map((row) => [...row]);
    [next[sr][sc], next[r][c]] = [next[r][c], next[sr][sc]];
    setGrid(next);
    setSelected(null);
    setSwaps((s) => s + 1);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="inline-block">
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((ch, c) => {
              const isSel = selected?.[0] === r && selected?.[1] === c;
              const solved = validRows[r];
              return (
                <button
                  key={c}
                  onClick={() => swap(r, c)}
                  className={`w-12 h-12 border text-xl font-bold transition
                    ${solved ? "bg-emerald-300" : isSel ? "bg-blue-300" : "bg-white hover:bg-gray-200"}
                    ${swaps >= MAX_SWAPS && !solved ? "cursor-not-allowed opacity-50" : ""}`}
                  disabled={swaps >= MAX_SWAPS}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-sm">
        Swaps: <span className="font-semibold">{swaps}</span>/<span>{MAX_SWAPS}</span>
      </p>
    </div>
  );
}

