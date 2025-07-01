import { PluginAdapter } from '@coyoapp/plugin-adapter';

export class DemoPlugin {
  constructor() {
    console.log("--> pluginadapter.ts: File started execution.");

    new PluginAdapter().init().then(async data => {
      console.log(" PluginAdapter initialized, raw data:", data);

      const tenantId = data['cfg.tenantId'] || '';
      const clientId = data['cfg.clientId'] || '';
      const clientSecret = data['cfg.clientSecret'] || '';
      const scope = data['cfg.scope'] || 'https://graph.microsoft.com/.default';
      const apiEndpoint = data['cfg.apiEndpoint'] || 'https://graph.microsoft.com/v1.0/users';

      this.setText('tenantId', tenantId || 'Not set');
      this.setText('clientId', clientId || 'Not set');
      this.setText('clientSecret', clientSecret ? '********' : 'Not set');
      this.setText('scope', scope);
      this.setText('apiEndpoint', apiEndpoint);

      // Only proceed if all required fields are set
      if (tenantId && clientId && clientSecret) {
        try {
          // 1. Get access token
          const tokenResp = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              scope: scope,
              client_secret: clientSecret,
              grant_type: 'client_credentials'
            })
          });
          const tokenData = await tokenResp.json();
          if (!tokenData.access_token) {
            console.error('Failed to get access token:', tokenData);
            return;
          }
          // 2. Call Microsoft Graph API
          const usersResp = await fetch(apiEndpoint, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          });
          const usersData = await usersResp.json();
          console.log('Microsoft Graph API response:', usersData);
        } catch (err) {
          console.error('Error fetching Microsoft Graph data:', err);
        }
      } else {
        console.warn('Tenant ID, Client ID, or Client Secret not set. Cannot fetch Microsoft Graph data.');
      }
    }).catch(err => {
      console.error(" Failed to initialize plugin:", err);
      document.body.innerHTML = `<p style="color:red">Plugin failed to load: ${err}</p>`;
    });
  }

  private setText(id: string, value: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
}

new DemoPlugin();
