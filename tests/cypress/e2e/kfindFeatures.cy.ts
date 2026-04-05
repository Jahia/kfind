import {searchInModal, updateKfindConfigurationViaGraphql, visitKfindSiteInJContent} from './kfindProviders.helpers';

describe('kFind features provider', () => {
    const setFeaturesProviderEnabled = (enabled: boolean) => {
        return updateKfindConfigurationViaGraphql({uiFeaturesEnabled: enabled}).then(() => {
            cy.reload();
        });
    };

    beforeEach(() => {
        visitKfindSiteInJContent();
    });

    afterEach(() => {
        cy.closeKfindModalIfOpen();
    });

    it('returns feature results for page models query', () => {
        searchInModal('page models');

        cy.get('[data-kfind-panel="true"]').contains('Features', {timeout: 2000});
        cy.get('[data-kfind-panel="true"]').contains(/page\s*models/i, {timeout: 2000});
    });

    it('does not return feature results for unknown query', () => {
        searchInModal('kfind-feature-no-match-xyz');

        cy.get('[data-kfind-empty-state="no-results"]', {timeout: 2000}).should('be.visible');
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

        cy.get('[data-kfind-results-section-key="kfind-features"]', {timeout: 2000}).should('be.visible');
    });
});
