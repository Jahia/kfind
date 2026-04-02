import {enableModule, createSite, deleteSite} from '@jahia/cypress';
import {
    closeSearchModal,
    createPageViaGraphql,
    searchInModal
} from './kfindProviders.helpers';

describe('kFind pagination behavior', () => {
    const SITE_KEY = 'kfind-pagination-site';
    const token = Date.now().toString();

    before('Create test site, enable module and seed many pages', () => {
        createSite(SITE_KEY, {locale: 'en', serverName: 'localhost', templateSet: 'kfind-test-module'});
        enableModule('kfind', SITE_KEY);

        cy.login();
        cy.wrap([...Array(8).keys()]).each(index => {
            createPageViaGraphql(
                SITE_KEY,
                `kfind-pagination-${token}-${index}`,
                `kfind pagination ${token} item ${index}`
            );
        });
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

    it('shows a Show more button when a section has additional results', () => {
        searchInModal(`kfind pagination ${token}`);

        cy.get('.search-modal').contains('Pages', {timeout: 10000});
        cy.get('.search-modal button').contains(/^Show more$/i, {timeout: 20000}).should('be.visible');
    });

    it('loads more results after clicking Show more', () => {
        searchInModal(`kfind pagination ${token}`);

        cy.get('[data-kfind-result][tabindex]', {timeout: 20000})
            .its('length')
            .then(initialCount => {
                const countBefore = Number(initialCount);
                expect(countBefore).to.be.greaterThan(0);

                cy.get('.search-modal button').contains(/^Show more$/i, {timeout: 20000}).click();

                cy.get('[data-kfind-result][tabindex]', {timeout: 20000})
                    .its('length')
                    .should('be.greaterThan', countBefore);
            });
    });
});
