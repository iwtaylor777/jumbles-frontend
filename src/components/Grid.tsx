/* ------------------------------------------------------------
   Grid component — drag-and-drop + tap-to-swap
------------------------------------------------------------- */
import {
  useState,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { motion } from "framer-motion";
import WORDS from "../data/words5";

const WORD_SET = new Set(WORDS);
export const MAX_SWAPS = 14;

/* ---------- public API ---------- */
export type GridHandle = { reset(): void; swaps: number };

type Props = {
  initial: string[][];
  onRowSolved(row: number): void;
  onSolved(moves: number): void;
  onOutOfMoves(): void;
  onSwap?(count: number): void;
};

/* ---------- tiny helpers ---------- */
function DraggableBox({
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
function DroppableBox({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

/* ---------- Grid component ---------- */
const Grid = forwardRef<GridHandle, Props>(function Grid(
  { initial, onRowSolved, onSolved, onOutOfMoves, onSwap },
  ref
) {
  const [grid, setGrid] = useState(initial);
  const [swaps, setSwaps] = useState(0);
  const [selected, setSelected] = useState<[number, number] | null>(null);

  /* validity per row */
  const validRows = useMemo(
    () => grid.map((row) => WORD_SET.has(row.join("").toLowerCase())),
    [grid]
  );

  /* notify when a row flips to solved */
  const prevValid = useState(validRows)[0];
  useEffect(() => {
    validRows.forEach((ok, i) => {
      if (ok && !prevValid[i]) onRowSolved(i);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validRows]);

  /* puzzle status */
  useEffect(() => {
    if (validRows.every(Boolean)) onSolved(swaps);
    if (swaps >= MAX_SWAPS && !validRows.every(Boolean))
      onOutOfMoves();
  }, [validRows, swaps, onSolved, onOutOfMoves]);

  /* expose ref */
  useImperativeHandle(ref, () => ({
    reset() {
      setGrid(initial);
      setSwaps(0);
      setSelected(null);
      onSwap?.(0);
    },
    swaps,
  }));

  /* swap helper */
  function doSwap(r1: number, c1: number, r2: number, c2: number) {
    const next = grid.map((r) => [...r]);
    [next[r1][c1], next[r2][c2]] = [next[r2][c2], next[r1][c1]];
    setGrid(next);
    const newCount = swaps + 1;
    setSwaps(newCount);
    onSwap?.(newCount);
  }

  /* drag sensors: start drag only after 8 px movement */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragStart(_: DragStartEvent) {
    setSelected(null); // cancel tap selection if a real drag begins
  }
  function handleDragEnd(e: DragEndEvent) {
    const from = e.active.id.toString();
    const to = e.over?.id?.toString();
    if (!to || from === to) return;
    const [r1, c1] = from.split("-").map(Number);
    const [r2, c2] = to.split("-").map(Number);
    doSwap(r1, c1, r2, c2);
  }

  /* tap / click handler */
  function handlePointerDown(r: number, c: number) {
    if (selected) {
      const [sr, sc] = selected;
      if (sr === r && sc === c) {
        setSelected(null);
      } else {
        doSwap(sr, sc, r, c);
        setSelected(null);
      }
    } else {
      setSelected([r, c]);
    }
  }

  /* render */
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
                const isSel = selected?.[0] === r && selected?.[1] === c;
                return (
                  <DroppableBox id={id} key={id}>
                    <DraggableBox id={id}>
                      <div
                        onPointerDown={() => handlePointerDown(r, c)}
                        className={`w-14 h-14 sm:w-16 sm:h-16 m-px rounded-md
                          font-bold text-2xl flex items-center justify-center
                          ${
                            solved
                              ? "bg-emerald-400 text-white"
                              : "bg-slate-100 text-slate-700"
                          }
                          ${isSel ? "ring-4 ring-sky-400" : ""}`}
                      >
                        {ch}
                      </div>
                    </DraggableBox>
                  </DroppableBox>
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









