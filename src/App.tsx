// src/App.tsx  ----------------------------------------------------
import { useState, useEffect, useRef } from "react";   // React-17 “automatic” JSX runtime
import { useQuery } from "@tanstack/react-query";
import { Sun, Moon, Info as InfoIcon } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@uidotdev/usehooks";
import { Dialog } from "@headlessui/react";

import Grid, { type GridHandle } from "./components/Grid";
import { fetchToday } from "./api";

/* helper: centered status */
function center(msg: string, err = false) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className={`text-xl ${err ? "text-red-600" : ""}`}>{msg}</p>
    </div>
  );
}

export default function App() {
  /* ─── THEME ─────────────────────────────────────────────── */
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

  /* ─── UI STATE ─────────────────────────────────────────── */
  const gridRef = useRef<GridHandle>(null);
  const [rowBanners, setRowBanners] = useState<boolean[]>(
    new Array(4).fill(false)
  );
  const [solvedMoves, setSolvedMoves] = useState<number | null>(null);

  // const [showHelp, setShowHelp] = useState(false);
  // const [showGiveUp, setShowGiveUp] = useState(false);
  // const [showAnswers, setShowAnswers] = useState(false);
  const { width, height } = useWindowSize();

  /* ─── DATA FETCH ───────────────────────────────────────── */
  const { data, isLoading, error } = useQuery({
    queryKey: ["today"],
    queryFn: fetchToday,
  });

  /* ─── CALLBACKS (declare before guards) ────────────────── */
  const handleRowSolved = useCallback((i: number) => {
    console.log("row solved:", i);
    setRowBanners((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
    setTimeout(() => {
      setRowBanners((prev) => {
        const next = [...prev];
        next[i] = false;
        return next;
      });
    }, 1500);
  }, []);

  const handlePuzzleSolved = useCallback((moves: number) => {
    console.log("PUZZLE COMPLETE 🎉", moves, "moves");
    setSolvedMoves(moves);
  }, []);

  const handleOutOfMoves = useCallback(() => {
    setShowGiveUp(true);
  }, []);

  /* ─── EARLY GUARDS (after all hooks) ───────────────────── */
  if (isLoading) return center("Loading…");
  if (error || !data) return center("Failed to load puzzle 😢", true);

  /* normalise puzzle data */
  const gridRows: string[][] = data.grid.map((r: any) =>
    Array.isArray(r) ? r : (r as string).split("")
  );
  const solutions: string[] = Array.isArray(data.solution)
    ? data.solution
    : [];
  if (solutions.length !== 4) return center("Bad puzzle 😢", true);

  /* ─── UI ───────────────────────────────────────────────── */
  return (
    <main className="h-full flex items-center justify-center p-4">
      <section className="container max-w-md mx-auto relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 xs:p-8 sm:p-10 space-y-8">
        {/* dark-mode toggle */}
        <button
          aria-label="toggle theme"
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 dark:text-gray-300"
          onClick={() => setDark((d) => !d)}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* help icon */}
        <button
          aria-label="how to play"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300"
          onClick={() => setShowHelp(true)}
        >
          <InfoIcon size={20} />
        </button>

        {/* title */}
        <h1 className="text-3xl font-bold text-center dark:text-gray-50">
          Jumbles
        </h1>

        {/* row banners */}
        {rowBanners.map(
          (show, i) =>
            show && (
              <div
                key={i}
                className="text-center text-green-600 font-semibold"
              >
                Word&nbsp;{i + 1}&nbsp;solved!
              </div>
            )
        )}

        {/* grid */}
        <Grid
          ref={gridRef}
          initial={gridRows}
          onRowSolved={handleRowSolved}
          onSolved={handlePuzzleSolved}
          onOutOfMoves={handleOutOfMoves}
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
          <Confetti
            width={width || 0}
            height={height || 0}
            recycle={false}
          />
        )}

        {/* modals: Help / Give-up / Answers unchanged … */}
      </section>
    </main>
  );
}



