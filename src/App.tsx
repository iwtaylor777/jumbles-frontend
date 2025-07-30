/* ------------------------------------------------------------------
   src/App.tsx  —  Jumbles frontend (with live swap count, modals, etc.)
------------------------------------------------------------------- */
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type MutableRefObject,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { Sun, Moon, Share2, Shuffle, Info } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@uidotdev/usehooks";
import { Dialog } from "@headlessui/react";

import Grid, { type GridHandle } from "./components/Grid";
import { fetchToday } from "./api";

const queryClient = new QueryClient();
function center(msg: string, err = false) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className={`text-xl ${err ? "text-red-600" : ""}`}>{msg}</p>
    </div>
  );
}

function App() {
  /* theme */
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

  /* mode + swap count */
  const [hardMode, setHardMode] = useState(false);
  const [swapCount, setSwapCount] = useState(0);

  type GridHandleEx = GridHandle & { swaps?: number };
  const gridRef = useRef<GridHandleEx>(null) as MutableRefObject<GridHandleEx>;

  /* puzzle state */
  const [solvedMoves, setSolvedMoves] = useState<number | null>(null);
  const [showGiveUp, setShowGiveUp] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [rowSolved, setRowSolved] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const { width, height } = useWindowSize();

  /* fetch puzzle */
  const { data, isLoading, error } = useQuery({
    queryKey: ["today"],
    queryFn: fetchToday,
  });

  /* callbacks from grid */
  const handleRowSolved = useCallback((r: number) => {
    setRowSolved((prev) => {
      const next = [...prev];
      next[r] = true;
      return next;
    });
  }, []);
  const handlePuzzleSolved = useCallback(
    (moves: number) => setSolvedMoves(moves),
    []
  );
  const handleOutOfMoves = useCallback(() => setShowGiveUp(true), []);

  /* early returns */
  if (isLoading) return center("Loading…");
  if (error || !data) return center("Failed to load puzzle 😢", true);

  /* prepare grid & solutions */
  const toArr = (r: string | string[]) =>
    Array.isArray(r) ? r : r.split("");
  let grid = data.grid.map(toArr);
  const solutions: string[] = Array.isArray(data.solution)
    ? data.solution
    : [];
  if (solutions.length !== 4 || grid.length !== 4) {
    console.error("Bad payload", data);
    return center("Puzzle unavailable 😢", true);
  }

  /* hard-mode shuffle */
  if (hardMode) {
    const flat = [...grid.flat()];
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i], flat[j]] = [flat[j], flat[i]];
    }
    grid = Array.from({ length: 4 }, (_, i) => flat.slice(i * 5, i * 5 + 5));
  }

  const puzzleId = data.id;
  const gridKey = `${puzzleId}-${hardMode ? "hard" : "normal"}`;

  /* share helper */
  function buildEmojiGrid(ok: boolean, moves: number | null) {
    const green = "🟢";
    const red = "🔴";
    const rows = rowSolved.map((v) => (v ? green.repeat(5) : red.repeat(5)));
    const tag = hardMode ? " (hard)" : "";
    const title = ok
      ? `Jumbles ${puzzleId}${tag} — ${moves}/14 swaps`
      : `I got jumbled today${tag} :(`;
    return `${title}\n${rows.join("\n")}`;
  }
  async function copyShare(ok: boolean) {
    await navigator.clipboard.writeText(buildEmojiGrid(ok, solvedMoves));
    alert("Copied to clipboard!");
  }

  return (
    <main className="h-full flex items-center justify-center">
      <section className="container max-w-md mx-auto relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 xs:p-8 sm:p-10 space-y-8">
        {/* dark mode toggle */}
        <button
          aria-label="Toggle dark mode"
          onClick={() => setDark((d) => !d)}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* info button */}
        <button
          aria-label="Game rules"
          onClick={() => setShowInfo(true)}
          className="absolute top-4 right-12 text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          <Info size={18} />
        </button>

        {/* hard mode toggle */}
        <button
          aria-label="Toggle hard mode"
          onClick={() => {
            setHardMode((h) => !h);
            setSwapCount(0);
            setRowSolved([false, false, false, false]);
            setSolvedMoves(null);
            setShowGiveUp(false);
            setShowAnswers(false);
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300"
        >
          <Shuffle size={18} className={hardMode ? "text-emerald-500" : ""} />
        </button>

        {/* title */}
        <h1 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-100">
          Jumbles
        </h1>
        {hardMode && (
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Hard mode
          </p>
        )}

        {/* the grid */}
        <Grid
          key={gridKey}
          ref={gridRef}
          initial={grid}
          onRowSolved={handleRowSolved}
          onSolved={handlePuzzleSolved}
          onOutOfMoves={handleOutOfMoves}
          onSwap={setSwapCount}
        />

        {/* confetti */}
        {solvedMoves !== null && (
          <Confetti width={width ?? 0} height={height ?? 0} recycle={false} />
        )}

        {/* swaps + give up */}
        {solvedMoves === null && (
          <>
            <p
              className={`text-sm text-center ${
                swapCount > 14
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Swaps {swapCount}/14
            </p>
            <div className="text-center">
              <button
                className="mt-2 px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                onClick={() => setShowAnswers(true)}
              >
                Give up
              </button>
            </div>
          </>
        )}

        {/* out-of-moves modal */}
        <Dialog
          open={showGiveUp}
          onClose={() => setShowGiveUp(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="max-w-sm w-full rounded-xl bg-white dark:bg-slate-800 p-6 space-y-4">
              <Dialog.Title className="text-lg font-semibold dark:text-white">
                You’ve been jumbled fool!
              </Dialog.Title>
              <p className="text-sm dark:text-gray-300">
                No more swaps left. You can keep playing or reveal the answers.
              </p>
              <div className="flex justify-end gap-3 mt-2">
                <button
                  className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setShowGiveUp(false)}
                >
                  Keep playing
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
                <button
                  className="flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600"
                  onClick={() => copyShare(false)}
                >
                  <Share2 size={14} /> Share
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* victory modal */}
        <Dialog open={solvedMoves !== null} onClose={() => {}} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="max-w-sm w-full rounded-xl bg-white dark:bg-slate-800 p-6 space-y-4">
              <Dialog.Title className="text-lg font-semibold dark:text-white">
                🎉 You solved it!
              </Dialog.Title>
              <p className="text-sm dark:text-gray-300">
                Swaps used: <strong>{solvedMoves}</strong> / 14
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-3 py-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-1"
                  onClick={() => copyShare(true)}
                >
                  <Share2 size={14} /> Share
                </button>
                <button
                  className="px-3 py-1 rounded-md bg-sky-500 text-white hover:bg-sky-600"
                  onClick={() => {
                    gridRef.current?.reset();
                    setSwapCount(0);
                    setRowSolved([false, false, false, false]);
                    setSolvedMoves(null);
                  }}
                >
                  Play yesterday
                </button>
                <button
                  className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => window.location.reload()}
                >
                  New puzzle
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* answers modal */}
        <Dialog
          open={showAnswers}
          onClose={() => setShowAnswers(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="max-w-sm w-full rounded-xl bg-white dark:bg-slate-800 p-6 space-y-4">
              <Dialog.Title className="text-lg font-semibold dark:text-white">
                Today’s answers
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
                  New puzzle
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* info modal */}
        <Dialog
          open={showInfo}
          onClose={() => setShowInfo(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="max-w-sm w-full rounded-xl bg-white dark:bg-slate-800 p-6 space-y-4">
              <Dialog.Title className="text-lg font-semibold dark:text-white">
                How to play
              </Dialog.Title>
              <ul className="space-y-2 text-sm dark:text-gray-300 list-disc ml-5 [&[data-headlessui-state=hidden]]:list-none">
                <li>You start with four scrambled five-letter words.</li>
                <li>Swap letters by drag-and-drop or by tapping two tiles.</li>
                <li>You have 14 swaps to solve them all.</li>
                <li>Green rows are correct, grey rows still need fixing.</li>
                <li>Hit Give up (or run out of swaps) to see the answers.</li>
                <li>Hard mode shuffles letters across every row.</li>
              </ul>
              <div className="flex justify-end">
                <button
                  className="px-3 py-1 rounded-md bg-sky-500 text-white hover:bg-sky-600"
                  onClick={() => setShowInfo(false)}
                >
                  Got it
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </section>
    </main>
  );
}

export default function WrappedApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

















