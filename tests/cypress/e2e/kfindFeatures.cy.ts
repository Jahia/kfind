import {enableModule, createSite, deleteSite} from '@jahia/cypress';
import {closeSearchModal, searchInModal} from './kfindProviders.helpers';

describe('kFind features provider', () => {
    const SITE_KEY = 'kfind-features-site';

    before('Create test site and enable kfind', () => {
        createSite(SITE_KEY, {locale: 'en', serverName: 'localhost', templateSet: 'kfind-test-module'});
        enableModule('kfind', SITE_KEY);
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

    it('returns feature results for page models query', () => {
        searchInModal('page models');

        cy.get('[data-kfind-panel="true"]').contains('Features', {timeout: 10000});
        cy.get('[data-kfind-panel="true"]').contains(/page\s*models/i, {timeout: 10000});
    });

    it('does not return feature results for unknown query', () => {
        searchInModal('kfind-feature-no-match-xyz');

        cy.get('[data-kfind-empty-state="no-results"]', {timeout: 10000}).should('be.visible');
        cy.get('[data-kfind-panel="true"]').should('not.contain', 'Features');
    });
});
