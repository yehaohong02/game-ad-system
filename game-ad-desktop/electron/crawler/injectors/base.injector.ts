export interface CrawlResult {
  platform: string;
  type: 'hot_creative' | 'weekly_ranking' | 'monthly_ranking';
  data: any[];
  crawledAt: string;
}

export abstract class BaseInjector {
  abstract platform: string;
  abstract inject(): string; // 返回要注入的 JS 脚本

  protected buildResult(type: CrawlResult['type'], data: any[]): CrawlResult {
    return {
      platform: this.platform,
      type,
      data,
      crawledAt: new Date().toISOString(),
    };
  }
}
