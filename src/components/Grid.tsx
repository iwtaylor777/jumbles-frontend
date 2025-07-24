// src/components/Grid.tsx
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";

import WORDS from "../data/words5";

const WORD_SET = new Set(WORDS);
const MAX_SWAPS = 14;

/* ---------- helper components -------------------------------- */

function DraggableTile({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? "z-50 cursor-grabbing" : "cursor-grab"}
    >
      {children}
    </div>
  );
}

function DroppableSpot({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

/* ---------- main Grid component ------------------------------ */
type Props = {
  initial: string[][];               // 4×5 letter grid
  onSolved: (moves: number) => void; // callback when solved
};

export default function Grid({ initial, onSolved }: Props) {
  const [grid, setGrid] = useState(initial);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [swaps, setSwaps] = useState(0);

  /* ----- valid rows (memoised) ------------------------------- */
  const validRows = useMemo(
    () => grid.map((row) => WORD_SET.has(row.join("").toLowerCase())),
    [grid]
  );

  /* ----- victory check --------------------------------------- */
  useEffect(() => {
    if (validRows.every(Boolean)) onSolved(swaps);
  }, [validRows, swaps, onSolved]);

  /* ----- swap logic ------------------------------------------ */
  function performSwap(r1: number, c1: number, r2: number, c2: number) {
    if (swaps >= MAX_SWAPS) return;
    const next = grid.map((row) => [...row]);
    [next[r1][c1], next[r2][c2]] = [next[r2][c2], next[r1][c1]];
    setGrid(next);
    setSelected(null);
    setSwaps((s) => s + 1);
  }

  /* ----- click handler --------------------------------------- */
  function pick(r: number, c: number) {
    if (!selected) {
      setSelected([r, c]);
      return;
    }
    const [sr, sc] = selected;
    if (sr === r && sc === c) {
      setSelected(null);
      return;
    }
    performSwap(sr, sc, r, c);
  }

  /* ----- DnD handler ----------------------------------------- */
  function handleDragEnd(event: DragEndEvent) {
    const fromId = event.active.id.toString();        // "r-c"
    const toId = event.over?.id.toString();
    if (!toId || fromId === toId) return;

    const [r1, c1] = fromId.split("-").map(Number);
    const [r2, c2] = toId.split("-").map(Number);
    performSwap(r1, c1, r2, c2);
  }

  /* ------------- render -------------------------------------- */
  return (
    <DndContext onDragEnd={handleDragEnd}>
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
                const id = `${r}-${c}`;

                return (
                  <DroppableSpot id={id} key={id}>
                    <DraggableTile id={id}>
                      <button
                        aria-label={`Swap letter ${ch}`}
                        onClick={() => pick(r, c)}
                        disabled={disabled}
                        className={`w-14 h-14 xs:w-14 xs:h-14 sm:w-16 sm:h-16
                          rounded-lg border-2 border-gray-300
                          text-2xl xs:text-2xl sm:text-3xl font-bold
                          flex items-center justify-center select-none
                          transition-transform duration-150
                          ${
                            solved
                              ? "bg-emerald-400 border-emerald-500 text-white animate-pulse"
                              : isSel
                              ? "bg-sky-300 border-sky-400"
                              : disabled
                              ? "opacity-40 cursor-not-allowed"
                              : "bg-slate-50 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                          }
                          text-gray-600 dark:text-gray-50`}
                      >
                        {ch}
                      </button>
                    </DraggableTile>
                  </DroppableSpot>
                );
              })}
            </motion.div>
          ))}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-200 text-center">
          Swaps&nbsp;
          <span className="font-semibold">{swaps}</span>/{MAX_SWAPS}
        </p>
      </div>
    </DndContext>
  );
}


