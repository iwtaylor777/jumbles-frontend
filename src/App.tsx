// src/App.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchToday } from "./api";
import Grid from "./components/Grid";

/* ------------------------------ App ------------------------------ */

export default function App() {
  // fetch today’s puzzle once
  const { data, isLoading, error } = useQuery({
    queryKey: ["today"],
    queryFn: fetchToday,
  });

  // moves used when puzzle is solved (null = not yet solved)
  const [solvedMoves, setSolvedMoves] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  /* ---------- loading / error ---------- */

  if (isLoading) return screen("Loading…");
  if (error || !data) return screen("Failed to load puzzle 😢", true);

  /* ---------- main render ---------- */

  return (
  /* ---- OUTER background ---- */
  <div className="min-h-screen flex items-center justify-center bg-slate-100">

    {/* ---- INNER card ---- */}
    <div className="relative bg-white rounded-3xl shadow-xl p-8 w-[min(90vw,420px)] space-y-6">
      {/* Everything that USED to be inside goes here */}
      <h1 className="text-3xl font-bold text-center">Jumbles</h1>
      <button
        onClick={() => setShowHelp(true)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        aria-label="How to play"
        >
          ℹ️
        </button>

      <Grid initial={data.grid} onSolved={(moves) => setSolvedMoves(moves)} />

      {/* ResultModal stays AFTER the card so it overlays */}
      {solvedMoves !== null && (
        <ResultModal moves={solvedMoves} id={data.id} onClose={() => setSolvedMoves(null)} />
      )}
    </div>
    {showHelp && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-80 space-y-4 text-gray-700">
      <h3 className="text-xl font-bold text-center">How to Play</h3>
      <ol className="list-decimal pl-4 space-y-2 text-sm text-left">
        <li>Tap one letter, then another to swap.</li>
        <li>You have 12 total swaps.</li>
        <li>Make every row a real 5-letter word.</li>
      </ol>
      <button
        onClick={() => setShowHelp(false)}
        className="mt-2 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Got it!
      </button>
    </div>
  </div>
)}
  </div>
);
}

/* ------------------------- helpers ------------------------- */

function screen(msg: string, isErr = false) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className={`text-xl ${isErr ? "text-red-600" : ""}`}>{msg}</p>
    </div>
  );
}

/* ----------------------- Result Modal ----------------------- */

type ModalProps = { moves: number; id: string; onClose: () => void };

function ResultModal({ moves, id, onClose }: ModalProps) {
  const [copied, setCopied] = useState(false);

  function share() {
    const text = `Jumbles ${id}\nSolved in ${moves} swaps\n${emojiGrid(moves)}`;
    navigator.clipboard.writeText(text).then(() => setCopied(true));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-80 text-center space-y-4 shadow-lg">
        <h2 className="text-2xl font-bold text-emerald-600">You solved it! 🎉</h2>
        <p className="text-gray-700">Moves used: {moves}</p>

        <button
          onClick={share}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {copied ? "Copied!" : "Share result"}
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2 border rounded hover:bg-gray-100 transition"
        >
          Close
        </button>
      </div> 
    </div>
  );
}

/* --------------------- Emoji share grid --------------------- */

function emojiGrid(moves: number) {
  // Green squares for swaps used, blank for remaining out of 12
  const greens = "🟩".repeat(moves);
  const blanks = "⬜️".repeat(Math.max(0, 12 - moves));
  return greens + blanks;
}

