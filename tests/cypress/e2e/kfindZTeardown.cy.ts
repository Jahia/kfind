import {deleteSite} from '@jahia/cypress';
import {SITE_KEY} from './kfindProviders.helpers';

describe('kFind test suite teardown', () => {
    it('deletes the shared test site', () => {
        deleteSite(SITE_KEY);
    });
});
