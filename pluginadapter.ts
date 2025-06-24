import { PluginAdapter } from '@coyoapp/plugin-adapter';

export class HaiiloPlugin {
  constructor() {
    new PluginAdapter().init().then(data => {
      const apiKey = data['cfg.apiKey'] || 'Not set';
      const customTitle = data['cfg.customTitle'] || 'Not set';
      const userName = data['ctx.userName'] || 'Anonymous';

      document.getElementById('apiKey')!.textContent = apiKey;
      document.getElementById('customTitle')!.textContent = customTitle;
      document.getElementById('userName')!.textContent = userName;

      console.log("✅ Plugin data received:", data);
    }).catch(err => {
      console.error("❌ Failed to init plugin adapter:", err);
      document.body.innerHTML = `<p style="color:red">Plugin failed to load context/config.</p>`;
    });
  }
}

new HaiiloPlugin();
