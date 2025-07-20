// src/App.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchToday } from "./api";
import Grid from "./components/Grid";
import Confetti from "react-confetti";
import { useWindowSize } from "@uidotdev/usehooks";
import { Info as InfoIcon } from "lucide-react";

/* -------------------------------------------------------------- */
export default function App() {
  /* --- data fetch --------------------------------------------- */
  const { data, isLoading, error } = useQuery({
    queryKey: ["today"],
    queryFn: fetchToday,
  });

  /* --- local state ------------------------------------------- */
  const [solvedMoves, setSolvedMoves] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  /* --- early returns ----------------------------------------- */
  if (isLoading) return centerScreen("Loading…");
  if (error || !data) return centerScreen("Failed to load puzzle 😢", true);

  /* --- render ------------------------------------------------- */
  return (
    <div className="h-full flex items-center justify-center">
      {/* CARD */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-[min(92vw,480px)] space-y-8">
        {/* info button */}
        <button
          aria-label="How to play"
          onClick={() => setShowHelp(true)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <InfoIcon size={20} />
        </button>

        {/* title */}
        <h1 className="text-3xl font-bold text-center">Jumbles</h1>

        {/* grid */}
        <Grid initial={data.grid} onSolved={setSolvedMoves} />

        {/* solved modal */}
        {solvedMoves !== null && (
          <ResultModal moves={solvedMoves} id={data.id} onClose={() => setSolvedMoves(null)} />
        )}

        {/* help modal */}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      </div>
    </div>
  );
}

/* ---------- centered fallback screens ------------------------ */
function centerScreen(msg: string, isErr = false) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className={`text-xl ${isErr ? "text-red-600" : ""}`}>{msg}</p>
    </div>
  );
}

/* ---------- solved modal ------------------------------------- */
type ResultProps = { moves: number; id: string; onClose: () => void };

function ResultModal({ moves, id, onClose }: ResultProps) {
  const { width, height } = useWindowSize();
  const [copied, setCopied] = useState(false);

  function share() {
    const text = `Jumbles ${id}\nSolved in ${moves} swaps!\n${emojiGrid(moves)}`;
    navigator.clipboard.writeText(text).then(() => setCopied(true));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      {width && height && (
        <Confetti width={width} height={height} numberOfPieces={160} recycle={false} />
      )}

      <div className="bg-white rounded-xl p-6 w-80 space-y-4 text-center shadow-lg">
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
          className="w-full py-2 border rounded hover:bg-gray-100 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ---------- help modal --------------------------------------- */
function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center overflow-y-auto z-50">
      <div className="bg-white rounded-xl p-6 w-80 space-y-4 text-gray-700">
        <h3 className="text-xl font-bold text-center">How to Play</h3>
        <ol className="list-decimal pl-4 space-y-2 text-sm text-left">
          <li>Tap one letter, then another to swap.</li>
          <li>You have 12 total swaps.</li>
          <li>Make every row a real 5-letter word.</li>
        </ol>
        <button
          onClick={onClose}
          className="mt-2 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

/* ---------- tiny helper for share-grid ----------------------- */
function emojiGrid(moves: number) {
  return "🟩".repeat(moves) + "⬜️".repeat(Math.max(0, 12 - moves));
}


