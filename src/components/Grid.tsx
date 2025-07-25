import React, {
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
const MAX_SWAPS = 14;

/* ---------- tiny helpers ---------- */
function Draggable({ id, children }: { id: string; children: React.ReactNode }) {
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
function Droppable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

/* ---------- public API ---------- */
export type GridHandle = { reset(): void };

type Props = {
  initial: string[][];
  onRowSolved(row: number): void;
  onSolved(moves: number): void;
  onOutOfMoves(): void;
};

const Grid = forwardRef<GridHandle, Props>(function Grid(
  { initial, onRowSolved, onSolved, onOutOfMoves },
  ref
) {
  const [grid, setGrid] = useState(initial);
  const [swaps, setSwaps] = useState(0);

  /* compute validity for each row */
  const validRows = useMemo(() => {
  const v = grid.map((row) =>
    WORD_SET.has(row.join("").toLowerCase())
  );
  console.log("validRows", v.map(Number).join(""));   // ← debug
  return v;
}, [grid]);

  /* detect rows that just flipped false→true */
  const prevValid = React.useRef(validRows);
  useEffect(() => {
    validRows.forEach((ok, i) => {
      if (ok && !prevValid.current[i]) onRowSolved(i);
    });
    prevValid.current = validRows;
  }, [validRows, onRowSolved]);

  /* overall puzzle solved / out-of-moves */
  useEffect(() => {
    if (validRows.every(Boolean)) onSolved(swaps);
    if (swaps >= MAX_SWAPS && !validRows.every(Boolean)) onOutOfMoves();
  }, [validRows, swaps, onSolved, onOutOfMoves]);

  /* expose reset() */
  useImperativeHandle(ref, () => ({
    reset() {
      setGrid(initial);
      setSwaps(0);
      prevValid.current = initial.map(() => false);
    },
  }));

  /* swap helpers */
  function doSwap(r1: number, c1: number, r2: number, c2: number) {
    if (swaps >= MAX_SWAPS) return;
    const next = grid.map((r) => [...r]);
    [next[r1][c1], next[r2][c2]] = [next[r2][c2], next[r1][c1]];
    setGrid(next);
    setSwaps((s) => s + 1);
  }
  function handleDragEnd(e: DragEndEvent) {
    const a = e.active.id.toString();
    const b = e.over?.id?.toString();
    if (!b || a === b) return;
    const [r1, c1] = a.split("-").map(Number);
    const [r2, c2] = b.split("-").map(Number);
    doSwap(r1, c1, r2, c2);
  }

  /* ---------- render ---------- */
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
                return (
                  <Droppable id={id} key={id}>
                    <Draggable id={id}>
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 m-px rounded-md
                          font-bold text-2xl flex items-center justify-center
                          ${
                            solved
                              ? "bg-emerald-400 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
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
        <p className="text-sm">Swaps {swaps}/{MAX_SWAPS}</p>
      </div>
    </DndContext>
  );
});

export default Grid;


