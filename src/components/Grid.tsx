// src/components/Grid.tsx
import { useState, useMemo, useEffect } from "react";
import WORDS from "../data/words5";          // <-- import the TS word list

const WORD_SET = new Set(WORDS);
const MAX_SWAPS = 12;

type Props = {
  initial: string[][];               // 4 × 5 grid of letters
  onSolved: (moves: number) => void; // notify parent when solved
};

export default function Grid({ initial, onSolved }: Props) {
  const [grid, setGrid] = useState(initial);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [swaps, setSwaps] = useState(0);

  /* ---------- Helpers ---------- */

  // which rows are currently real words?
  const validRows = useMemo(
    () => grid.map((row) => WORD_SET.has(row.join("").toLowerCase())),
    [grid]
  );

  // fire callback once when puzzle is solved
  useEffect(() => {
    if (validRows.every(Boolean)) {
      onSolved(swaps);
    }
  }, [validRows, swaps, onSolved]);

  function swap(r: number, c: number) {
    if (swaps >= MAX_SWAPS) return; // swap limit reached
    if (!selected) {
      setSelected([r, c]);
      return;
    }

    const [sr, sc] = selected;
    if (sr === r && sc === c) {
      setSelected(null);            // deselect same cell
      return;
    }

    const next = grid.map((row) => [...row]);
    [next[sr][sc], next[r][c]] = [next[r][c], next[sr][sc]];
    setGrid(next);
    setSelected(null);
    setSwaps((s) => s + 1);
  }

  /* ---------- Render ---------- */

  return (
    <div className="flex flex-col items-center gap-4">
      {/* letter grid */}
      <div className="inline-block">
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((ch, c) => {
              const isSel   = selected?.[0] === r && selected?.[1] === c;
              const solved  = validRows[r];
              const disabled = swaps >= MAX_SWAPS && !solved;

              return (
                <button
                  key={c}
                  onClick={() => swap(r, c)}
                  className={`w-14 h-14 sm:w-16 sm:h-16
                    rounded-lg border-2 border-gray-300
                    text-2xl sm:text-3xl font-bold
                    flex items-center justify-center select-none
                    transition-transform duration-150
                    ${solved
                        ? "bg-emerald-400 border-emerald-500 text-white animate-pulse"
                        : isSel
                        ? "bg-sky-300 border-sky-400"
                        : disabled
                        ? "opacity-40 cursor-not-allowed"
                        : "bg-slate-50 hover:bg-slate-200 active:translate-y-[2px]"}`}
                  disabled={disabled}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* swap counter */}
      <p className="text-sm text-gray-600 text-center">
         Swaps&nbsp;
         <span className="font-semibold">{swaps}</span>/{MAX_SWAPS}
      </p>
    </div>
  );
}

