import { ApolloClient, ApolloProvider, useApolloClient } from "@apollo/client";
import type { NormalizedCacheObject } from "@apollo/client";
import { DefaultEntry, PrimaryNavItem, Search } from "@jahia/moonstone";
import { registry } from "@jahia/ui-extender";
import i18n from "i18next";
import { I18nextProvider } from "react-i18next";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { AdminPanel } from "./AdminPanel.tsx";
import { SearchModal } from "./SearchModal.tsx";
import { setApolloClient } from "./apolloClientBridge.ts";

// Both NavSearchButton and CaptureApolloClient live inside jcontent's
// ApolloProvider tree, so useApolloClient() gives us the host's client.
// We store it in the bridge so our separate React roots (modal, etc.) can
// use it without needing their own provider.
function useStoreApolloClient() {
  const client = useApolloClient();
  useEffect(() => {
    setApolloClient(client as ApolloClient<NormalizedCacheObject>);
  }, [client]);
}
// Captures jcontent's Apollo client as soon as the primary nav renders
// (i.e. at app startup, before the admin panel is ever visited).
const NavSearchButton: React.FC = () => {
  useStoreApolloClient();
  return (
    <PrimaryNavItem
      icon={<Search />}
      label="Search"
      onClick={() => window.dispatchEvent(new CustomEvent("augmented-authoring:open-search"))}
    />
  );
};

// Fallback capture: ensures the client is stored even if the nav item above
// never renders (e.g. the nav is hidden or the feature flag is off).
const CaptureApolloClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useStoreApolloClient();
  return <>{children}</>;
};

export const registerRoutes = async () => {
  await i18n.loadNamespaces("augmented-authoring");

  // Mount the search modal once, independent of the active route, so the
  // cmd+k shortcut works from anywhere in the application.
  const modalContainer = document.createElement("div");
  modalContainer.id = "augmented-authoring-search-modal";
  document.body.appendChild(modalContainer);
  createRoot(modalContainer).render(
    <I18nextProvider i18n={i18n} defaultNS="augmented-authoring">
      <SearchModal />
    </I18nextProvider>
  );

  registry.add("primary-nav-item", "augmented-authoring-search", {
    targets: ["nav-root-top:99"],
    render: () => <NavSearchButton />,
  });

  registry.add("adminRoute", "augmented-authoring", {
    targets: ["jcontent:10"],
    icon: <DefaultEntry />,
    label: "augmented-authoring:label",
    path: `*`, // Catch everything and let the app handle routing logic
    defaultPath: "",
    isSelectable: true,
    render: () => (
      <I18nextProvider i18n={i18n} defaultNS="augmented-authoring">
        <CaptureApolloClient>
          <AdminPanel />
        </CaptureApolloClient>
      </I18nextProvider>
    ),
  });

  console.debug("%c augmented-authoring is activated", "color: #3c8cba");
};