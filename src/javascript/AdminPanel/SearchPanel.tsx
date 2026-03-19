import React, { useEffect, useRef, useState } from "react";
import { Input, Search, Typography } from "@jahia/moonstone";
import { useTranslation } from "react-i18next";
import { useSearchResults } from "./useSearchResults.ts";
import { useInfiniteScroll } from "./useInfiniteScroll.ts";
import { SearchResultsView } from "./SearchResultsView.tsx";

type SearchContentProps = {
  focusOnField?: boolean;
  onNavigate?: () => void;
};

export const SearchContent = ({
  focusOnField,
  onNavigate,
}: SearchContentProps) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const {
    hits,
    totalHits,
    loading,
    isSiteIndexed,
    searchEnabled,
    currentQueryRef,
    triggerSearch,
    loadNextPage,
  } = useSearchResults(searchValue);

  const { scrollContainerRef, sentinelRef } = useInfiniteScroll(loadNextPage);

  // Keep the moonstone clear button out of the tab order — moonstone doesn't
  // expose a prop for this, so we patch it via a MutationObserver that fires
  // whenever the button is added to (or removed from) the DOM.
  useEffect(() => {
    const wrapper = inputWrapperRef.current;
    if (!wrapper) return;
    const patch = () => {
      wrapper
        .querySelectorAll<HTMLElement>(".moonstone-baseInput_clearButton")
        .forEach((el) => {
          el.tabIndex = -1;
        });
    };
    patch();
    const observer = new MutationObserver(patch);
    observer.observe(wrapper, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const trimmedQuery = searchValue.trim();

  return (
    // Outer flex column — fills the full height of the ModalBody
    <div>
      {/* ── Search input ── */}
      <div>
        <div ref={inputWrapperRef} style={{ flex: 1, minHeight: "36px" }}>
          <Input
            size="big"
            placeholder={t("search.placeholder", "Search…")}
            value={searchValue}
            icon={<Search />}
            focusOnField={focusOnField && searchEnabled}
            onChange={(e) => {
              if (searchEnabled) setSearchValue(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                const first =
                  scrollContainerRef.current?.querySelector<HTMLElement>(
                    ".moonstone-tableRow[tabindex]",
                  );
                first?.focus();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") triggerSearch(searchValue);
            }}
            onClear={() => setSearchValue("")}
          />
        </div>
      </div>

      {/* ── Result count — only shown once at least one hit exists ── */}
      {(hits.length > 0 || totalHits > 0) && (
        <Typography variant="caption">
          {t("search.results", "{{count}} result(s)", { count: totalHits })}
        </Typography>
      )}

      <SearchResultsView
        isSiteIndexed={isSiteIndexed}
        searchEnabled={searchEnabled}
        trimmedQuery={trimmedQuery}
        loading={loading}
        hits={hits}
        currentQuery={currentQueryRef.current}
        scrollContainerRef={scrollContainerRef}
        sentinelRef={sentinelRef}
        inputWrapperRef={inputWrapperRef}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export const SearchPanel = () => <SearchContent focusOnField />;
