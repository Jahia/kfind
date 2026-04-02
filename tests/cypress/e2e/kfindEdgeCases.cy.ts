import {enableModule, createSite, deleteSite} from '@jahia/cypress';
import {
    closeSearchModal,
    createPageViaGraphql,
    openSearchModal,
    searchInModal
} from './kfindProviders.helpers';

describe('kFind edge cases and shortcuts', () => {
    const SITE_KEY = 'kfind-edge-site';
    const token = Date.now().toString();
    const pageTitle = `kfind edge title ${token}`;

    before('Create test site, enable module and seed content', () => {
        createSite(SITE_KEY, {locale: 'en', serverName: 'localhost', templateSet: 'kfind-test-module'});
        enableModule('kfind', SITE_KEY);

        cy.login();
        createPageViaGraphql(SITE_KEY, `kfind-edge-page-${token}`, pageTitle);
    });

    beforeEach(() => {
        cy.login();
        cy.visit(`/jahia/jcontent/${SITE_KEY}/en/pages`);
        cy.get('body', {timeout: 30000}).should('be.visible');
    });

    afterEach(() => {
        closeSearchModal();
    });

    after('Delete test site', () => {
        deleteSite(SITE_KEY);
    });

    it('shows global no-results state for an unknown query', () => {
        searchInModal('kfind-edge-no-match-xyz');

        cy.get('[data-kfind-panel="true"]').contains('No results', {timeout: 10000});
    });

    it('keeps the modal responsive for special-character queries', () => {
        const specialQuery = '"/sites/test?x=1&y=2"';
        searchInModal(specialQuery);

        cy.get('[data-kfind-panel="true"]', {timeout: 10000}).should('be.visible');
        cy.get('@searchInput').should('have.value', specialQuery);
    });

    it('matches page results with case-insensitive query', () => {
        searchInModal(pageTitle.toUpperCase());

        cy.get('[data-kfind-panel="true"]').contains('Pages', {timeout: 10000});
        cy.get('[data-kfind-panel="true"]').contains(pageTitle, {timeout: 20000});
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
        cy.get('[data-kfind-panel="true"]', {timeout: 10000}).should('be.visible');
    });
});
