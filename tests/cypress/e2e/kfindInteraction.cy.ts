import {closeSearchModal, createPageViaGraphql, searchInModal, SITE_KEY} from './kfindProviders.helpers';

const RESULT_ROW_SELECTOR = '[data-kfind-result-row="true"][tabindex]';

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

    it('does not move focus to results when pressing ArrowDown from the input', () => {
        searchInModal(`kfind nav ${token}`);

        cy.get('@searchInput').type('{downarrow}');
        cy.get('@searchInput').should('be.focused');
    });

    it('can focus a result row with Tab from the input', () => {
        searchInModal(`kfind nav ${token}`);

        cy.get('@searchInput').type('{tab}');
        cy.focused().should('match', RESULT_ROW_SELECTOR).should('have.attr', 'data-kfind-result-index', '0');
    });

    it('triggers primary action on Enter from a focused result row', () => {
        searchInModal(`kfind nav ${token}`);

        cy.get('@searchInput').type('{tab}');
        cy.focused().should('have.attr', 'data-kfind-result-index', '0');
        cy.focused().type('{enter}');
        cy.get('[data-kfind-panel="true"]').should('not.be.visible');
    });
});
