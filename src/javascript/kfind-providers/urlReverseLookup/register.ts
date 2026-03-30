/**
 * Registers the URL reverse lookup search provider.
 *
 * Resolves pasted live URLs to JCR nodes via vanity URL or direct path
 * matching. Only fires when the query looks like a URL (`canHandle`).
 *
 * The GraphQL field returns a list of matching nodes (deduplicated
 * server-side). Multiple candidates are tried for each URL.
 */
import { registry } from "@jahia/ui-extender";
import type {
  ApolloClientInstance,
  KFindProvider,
  KFindResultsProvider,
  SearchHit,
} from "../types.ts";
import type { GqlJcrNode } from "../searchTypes.ts";
import {
  getSiteKey,
  getSearchLanguage,
  locateInJContent,
} from "../../kfind/shared/navigationUtils.ts";
import {
  isProviderEnabled,
  getDefaultDisplayedResults,
} from "../../kfind/shared/configUtils.ts";
import { jcrNodeToSearchHit } from "../jcr/jcrSearchProvider.ts";
import { URL_REVERSE_LOOKUP_QUERY } from "./urlReverseLookupQuery.ts";

/** Heuristic: does the input look like a URL or an absolute path? */
function looksLikeUrl(input: string): boolean {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return true;
  }

  if (input.startsWith("/") && input.length > 1) {
    return true;
  }

  if (/^[\w-]+\.[\w.-]+\//.test(input)) {
    return true;
  }

  return false;
}

function createUrlReverseLookupProvider(
  client: ApolloClientInstance,
): KFindResultsProvider {
  return {
    search: async (query) => {
      const result = await client.query<{
        urlReverseLookup: GqlJcrNode[];
      }>({
        query: URL_REVERSE_LOOKUP_QUERY,
        variables: {
          url: query,
          siteKey: getSiteKey(),
          language: getSearchLanguage(),
        },
        fetchPolicy: "network-only",
      });

      const nodes = result.data?.urlReverseLookup ?? [];
      const hits: SearchHit[] = nodes.map(jcrNodeToSearchHit);

      return { hits, hasMore: false };
    },
    reset: () => {},
  };
}

const editNode = (hit: SearchHit) =>
  window.parent.CE_API?.edit({ path: hit.path });

const urlReverseLookupProvider: KFindProvider = {
  priority: 5,
  title: "search.urlReverseLookup.title",
  titleDefault: "Direct URL match",
  isEnabled: () => isProviderEnabled("urlReverseLookupEnabled"),
  maxResults: () => getDefaultDisplayedResults(),
  canHandle: looksLikeUrl,
  createSearchProvider: createUrlReverseLookupProvider,
  locate: (hit: SearchHit) => locateInJContent(hit.path, hit.nodeType),
  edit: editNode,
};

registry.add(
  "kfindProvider",
  "kfind-url-reverse-lookup",
  urlReverseLookupProvider,
);
