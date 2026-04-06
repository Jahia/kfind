import {
    MEDIUM_TIMEOUT,
    searchInModal,
    SITE_KEY,
    updateKfindConfigurationViaGraphql,
    visitKfindSiteInJContent
} from './kfindProviders.helpers';

describe('kFind features provider', () => {
    const setFeaturesProviderEnabled = (enabled: boolean) => {
        return updateKfindConfigurationViaGraphql({uiFeaturesEnabled: enabled}).then(() => {
            cy.reload();
        });
    };

    beforeEach(() => {
        visitKfindSiteInJContent(SITE_KEY);
    });

    afterEach(() => {
        cy.closeKfindModalIfOpen();
    });

    it('returns feature results for page models query', () => {
        searchInModal('page models');

        cy.get('[data-kfind-panel="true"]').contains('Features', {timeout: MEDIUM_TIMEOUT});
        cy.get('[data-kfind-panel="true"]').contains(/page\s*models/i, {timeout: MEDIUM_TIMEOUT});
    });

    it('does not return feature results for unknown query', () => {
        searchInModal('kfind-feature-no-match-xyz');

        cy.get('[data-kfind-empty-state="no-results"]', {timeout: MEDIUM_TIMEOUT}).should('be.visible');
        cy.get('[data-kfind-panel="true"]').should('not.contain', 'Features');
    });

    it('respects uiFeaturesEnabled config when toggled off and back on', () => {
        setFeaturesProviderEnabled(false);
        searchInModal('page models');

        cy.get('[data-kfind-results-section-key="kfind-features"]').should('not.exist');
        cy.get('[data-kfind-panel="true"]').should('not.contain', 'Features');

        cy.closeKfindModalIfOpen();

        setFeaturesProviderEnabled(true);
        searchInModal('page models');

        cy.get('[data-kfind-results-section-key="kfind-features"]', {timeout: MEDIUM_TIMEOUT}).should('be.visible');
    });
});
