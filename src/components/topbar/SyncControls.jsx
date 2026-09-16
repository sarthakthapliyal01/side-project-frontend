import React from "react";
import { RefreshCw } from "lucide-react";

export default function SyncControls({ syncing, onSyncAll, lastSyncedText }) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        type="button"
        onClick={onSyncAll}
        disabled={syncing}
        className="flex items-center gap-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent font-semibold text-xs rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50 cursor-pointer"
        title="Sync Jira and GitHub data"
      >
        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
        <span>{syncing ? "Syncing..." : "Sync All"}</span>
      </button>
      {lastSyncedText && (
        <span className="text-2xs font-medium text-muted hidden xl:inline-block">
          {lastSyncedText}
        </span>
      )}
    </div>
  );
}
