import React, { useCallback, useMemo } from "react";
import {
  Button,
  DataTable,
  Edit,
  EmptyData,
  Loader,
  Search,
  TableRow,
  Tooltip,
  Typography,
  Warning,
  Close,
} from "@jahia/moonstone";
import type { Row } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { ResultCard } from "./ResultCard.tsx";
import type { SearchHit } from "./searchQuery.ts";
import { locateInJContent } from "./searchUtils.ts";

const ROW_HEIGHT = "96px";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const editNode = (path: string) =>
  (window.parent as any).CE_API?.edit({ path });

type SearchResultsViewProps = {
  isSiteIndexed: boolean | null;
  searchEnabled: boolean;
  trimmedQuery: string;
  loading: boolean;
  hits: SearchHit[];
  /** The query string of the last completed search — used to gate the no-results state. */
  currentQuery: string;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  sentinelRef: React.RefObject<HTMLDivElement>;
  /** Ref to the input wrapper — used to refocus the input on ArrowUp from first row. */
  inputWrapperRef: React.RefObject<HTMLDivElement>;
  onNavigate?: () => void;
};

export const SearchResultsView = ({
  isSiteIndexed,
  searchEnabled,
  trimmedQuery,
  loading,
  hits,
  currentQuery,
  scrollContainerRef,
  sentinelRef,
  inputWrapperRef,
  onNavigate,
}: SearchResultsViewProps) => {
  const { t } = useTranslation();

  // Column config is stable — ResultCard has no external dependencies.
  const columns = useMemo(
    () => [
      {
        key: "displayableName" as const,
        label: "",
        width: "calc(100% - 32px)",
        render: (_value: unknown, row: SearchHit) => <ResultCard hit={row} />,
      },
    ],
    [],
  );

  // Wraps each DataTable row with click/keyboard navigation and a hover edit action.
  const renderRow = useCallback(
    (
      row: Row<SearchHit>,
      defaultRender: (opts?: {
        actions?: React.ReactNode;
        actionsOnHover?: React.ReactNode;
      }) => React.ReactNode,
    ) => (
      <TableRow
        key={row.id}
        style={{ height: ROW_HEIGHT, cursor: "pointer" }}
        onClick={() => {
          locateInJContent(row.original.path);
          onNavigate?.();
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            locateInJContent(row.original.path);
            onNavigate?.();
            return;
          }
          if (e.key === "e" || e.key === "E") {
            e.preventDefault();
            editNode(row.original.path);
            return;
          }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const rows = Array.from(
              scrollContainerRef.current?.querySelectorAll<HTMLElement>(
                ".moonstone-tableRow[tabindex]",
              ) ?? [],
            );
            const idx = rows.indexOf(e.currentTarget as HTMLElement);
            const next = e.key === "ArrowDown" ? idx + 1 : idx - 1;
            if (next >= 0 && next < rows.length) rows[next].focus();
            // ArrowUp on the first row returns focus to the search input.
            else if (next < 0)
              inputWrapperRef.current
                ?.querySelector<HTMLElement>("input")
                ?.focus();
          }
        }}
      >
        {defaultRender({
          actions: (
            <Tooltip label={t("search.action.edit", "Edit")}>
              <Button
                size="big"
                variant="ghost"
                icon={<Edit width={24} height={24} />}
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  editNode(row.original.path);
                }}
              />
            </Tooltip>
          ),
        })}
      </TableRow>
    ),
    [t, onNavigate],
  );

  return (
    /*
     * Scrollable results area — also serves as the IntersectionObserver root
     * for infinite scroll. The sentinel <div> at the bottom of this container
     * triggers the next-page load when it scrolls into view.
     */
    <div
      ref={scrollContainerRef}
      style={{ overflowY: "auto", flex: 1, minWidth: 0, padding: "4px 8px 0" }}
    >
      {/* ── Site not indexed ── */}
      {isSiteIndexed === false && (
        <EmptyData
          style={{ height: "80%" }}
          icon={<Warning size="big" />}
          title={t("search.notIndexed.title", "Search unavailable.")}
          message={t(
            "search.notIndexed.hint",
            "This site is not indexed for augmented search. Ask an administrator to enable it.",
          )}
        />
      )}

      {/* ── Empty state (shown until user types 3+ chars) ── */}
      {searchEnabled && trimmedQuery.length < 3 && (
        <EmptyData
          style={{ height: "80%" }}
          icon={<Search size="big" />}
          title={t("search.empty.title", "Find anything.")}
          message={t(
            "search.empty.hint",
            "Pages, content, documents — just start typing (3 chars min).",
          )}
        />
      )}

      {/* ── Skeleton loader (shown while the first page is fetching) ── */}
      {searchEnabled &&
        loading &&
        hits.length === 0 &&
        trimmedQuery.length >= 3 && (
          <EmptyData
            style={{ height: "80%" }}
            icon={<Loader size="big" />}
            message={t("search.loading", "Searching…")}
          />
        )}

      {/* ── No results (only shown once the query has actually completed) ── */}
      {searchEnabled &&
        trimmedQuery.length >= 3 &&
        !loading &&
        hits.length === 0 &&
        currentQuery === trimmedQuery && (
          <EmptyData
            style={{ height: "80%" }}
            icon={<Close size="big" />}
            title={t("search.noResults.title", "No results.")}
            message={t(
              "search.noResults.hint",
              'Nothing matched "{{q}}". Try different keywords or check for typos.',
              { q: trimmedQuery },
            )}
          />
        )}

      <DataTable<SearchHit>
        data={hits}
        primaryKey="id"
        columns={columns}
        renderRow={renderRow}
      />

      {/* Sentinel triggers IntersectionObserver to load the next page */}
      <div ref={sentinelRef} style={{ height: "1px" }} />

      {loading && hits.length > 0 && (
        <div style={{ textAlign: "center", padding: "8px" }}>
          <Typography variant="caption">
            {t("search.loadingMore", "Loading more…")}
          </Typography>
        </div>
      )}
    </div>
  );
};
