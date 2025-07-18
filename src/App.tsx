import { useQuery } from "@tanstack/react-query";
import { fetchToday } from "./api";
import Grid from "./components/Grid";
import { useState } from "react";

export default function App() {
  const { data, isLoading, error } = useQuery({ queryKey: ["today"], queryFn: fetchToday });
  const [solved, setSolved] = useState<number | null>(null);

  if (isLoading) return screen("Loading…");
  if (error || !data) return screen("Failed to fetch puzzle", true);

  function screen(msg: string, isErr = false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className={`text-xl ${isErr ? "text-red-600" : ""}`}>{msg}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-10 gap-6 bg-slate-100">
      <h1 className="text-3xl font-bold">Jumbles</h1>

      <Grid initial={data.grid} onSolved={(moves) => setSolved(moves)} />

      {solved !== null && (
        <ResultModal moves={solved} />
      )}
    </div>
  );
}

function ResultModal({ moves }: { moves: number }) {
  const [copied, setCopied] = useState(false);

  function share() {
    const text = `Jumbles — solved in ${moves} swaps!\n${emojiGrid(moves)}`;
    navigator.clipboard.writeText(text).then(() => setCopied(true));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-80 text-center space-y-4">
        <h2 className="text-2xl font-bold text-emerald-600">You solved it! 🎉</h2>
        <p className="text-gray-700">Moves used: {moves}</p>
        <button
          onClick={share}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {copied ? "Copied!" : "Share result"}
        </button>
      </div>
    </div>
  );
}

function emojiGrid(moves: number) {
  // simple placeholder; refine later
  return "🟩🟩🟩🟩";
}

