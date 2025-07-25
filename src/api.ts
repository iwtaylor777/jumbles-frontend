// src/api.ts
// ------------------------------------------------------------------
// Front-end helper for fetching the current puzzle (and, if you ever
// need it, an arbitrary date’s puzzle).
// ------------------------------------------------------------------

/** Base URL of the FastAPI/Render service.
 *  Keep it in .env as VITE_API to stay flexible between local / prod. */
const API = import.meta.env.VITE_API ?? "https://jumbles-api.onrender.com";

/** Fetch today’s puzzle (whatever the server thinks “today” is). */
export async function fetchToday() {
  const res = await fetch(`${API}/puzzle/today`, { credentials: "omit" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  /*  NOTE: We *return exactly* what the server sends – grid AND solution.
      No destructuring here, so the solution array is preserved.           */
  return (await res.json()) as {
    id: string;
    grid: string[][] | string[];
    solution: string[];
  };
}

/** Optional helper: fetch puzzle for yyyy-mm-dd */
export async function fetchByDate(id: string) {
  const res = await fetch(`${API}/puzzle/${id}`, { credentials: "omit" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as {
    id: string;
    grid: string[][] | string[];
    solution: string[];
  };
}



