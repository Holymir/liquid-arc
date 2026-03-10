"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { ChevronDown, LogOut, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ConnectButton() {
  const { user, status, logout } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (status === "loading") {
    return (
      <div className="w-24 h-9 bg-slate-800/40 rounded-xl animate-pulse flex items-center justify-center">
        <Loader2 className="w-3.5 h-3.5 text-slate-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-slate-600 text-slate-200 px-3.5 py-2 rounded-xl text-sm transition-all"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="max-w-[120px] truncate">{user.email}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0c1019] border border-slate-700/50 rounded-xl shadow-xl py-1 z-50">
          <div className="px-3 py-2 border-b border-slate-800/50">
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <p className="text-[10px] text-indigo-400 uppercase tracking-wider mt-0.5">{user.tier}</p>
          </div>
          <button
            onClick={async () => {
              setMenuOpen(false);
              await logout();
              router.push("/");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
