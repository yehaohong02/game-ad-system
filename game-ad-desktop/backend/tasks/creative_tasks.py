from tasks.celery_app import app


@app.task
def rank_creatives():
    from src.creative.analyzer.performance_fetcher import fetch_creative_performance
    from src.creative.analyzer.element_ranker import rank_elements

    rankings = fetch_creative_performance(7)
    elements = rank_elements(7)
    return {"rankings": len(rankings), "elements": len(elements)}
