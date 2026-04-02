import {createSite, enableModule} from '@jahia/cypress';
import {SITE_KEY} from './kfindProviders.helpers';

describe('kFind test suite setup', () => {
    it('creates the shared test site and enables kfind', () => {
        createSite(SITE_KEY, {locale: 'en', serverName: 'localhost', templateSet: 'kfind-test-module'});
        enableModule('kfind', SITE_KEY);
    });
});
