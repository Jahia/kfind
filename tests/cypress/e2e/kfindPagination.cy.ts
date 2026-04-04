import {
    closeSearchModal,
    createPageViaGraphql,
    searchInModal,
    SITE_KEY
} from './kfindProviders.helpers';

describe('kFind pagination behavior', () => {
    const token = Date.now().toString();

    before('Seed many pages', () => {
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

    it('shows a Show more button when a section has additional results', () => {
        searchInModal(`kfind pagination ${token}`);

        cy.get('[data-kfind-panel="true"]').contains('Pages', {timeout: 10000});
        cy.get('[data-kfind-show-more="true"]', {timeout: 20000}).first().should('be.visible');
    });

    it('loads more results after clicking Show more', () => {
        searchInModal(`kfind pagination ${token}`);

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

    it('keeps ArrowUp and ArrowDown navigation on result rows (not Show more)', () => {
        searchInModal(`kfind pagination ${token}`);

        cy.get('[data-kfind-result-row="true"][tabindex]', {timeout: 20000})
            .its('length')
            .then(initialCount => {
                const count = Number(initialCount);
                expect(count).to.be.greaterThan(0);
            });

        cy.get('@searchInput').type('{downarrow}');
        cy.focused().should('have.attr', 'data-kfind-result-row', 'true');

        cy.get('[data-kfind-show-more="true"]', {timeout: 20000}).first().focus();
        cy.focused().type('{downarrow}');
        cy.focused().should('have.attr', 'data-kfind-result-row', 'true');

        cy.get('[data-kfind-show-more="true"]', {timeout: 20000}).first().focus();
        cy.focused().type('{uparrow}');
        cy.focused().should('have.attr', 'data-kfind-result-row', 'true');
    });
});
