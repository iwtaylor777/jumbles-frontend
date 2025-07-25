/* ------------------------------------------------------------------
   src/App.tsx – Jumbles frontend
------------------------------------------------------------------- */
import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Sun, Moon } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@uidotdev/usehooks";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

import Grid, { type GridHandle } from "./components/Grid";
import { fetchToday } from "./api";

/* one shared react-query client ---------------------------------- */
const queryClient = new QueryClient();

/* helper to center any message ----------------------------------- */
function center(msg: string, err = false) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className={`text-xl ${err ? "text-red-600" : ""}`}>{msg}</p>
    </div>
  );
}

/* ======================== App ======================== */
function App() {
  /* ------------- theme (dark / light) -------------------------- */
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

  /* ------------- data ------------------------------------------------ */
  const { data, isLoading, error } = useQuery({
    queryKey: ["today"],
    queryFn: fetchToday,
  });

  /* ------------- refs + local state (hooks must always run!) --------- */
  const gridRef = useRef<GridHandle>(null);
  const [solvedMoves, setSolvedMoves] = useState<number | null>(null);
  const { width, height } = useWindowSize();

  /* ------------- callbacks from <Grid> ------------------------------- */
  const handleRowSolved = useCallback((row: number) => {
    console.log(`row ${row + 1} solved`);
  }, []);

  const handlePuzzleSolved = useCallback((moves: number) => {
    console.log(`puzzle solved in ${moves} swaps`);
    setSolvedMoves(moves);
  }, []);

  const handleOutOfMoves = useCallback(() => {
    console.log("out of moves");
  }, []);

  /* ------------- GUARDS  (after hooks, safe for rules-of-hooks) ------ */
  if (isLoading) return center("Loading…");
  if (error || !data) return center("Failed to load puzzle 😢", true);

  const gridRows: string[][] = data.grid.map((row: any) =>
    Array.isArray(row) ? row : typeof row === "string" ? row.split("") : row
  );
  const solutions: string[] = Array.isArray(data.solution) ? data.solution : [];

  const payloadOk =
    solutions.length === 4 &&
    gridRows.length === 4 &&
    gridRows.every((r) => Array.isArray(r) && r.length === 5);

  if (!payloadOk) {
    console.error("Puzzle payload malformed:", data);
    return center("Puzzle unavailable (bad data) 😢", true);
  }

  /* --------------------------- UI ----------------------------------- */
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

        {/* title */}
        <h1 className="text-3xl font-bold text-center dark:text-gray-50">
          Jumbles
        </h1>

        {/* grid */}
        <Grid
          ref={gridRef}
          initial={gridRows}
          onRowSolved={handleRowSolved}
          onSolved={handlePuzzleSolved}
          onOutOfMoves={handleOutOfMoves}
        />

        {/* confetti */}
        {solvedMoves !== null && (
          <Confetti width={width ?? 0} height={height ?? 0} recycle={false} />
        )}
      </section>
    </main>
  );
}

/* ---------------- bootstrap (single export) ------------------------- */
export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}





