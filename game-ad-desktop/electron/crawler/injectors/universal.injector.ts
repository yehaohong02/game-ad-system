import { BaseInjector } from './base.injector';

export class UniversalInjector extends BaseInjector {
  platform: string;
  private selectors: Record<string, { selector: string; attribute?: string }>;

  constructor(platform: string, selectors: Record<string, { selector: string; attribute?: string }>) {
    super();
    this.platform = platform;
    this.selectors = selectors;
  }

  inject(): string {
    const selectorEntries = JSON.stringify(this.selectors);
    return `
      (function() {
        const selectors = ${selectorEntries};
        const container = document.querySelector(selectors.container?.selector || 'body');
        if (!container) return JSON.stringify([]);

        const items = container.querySelectorAll(selectors.item?.selector || '*');
        const results = [];

        items.forEach(item => {
          const entry = {};
          for (const [key, config] of Object.entries(selectors)) {
            if (key === 'container' || key === 'item') continue;
            if (!config) continue;
            const el = item.querySelector(config.selector);
            if (el) {
              entry[key] = config.attribute === 'text'
                ? el.textContent?.trim()
                : el.getAttribute(config.attribute || 'textContent')?.trim();
            }
          }
          if (Object.keys(entry).length > 0) results.push(entry);
        });

        return JSON.stringify(results);
      })();
    `;
  }
}
