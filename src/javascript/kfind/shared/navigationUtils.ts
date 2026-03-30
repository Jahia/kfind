/**
 * Jahia context resolution and jContent SPA navigation helpers.
 */

function logNavigationDebug(message: string, error: unknown): void {
  if (!__DEV_BUILD__) return;
  // eslint-disable-next-line no-console
  console.debug(`[kfind][navigation] ${message}`, error);
}

export function getSiteKey(): string {
  if (window.contextJsParameters.siteKey) {
    return window.contextJsParameters.siteKey;
  }
  // Fallback: parse from URL pattern /administration/{siteKey}/settings/...
  const parts = window.location.pathname.split("/");
  const adminIndex = parts.indexOf("administration");
  return adminIndex !== -1 && parts[adminIndex + 1]
    ? parts[adminIndex + 1]
    : "default";
}

export function getUiLanguage(): string {
  return window.contextJsParameters.uilang ?? "en";
}

export function getSearchLanguage(): string {
  return window.contextJsParameters.lang ?? "en";
}

/**
 * Pushes a URL in the parent window history and dispatches a synthetic
 * popstate so jContent's router reacts without a full page reload.
 * Centralized to keep feature-navigation and content-navigation behavior aligned.
 */
export function pushParentNavigation(url: string): void {
  const navKey = String(Date.now());
  window.parent.history.pushState({ key: navKey }, "", url);
  window.parent.dispatchEvent(
    new PopStateEvent("popstate", { state: { key: navKey } }),
  );
}

/**
 * Navigates the parent Jahia shell to an in-app route path (admin routes,
 * jExperience, etc.) using the connected React Router history when available,
 * falling back to a raw pushState + synthetic popstate.
 *
 * `path` must be the in-app path WITHOUT the Jahia context root
 * (e.g. `/administration/mysite/jExperience/...`).
 *
 * The React Router history was created with `basename: urlbase` (typically `/jahia`),
 * so `routerHistory.push(path)` and the raw `pushState('/jahia' + path)` fallback
 * are functionally equivalent.
 */
export function pushRouteNavigation(path: string): void {
  const routerHistory = window.parent.jahia?.routerHistory;
  if (routerHistory) {
    routerHistory.push(path);
  } else {
    pushParentNavigation(`/jahia${path}`);
  }
}

/**
 * Navigates the parent jContent SPA to the given node path by pushing a new
 * URL into its history and firing a synthetic popstate so React Router picks
 * it up — without a full page reload.
 *
 * For pages and content-folders modes we force Page Builder view by both
 * setting localStorage (read by extractParamsFromUrl on URL change) and
 * dispatching SET_TABLE_VIEW_MODE to Redux so jContent's store listener
 * does not overwrite localStorage with the stale viewMode after navigation.
 */
export function locateInJContent(nodePath: string, nodeType?: string): void {
  const site = getSiteKey();
  const language = getUiLanguage();
  const siteBase = `/sites/${site}`;

  let parentPath = nodePath;
  if (!parentPath || !parentPath.startsWith(siteBase)) {
    parentPath = siteBase;
  }

  let mode: string;
  let urlPath: string;
  let mediaPreviewPath: string | null = null;
  if (parentPath.startsWith(`${siteBase}/files`)) {
    mode = "media";
    // Navigate to the parent folder so the file is visible in the listing.
    const filesRoot = `${siteBase}/files`;
    const lastSlash = parentPath.lastIndexOf("/");
    const folderPath =
      lastSlash > filesRoot.length
        ? parentPath.substring(0, lastSlash)
        : parentPath;
    urlPath = folderPath.replace(siteBase, "");
    mediaPreviewPath = nodePath;
  } else if (parentPath.startsWith(`${siteBase}/contents`)) {
    mode = "content-folders";
    urlPath = parentPath.replace(siteBase, "");
  } else {
    mode = "pages";
    urlPath = parentPath.replace(siteBase, "") || "/";
  }
  // Force Page Builder view for pages and content folders.
  // localStorage is the source read by jcontent's extractParamsFromUrl when
  // processing the LOCATION_CHANGE fired by pushRouteNavigation below.
  if (mode === "pages" || mode === "content-folders") {
    try {
      window.parent.localStorage.setItem(
        `jcontent-previous-tableView-viewMode-${site}-${mode}`,
        "pageBuilder",
      );
    } catch (error) {
      // localStorage may be blocked (privacy settings) — continue anyway
      logNavigationDebug("Unable to persist pageBuilder viewMode", error);
    }
  }

  // Path encoding mirrors jcontent's buildUrl: encodeURIComponent every
  // non-slash character (JContent.utils.js / JContent.redux.js).
  const encodedPath = urlPath.replace(/[^/]/g, encodeURIComponent);

  // pushRouteNavigation uses routerHistory.push() (basename '/jahia') which
  // dispatches LOCATION_CHANGE synchronously. jcontent's viewModeReducer then
  // calls extractParamsFromUrl, which reads 'pageBuilder' from localStorage.
  pushRouteNavigation(`/jcontent/${site}/${language}/${mode}${encodedPath}`);

  // For media files: open jContent's preview drawer for the located file.
  // CM_DRAWER_STATES.SHOW = 2 (from jcontent redux/JContent.redux.js)
  if (mediaPreviewPath) {
    try {
      window.parent.jahia?.reduxStore?.dispatch({
        type: "CM_SET_PREVIEW_SELECTION",
        payload: mediaPreviewPath,
      });
      window.parent.jahia?.reduxStore?.dispatch({
        type: "CM_SET_PREVIEW_STATE",
        payload: 2,
      });
    } catch (error) {
      // reduxStore may not be accessible in all contexts
      logNavigationDebug("Unable to open media preview drawer", error);
    }
  }
}
