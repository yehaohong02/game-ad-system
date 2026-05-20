import { BaseInjector, CrawlResult } from './base.injector';

export class GuangdadaInjector extends BaseInjector {
  platform = 'guangdada';

  inject(): string {
    return `
      (function() {
        const items = document.querySelectorAll('.creative-item, .ad-item');
        const results = [];
        items.forEach(item => {
          results.push({
            title: item.querySelector('.title')?.textContent?.trim() || '',
            advertiser: item.querySelector('.advertiser')?.textContent?.trim() || '',
            platform: item.querySelector('.platform')?.textContent?.trim() || '',
            impressions: item.querySelector('.impressions')?.textContent?.trim() || '',
            creativeType: item.querySelector('.type')?.textContent?.trim() || '',
            thumbnail: item.querySelector('img')?.src || '',
          });
        });
        return JSON.stringify(results);
      })();
    `;
  }
}
