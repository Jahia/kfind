import {enableModule, createSite, deleteSite} from '@jahia/cypress';
import {
    closeSearchModal,
    createMainResourceViaGraphql,
    searchInModal
} from './kfindProviders.helpers';

describe('kFind main resources provider', () => {
    const SITE_KEY = 'kfind-main-resources-site';
    const token = Date.now().toString();
    const exactTitle = `kfind main resource exact ${token}`;
    const broaderTitle = `kfind main resource broader ${token}`;

    before('Create test site, enable module and seed main resources via GraphQL', () => {
        createSite(SITE_KEY, {locale: 'en', serverName: 'localhost', templateSet: 'kfind-test-module'});
        enableModule('kfind', SITE_KEY);

        cy.login();

        createMainResourceViaGraphql(SITE_KEY, `kfind-main-resource-exact-${token}`, exactTitle);
        createMainResourceViaGraphql(SITE_KEY, `kfind-main-resource-broader-${token}`, broaderTitle);

        cy.wrap([...Array(8).keys()]).each(index => {
            createMainResourceViaGraphql(
                SITE_KEY,
                `kfind-main-resource-bulk-${token}-${index}`,
                `kfind main resource bulk ${token} item ${index}`
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

    it('finds a main resource created via GraphQL', () => {
        searchInModal(exactTitle);

        cy.get('[data-kfind-panel="true"]').contains(/Main Resource/i, {timeout: 10000});
        cy.get('[data-kfind-panel="true"]').contains(exactTitle, {timeout: 20000});
    });

    it('filters main resource results by query term', () => {
        searchInModal(`exact ${token}`);

        cy.get('[data-kfind-panel="true"]').contains(/Main Resource/i, {timeout: 10000});
        cy.get('[data-kfind-panel="true"]').contains(exactTitle, {timeout: 20000});
        cy.get('[data-kfind-panel="true"]').should('not.contain', broaderTitle);
    });

    it('shows more main resource results after clicking Show more', () => {
        searchInModal(`kfind main resource bulk ${token}`);

        cy.get('[data-kfind-panel="true"]').contains(/Main Resource/i, {timeout: 10000});
        cy.get('[data-kfind-result-row="true"][tabindex]', {timeout: 20000})
            .its('length')
            .then(initialCount => {
                const countBefore = Number(initialCount);
                expect(countBefore).to.be.greaterThan(0);

            cy.get('[data-kfind-show-more="true"]', {timeout: 20000}).first().click();

            cy.get('[data-kfind-result-row="true"][tabindex]', {timeout: 20000})
                    .its('length')
                    .should('be.greaterThan', countBefore);
            });
    });
});
