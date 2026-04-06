import {
    buildVanityLookupUrl,
    createPageViaGraphql,
    createTestToken,
    isJahiaVanityHostnameStrategy,
    MEDIUM_TIMEOUT,
    searchInModal,
    SITE_KEY,
    visitKfindSiteInJContent
} from './kfindProviders.helpers';

describe('kFind URL reverse lookup provider', () => {
    const token = createTestToken();
    const pageName = `kfind-url-lookup-${token}`;
    const pageTitle = `kfind url lookup ${token}`;
    const localePathPageName = 'buy';
    const homePathPageName = 'luxe-title';

    before('Seed URL lookup content', () => {
        cy.login();
        createPageViaGraphql(SITE_KEY, pageName, pageTitle);
        createPageViaGraphql(SITE_KEY, localePathPageName, `kfind locale path ${token}`);
        createPageViaGraphql(SITE_KEY, homePathPageName, `kfind home path ${token}`);
    });

    beforeEach(() => {
        visitKfindSiteInJContent(SITE_KEY);
    });

    afterEach(() => {
        cy.closeKfindModalIfOpen();
    });

    it('resolves a direct JCR path query to URL/path match results', () => {
        searchInModal(`/sites/${SITE_KEY}/home/${pageName}`);

        cy.get('[data-kfind-results-section-key="kfind-url-reverse-lookup"]', {timeout: MEDIUM_TIMEOUT}).should(
            'be.visible'
        );
        cy.get('[data-kfind-panel="true"]').contains(pageTitle, {timeout: MEDIUM_TIMEOUT});
    });

    it('resolves a short URL-like path to the page under /home', () => {
        searchInModal(`/${pageName}`);

        cy.get('[data-kfind-results-section-key="kfind-url-reverse-lookup"]', {timeout: MEDIUM_TIMEOUT}).should(
            'be.visible'
        );
        cy.get('[data-kfind-panel="true"]').contains(pageTitle, {timeout: MEDIUM_TIMEOUT});
    });

    it('resolves a full URL that includes a locale prefix in the path', () => {
        searchInModal('https://pmdemo-jahiapm.internal.cloud.jahia.com/fr/home/buy.html');

        cy.get('[data-kfind-results-section-key="kfind-url-reverse-lookup"]', {timeout: MEDIUM_TIMEOUT}).should(
            'be.visible'
        );
        cy.get('[data-kfind-panel="true"]').contains(`/home/${localePathPageName}`, {timeout: MEDIUM_TIMEOUT});
    });

    it('resolves a full URL under /home without /sites/{siteKey}', () => {
        searchInModal('https://pmdemo-jahiapm.internal.cloud.jahia.com/home/luxe-title.html');

        cy.get('[data-kfind-results-section-key="kfind-url-reverse-lookup"]', {timeout: MEDIUM_TIMEOUT}).should(
            'be.visible'
        );
        cy.get('[data-kfind-panel="true"]').contains(`/home/${homePathPageName}`, {timeout: MEDIUM_TIMEOUT});
    });

    (isJahiaVanityHostnameStrategy() ? it : it.skip)(
        'resolves a full vanity-style URL when running with jahia hostname strategy',
        () => {
            searchInModal(buildVanityLookupUrl(`/${pageName}`));

            cy.get('[data-kfind-results-section-key="kfind-url-reverse-lookup"]', {timeout: MEDIUM_TIMEOUT}).should(
                'be.visible'
            );
            cy.get('[data-kfind-panel="true"]').contains(pageTitle, {timeout: MEDIUM_TIMEOUT});
        }
    );
});
