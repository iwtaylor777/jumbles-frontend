import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import WORDS from "../data/words5";

const WORD_SET = new Set(WORDS);
const MAX_SWAPS = 12;

/* ---------------------------- TYPES ---------------------------- */
type Props = {
  initial: string[][];               // 4 × 5 grid
  onSolved: (moves: number) => void; // callback to parent
};

/* ---------------------------- COMPONENT ------------------------ */
export default function Grid({ initial, onSolved }: Props) {
  const [grid, setGrid] = useState(initial);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [swaps, setSwaps] = useState(0);

  /* recompute valid rows each render */
  const validRows = useMemo(
    () => grid.map((row) => WORD_SET.has(row.join("").toLowerCase())),
    [grid]
  );

  /* fire callback once when puzzle solved */
  useEffect(() => {
    if (validRows.every(Boolean)) onSolved(swaps);
  }, [validRows, swaps, onSolved]);

  /* ------ swap handler ---------------------------------------- */
  function swap(r: number, c: number) {
    if (swaps >= MAX_SWAPS) return;
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

  /* --------------------------- render -------------------------- */
  return (
    <div className="flex flex-col items-center gap-4">
      <div>
        {grid.map((row, r) => (
          <motion.div
            key={r}
            className="flex"
            initial={false}
            animate={validRows[r] ? { y: [-6, 0] } : { y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            {row.map((ch, c) => {
              const isSel = selected?.[0] === r && selected?.[1] === c;
              const solved = validRows[r];
              const disabled = swaps >= MAX_SWAPS && !solved;

              return (
                <button
                  key={c}
                  onClick={() => swap(r, c)}
                  disabled={disabled}
                  className={`w-14 h-14 xs:w-14 xs:h-14 sm:w-16 sm:h-16
                    rounded-lg border-2 border-gray-300
                    text-2xl xs:text-2xl sm:text-3xl font-bold
                    flex items-center justify-center select-none
                    transition-transform duration-150
                    ${solved
                      ? "bg-emerald-400 border-emerald-500 text-white animate-pulse"
                      : isSel
                      ? "bg-sky-300 border-sky-400"
                      : disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "bg-slate-50 hover:bg-slate-200 active:translate-y-[2px]"}`}
                >
                  {ch}
                </button>
              );
            })}
          </motion.div>
        ))}
      </div>

      <p className="text-sm text-gray-600 text-center">
        Swaps&nbsp;
        <span className="font-semibold">{swaps}</span>/{MAX_SWAPS}
      </p>
    </div>
  );
}


