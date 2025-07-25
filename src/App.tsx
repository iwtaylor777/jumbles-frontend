/* ------------------------------------------------------------------
   src/App.tsx – Jumbles frontend
------------------------------------------------------------------- */
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sun, Moon, Info as InfoIcon } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@uidotdev/usehooks";
import { Dialog } from "@headlessui/react";
import Toast from "./components/Toast";

import Grid, { type GridHandle } from "./components/Grid";
import { fetchToday } from "./api";


/* helper to center a message */
function center(msg: string, err = false) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className={`text-xl ${err ? "text-red-600" : ""}`}>{msg}</p>
    </div>
  );
}

/* ======================== App component ======================== */
function App() {
  /* -------- hooks that must run every render ------------------ */
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const gridRef = useRef<GridHandle>(null);
  const [solvedMoves, setSolvedMoves] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showGiveUp, setShowGiveUp] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showRowToast, setShowRowToast] = useState(false);
  const { width, height } = useWindowSize();

  /* -------- fetch puzzle (runs each render) ------------------- */
  const { data, isLoading, error } = useQuery({
    queryKey: ["today"],
    queryFn: fetchToday,
  });

  /* expose payload for debugging */
  if (typeof window !== "undefined") (window as any).__puzzle__ = data;

  /* -------- early guards (AFTER all hooks above) -------------- */
  if (isLoading) return center("Loading…");
  if (error || !data) return center("Failed to load puzzle 😢", true);

  /* tolerate rows as strings */
  const gridRows: string[][] = data.grid.map((row: any) =>
    Array.isArray(row) ? row : typeof row === "string" ? row.split("") : row
  );

  const solutions: string[] = Array.isArray(data.solution) ? data.solution : [];

  if (solutions.length !== 4) {
    console.error("Puzzle payload missing solution:", data);
    return center("Puzzle unavailable (bad data) 😢", true);
  }

  const rowsOk =
    Array.isArray(gridRows) &&
    gridRows.length === 4 &&
    gridRows.every((r) => Array.isArray(r) && r.length === 5);

  if (!rowsOk) {
    console.error("Puzzle payload malformed:", data);
    return center("Puzzle unavailable (bad data) 😢", true);
  }

  /* ---------------------------- UI ---------------------------- */
  return (
    <main className="h-full flex items-center justify-center">
      <section className="container max-w-md mx-auto relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 xs:p-8 sm:p-10 space-y-8">
        {/* theme toggle */}
        <button
          aria-label="Toggle dark mode"
          onClick={() => setDark((d) => !d)}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* help icon */}
        <button
          aria-label="How to play"
          onClick={() => setShowHelp(true)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          <InfoIcon size={20} />
        </button>

        {/* row toast */}
        <Toast
          open={showRowToast && solvedMoves === null}   // suppress if already fully solved
          onClose={() => setShowRowToast(false)}
          msg="Nice! +1 word 🎉"
        />

        {/* puzzle-solved toast */}
        <Toast
          open={solvedMoves !== null}
          onClose={() => {}}
          msg={`Solved in ${solvedMoves ?? 0} swaps 🏆`}
        />

        {/* title */}
        <h1 className="text-3xl font-bold text-center dark:text-gray-50">
          Jumbles
        </h1>

        {/* grid */}
        <Grid
          ref={gridRef}
          initial={gridRows}
          onSolved={(m) => setSolvedMoves(m)}
          onRowSolved={() => {
          setShowRowToast(true);
          setTimeout(() => setShowRowToast(false), 1200);
          }}
          onOutOfMoves={() => setShowGiveUp(true)}
        />

        {/* give-up link */}
        {!solvedMoves && (
          <div className="text-center">
            <button
              onClick={() => setShowGiveUp(true)}
              className="text-xs underline text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Give up?
            </button>
          </div>
        )}

        {/* confetti */}
        {solvedMoves !== null && (
          <Confetti width={width ?? 0} height={height ?? 0} recycle={false} />
        )}

        {/* ---------------------- Modals --------------------- */}
        {/* Help */}
        <Dialog
          open={showHelp}
          onClose={() => setShowHelp(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="max-w-sm w-full rounded-xl bg-white dark:bg-slate-800 p-6 space-y-4">
              <Dialog.Title className="text-lg font-semibold dark:text-white">
                How to play
              </Dialog.Title>
              <p className="text-sm dark:text-gray-300">
                Swap letters to form four five-letter words. You have 12 swaps.
                Drag or click-select two tiles to swap.
              </p>
              <div className="text-right">
                <button
                  className="px-3 py-1 rounded-md bg-sky-500 text-white hover:bg-sky-600"
                  onClick={() => setShowHelp(false)}
                >
                  Got it
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Give-up */}
        <Dialog
          open={showGiveUp}
          onClose={() => setShowGiveUp(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="max-w-sm w-full rounded-xl bg-white dark:bg-slate-800 p-6 space-y-4">
              <Dialog.Title className="text-lg font-semibold dark:text-white">
                Out of swaps!
              </Dialog.Title>
              <p className="text-sm dark:text-gray-300">
                You can reset and try again, or reveal today&rsquo;s answers.
              </p>
              <div className="flex justify-end gap-3 mt-2">
                <button
                  className="px-3 py-1 rounded-md bg-sky-500 text-white hover:bg-sky-600"
                  onClick={() => {
                    setShowGiveUp(false);
                    gridRef.current?.reset();
                  }}
                >
                  Try again
                </button>
                <button
                  className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => {
                    setShowGiveUp(false);
                    setShowAnswers(true);
                  }}
                >
                  See answers
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Answers */}
        <Dialog
          open={showAnswers}
          onClose={() => setShowAnswers(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="max-w-sm w-full rounded-xl bg-white dark:bg-slate-800 p-6 space-y-4">
              <Dialog.Title className="text-lg font-semibold dark:text-white">
                Today&rsquo;s answers
              </Dialog.Title>
              <ul className="grid grid-cols-2 gap-2 text-center font-mono text-xl">
                {solutions.map((w) => (
                  <li
                    key={w}
                    className="px-2 py-1 bg-emerald-100 dark:bg-emerald-700/40 rounded-md"
                  >
                    {w}
                  </li>
                ))}
              </ul>
              <div className="flex justify-end">
                <button
                  className="px-3 py-1 rounded-md bg-sky-500 text-white hover:bg-sky-600"
                  onClick={() => window.location.reload()}
                >
                  Play tomorrow
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </section>
    </main>
  );
}

/* ----------------------- bootstrap ----------------------------- */

export default App;


