/**
 * Checks whether the current site has augmented search enabled.
 *
 * Queries the site node for the `jmix:augmentedSearchIndexableSite` mixin.
 * The result is cached at module level per site key so subsequent mounts
 * (e.g. re-opening the modal) don't re-query.
 *
 * Returns:
 * - `isAugmented` — true if the mixin is present (default true until check completes).
 * - `checkDone` — false while the query is in flight; true once resolved.
 *
 * The orchestration hook waits for `checkDone` before firing the first
 * search so it knows whether to use augmented or JCR drivers.
 */
import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { SITE_INDEX_QUERY } from "../augmented/augmentedSearchQuery.ts";
import { getSiteKey } from "./searchUtils.ts";

// Module-level cache: site key → whether augmented search is available.
// Populated once per site per page load — never re-queried.
const siteIndexCache = new Map<string, boolean>();

export const useIsAugmentedAvailable = () => {
  const [isAugmented, setIsAugmented] = useState(() => {
    const cached = siteIndexCache.get(getSiteKey());
    return cached !== undefined ? cached : true;
  });

  const [checkDone, setCheckDone] = useState(
    () => siteIndexCache.get(getSiteKey()) !== undefined,
  );

  const [checkSiteIndex] = useLazyQuery<{
    jcr: { nodeByPath: { isNodeType: boolean } };
  }>(SITE_INDEX_QUERY, {
    fetchPolicy: "cache-first",
    onCompleted: (result) => {
      const indexed = result?.jcr?.nodeByPath?.isNodeType ?? false;
      siteIndexCache.set(getSiteKey(), indexed);
      setIsAugmented(indexed);
      setCheckDone(true);
    },
  });

  useEffect(() => {
    if (siteIndexCache.get(getSiteKey()) === undefined) {
      void checkSiteIndex({ variables: { path: `/sites/${getSiteKey()}` } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isAugmented, checkDone };
};
