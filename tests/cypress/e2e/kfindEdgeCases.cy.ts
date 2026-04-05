import {
    createPageViaGraphql,
    createTestToken,
    openSearchModal,
    searchInModal,
    SITE_KEY,
    updateKfindConfigurationViaGraphql,
    visitKfindSiteInJContent
} from './kfindProviders.helpers';

describe('kFind edge cases and shortcuts', () => {
    const token = createTestToken();
    const pageTitle = `kfind edge title ${token}`;
    const urlLookupPageName = `kfind-url-lookup-${token}`;
    const urlLookupTitle = `kfind url lookup ${token}`;

    before('Seed content', () => {
        cy.login();
        createPageViaGraphql(SITE_KEY, `kfind-edge-page-${token}`, pageTitle);
        createPageViaGraphql(SITE_KEY, urlLookupPageName, urlLookupTitle);
    });

    beforeEach(function () {
        visitKfindSiteInJContent(SITE_KEY);

        const currentTestTitle = this.currentTest?.fullTitle() || 'unknown test';
        cy.log(`[kfind-test] ${currentTestTitle}`);
        cy.window().then(win => {
            win.console.log('[kfind-test]', currentTestTitle);
        });
    });

    afterEach(() => {
        cy.closeKfindModalIfOpen();
    });

    it('shows global no-results state for an unknown query', () => {
        searchInModal('kfind-edge-no-match-xyz');

        cy.get('[data-kfind-panel="true"]').contains('No results', {timeout: 2000});
    });

    it('keeps the modal responsive for special-character queries', () => {
        const specialQuery = '"/sites/test?x=1&y=2"';
        searchInModal(specialQuery);

        cy.get('[data-kfind-panel="true"]', {timeout: 2000}).should('be.visible');
        cy.get('@searchInput').should('have.value', specialQuery);
    });

    it('matches page results with case-insensitive query', () => {
        searchInModal(pageTitle.toUpperCase());

        cy.get('[data-kfind-panel="true"]').contains('Pages', {timeout: 2000});
        cy.get('[data-kfind-panel="true"]').contains(pageTitle, {timeout: 2000});
    });

    it('closes the modal when pressing Escape', () => {
        openSearchModal();

        cy.get('body').type('{esc}');
        cy.get('[data-kfind-panel="true"]').should('not.exist');
    });

    it('toggles modal visibility with Ctrl+K', () => {
        openSearchModal();

        cy.get('body').type('{ctrl}k');
        cy.get('[data-kfind-panel="true"]').should('not.exist');

        cy.get('body').type('{ctrl}k');
        cy.get('[data-kfind-panel="true"]', {timeout: 2000}).should('be.visible');
    });

    it('does not trigger search below min chars and starts searching at min chars', () => {
        updateKfindConfigurationViaGraphql({
            minSearchChars: 3,
            jcrFindDelayInTypingToLaunchSearch: 80
        });

        cy.reload();
        openSearchModal();

        cy.get('@searchInput').clear();
        cy.get('@searchInput').type('ab');
        cy.get('[data-kfind-empty-state="hint"]', {timeout: 2000}).should('be.visible');

        cy.get('@searchInput').clear();
        cy.get('@searchInput').type('abc');
        cy.get('[data-kfind-empty-state="no-results"]', {timeout: 4000}).should('be.visible');
    });
});
