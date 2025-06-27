import { PluginAdapter } from '@coyoapp/plugin-adapter';

export class DemoPlugin {
  constructor() {
    console.log("--> pluginadapter.ts: File started execution.");

    new PluginAdapter().init().then(data => {
      console.log(" PluginAdapter initialized, raw data:", data);

      const test1 = data['cfg.test1'] || 'Not set';
      const test2 = data['cfg.test2'] || 'Not set';

      this.setText('test1', test1);
      this.setText('test2', test2);
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
