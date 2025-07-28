/* ------------------------------------------------------------
   Grid component   –   handles all tile logic + DnD + tap swap
------------------------------------------------------------- */
import {
  useState,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { motion } from "framer-motion";
import WORDS from "../data/words5";

const WORD_SET = new Set(WORDS);
export const MAX_SWAPS = 14;

/* ── small helpers ─────────────────────────────────────────── */
function Draggable({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, listeners, attributes, transform } = useDraggable({ id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      {children}
    </div>
  );
}
function Droppable({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

/* ── public API ────────────────────────────────────────────── */
export type GridHandle = { reset(): void; swaps: number };

type Props = {
  initial: string[][];
  onRowSolved(row: number): void;
  onSolved(moves: number): void;
  onOutOfMoves(): void;
  onSwap?(count: number): void; // ← parent callback
};

const Grid = forwardRef<GridHandle, Props>(function Grid(
  { initial, onRowSolved, onSolved, onOutOfMoves, onSwap },
  ref
) {
  const [grid, setGrid] = useState(initial);
  const [swaps, setSwaps] = useState(0);
  const [selected, setSelected] = useState<[number, number] | null>(null);

  /* ── validity for each row ──────────────────────────────── */
  const validRows = useMemo(
    () => grid.map((row) => WORD_SET.has(row.join("").toLowerCase())),
    [grid]
  );

  /* detect rows that became valid in this render */
  const prevValid = useState(validRows)[0];
  useEffect(() => {
    validRows.forEach((ok, i) => {
      if (ok && !prevValid[i]) onRowSolved(i);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validRows]);

  /* puzzle solved / out of moves */
  useEffect(() => {
    if (validRows.every(Boolean)) onSolved(swaps);
    if (swaps >= MAX_SWAPS && !validRows.every(Boolean)) onOutOfMoves();
  }, [validRows, swaps, onSolved, onOutOfMoves]);

  /* expose ref API */
  useImperativeHandle(ref, () => ({
    reset() {
      setGrid(initial);
      setSwaps(0);
      setSelected(null);
      onSwap?.(0);
    },
    swaps,
  }));

  /* ── helpers ─────────────────────────────────────────────── */
  function doSwap(r1: number, c1: number, r2: number, c2: number) {
    const next = grid.map((r) => [...r]);
    [next[r1][c1], next[r2][c2]] = [next[r2][c2], next[r1][c1]];
    setGrid(next);
    const newCount = swaps + 1;
    setSwaps(newCount);
    onSwap?.(newCount);
  }

  /* drag-and-drop */
  function handleDragEnd(e: DragEndEvent) {
    const from = e.active.id.toString();
    const to = e.over?.id?.toString();
    if (!to || from === to) return;
    const [r1, c1] = from.split("-").map(Number);
    const [r2, c2] = to.split("-").map(Number);
    doSwap(r1, c1, r2, c2);
  }

  /* tap-to-swap */
  function handleTileClick(r: number, c: number) {
    if (selected) {
      const [sr, sc] = selected;
      if (sr === r && sc === c) {
        setSelected(null);
        return;
      }
      doSwap(sr, sc, r, c);
      setSelected(null);
    } else {
      setSelected([r, c]);
    }
  }

  /* ── render ──────────────────────────────────────────────── */
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col items-center gap-4">
        <div>
          {grid.map((row, r) => (
            <motion.div
              key={r}
              className="flex"
              animate={validRows[r] ? { y: [-6, 0] } : { y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {row.map((ch, c) => {
                const id = `${r}-${c}`;
                const solved = validRows[r];
                const isSel =
                  selected && selected[0] === r && selected[1] === c;
                return (
                  <Droppable id={id} key={id}>
                    <Draggable id={id}>
                      <div
                        onClick={() => handleTileClick(r, c)}
                        className={`w-14 h-14 sm:w-16 sm:h-16 m-px rounded-md font-bold text-2xl flex items-center justify-center
                          ${
                            solved
                              ? "bg-emerald-400 text-white"
                              : "bg-slate-100 text-slate-700"
                          }
                          ${isSel ? "ring-4 ring-sky-400" : ""}`}
                      >
                        {ch}
                      </div>
                    </Draggable>
                  </Droppable>
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>
    </DndContext>
  );
});

export default Grid;




