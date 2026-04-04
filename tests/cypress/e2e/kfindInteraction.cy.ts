import {
    closeSearchModal,
    createPageViaGraphql,
    searchInModal,
    SITE_KEY
} from './kfindProviders.helpers';

describe('kFind keyboard interaction', () => {
    const token = Date.now().toString();

    before('Seed page content', () => {
        cy.login();
        createPageViaGraphql(SITE_KEY, `kfind-nav-alpha-${token}`, `kfind nav alpha ${token}`);
        createPageViaGraphql(SITE_KEY, `kfind-nav-beta-${token}`, `kfind nav beta ${token}`);
    });

    beforeEach(() => {
        cy.login();
        cy.visit(`/jahia/jcontent/${SITE_KEY}/en/pages`);
        cy.get('body', {timeout: 30000}).should('be.visible');
    });

    afterEach(() => {
        closeSearchModal();
    });

    it('focuses the first result when pressing ArrowDown from the input', () => {
        searchInModal(`kfind nav ${token}`);

        cy.get('@searchInput').type('{downarrow}');
        cy.focused().should('have.attr', 'data-kfind-result-row', 'true');
    });

    it('navigates between result rows with ArrowDown and ArrowUp', () => {
        searchInModal(`kfind nav ${token}`);

        cy.get('@searchInput').type('{downarrow}');
        cy.focused().as('firstFocusedResult');

        cy.focused().type('{downarrow}');
        cy.focused().as('secondFocusedResult');

        cy.get('@firstFocusedResult').then($first => {
            cy.get('@secondFocusedResult').should($second => {
                expect($second[0]).to.not.equal($first[0]);
            });
        });

        cy.focused().type('{uparrow}');
        cy.get('@firstFocusedResult').should('be.focused');
    });

    it('returns focus to the search input when pressing ArrowUp on the first result', () => {
        searchInModal(`kfind nav ${token}`);

        cy.get('@searchInput').type('{downarrow}');
        cy.focused().type('{uparrow}');

        cy.get('@searchInput').should('be.focused');
    });
});
