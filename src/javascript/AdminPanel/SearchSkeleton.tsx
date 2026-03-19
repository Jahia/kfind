import React from "react";

const SKELETON_CSS = `
  @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
  .augmented-skeleton {
    background: linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%);
    background-size: 600px 100%;
    animation: shimmer 1.2s infinite linear;
    border-radius: 4px;
  }
`;

/** Placeholder rows shown while the first page of search results is loading.
 *  Row count and dimensions match the real DataTable rows so the layout
 *  doesn't shift when results arrive. */
export const SearchSkeleton = () => (
  <div>
    <style>{SKELETON_CSS}</style>
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        style={{
          display: "flex",
          alignItems: "center",
          height: "76px",
          padding: "0 12px",
          gap: "12px",
          borderBottom: "1px solid var(--color-white)",
        }}
      >
        {/* Icon placeholder */}
        <div style={{ flex: "0 0 32px" }}>
          <div
            className="augmented-skeleton"
            style={{ width: "32px", height: "32px", borderRadius: "6px" }}
          />
        </div>
        {/* Title + excerpt placeholders — vary widths for a natural look */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            className="augmented-skeleton"
            style={{ width: `${60 + ((i * 13) % 30)}%`, height: "14px" }}
          />
          <div
            className="augmented-skeleton"
            style={{ width: `${40 + ((i * 17) % 40)}%`, height: "11px" }}
          />
        </div>
        {/* Date/author placeholder */}
        <div
          style={{
            flex: "0 0 80px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            className="augmented-skeleton"
            style={{ width: "60px", height: "11px" }}
          />
          <div
            className="augmented-skeleton"
            style={{ width: "48px", height: "11px" }}
          />
        </div>
      </div>
    ))}
  </div>
);
