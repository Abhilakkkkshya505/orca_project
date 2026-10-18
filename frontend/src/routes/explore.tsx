import React from "react";

export const ExplorePage: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-bg text-ink">
      <div className="p-4 border-b border-border bg-surface flex justify-between items-center">
        <h1 className="font-semibold text-lg">ORCA Explore — Chat & Interactive Map</h1>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-ink-muted">Chat and map interface ready for Phase 6 assembly.</p>
      </div>
    </div>
  );
};
