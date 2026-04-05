import {ensureSiteExists, SITE_KEY} from './kfindProviders.helpers';

describe('kFind test suite setup', () => {
    it('creates the shared test site and enables kfind when missing', () => {
        ensureSiteExists(SITE_KEY);
    });
});
