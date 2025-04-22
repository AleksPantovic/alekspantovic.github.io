import { PluginAdapter } from '@coyoapp/plugin-adapter';
import axios from 'axios';

const PLUGIN_BACKEND_INIT = '/auth/init';

const adapter = new PluginAdapter();
adapter.init(false, undefined, false)
    .then(initResponse => {
        return axios.post(PLUGIN_BACKEND_INIT, {
            token: initResponse.token
        });
    })
    .then(accessToken => {
        // Store backend access token for upcoming requests
        console.log('Backend Access Token:', accessToken.data);
    })
    .catch(err => {
        // Handle initialization errors
        console.error('Initialization Error:', err.message);
    });
