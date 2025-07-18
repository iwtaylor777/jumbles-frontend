import { useState } from "react";

type Props = {
  initial: string[][];        // 4 × 5 grid of letters
};

export default function Grid({ initial }: Props) {
  const [grid, setGrid] = useState(initial);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [swaps, setSwaps] = useState(0);

  // click handler
  function pick(r: number, c: number) {
    if (!selected) {
      setSelected([r, c]);
      return;
    }
    const [sr, sc] = selected;
    if (sr === r && sc === c) {
      setSelected(null);                 // same cell → deselect
      return;
    }
    // swap letters
    const next = grid.map((row) => [...row]);
    [next[sr][sc], next[r][c]] = [next[r][c], next[sr][sc]];
    setGrid(next);
    setSelected(null);
    setSwaps((s) => s + 1);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* letter grid */}
      <div className="inline-block">
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((ch, c) => {
              const isSel = selected?.[0] === r && selected?.[1] === c;
              return (
                <button
                  key={c}
                  onClick={() => pick(r, c)}
                  className={`w-12 h-12 border text-xl font-bold transition
                    ${isSel ? "bg-blue-300" : "bg-white hover:bg-gray-200"}`}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* simple swap counter */}
      <p className="text-sm text-gray-500">
        Swaps used: <span className="font-semibold">{swaps}</span>
      </p>
    </div>
  );
}

