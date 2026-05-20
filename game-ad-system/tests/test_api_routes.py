from fastapi.testclient import TestClient


def test_data_router_registered():
    from api.main import app
    client = TestClient(app)
    response = client.get("/data/health")
    assert response.status_code == 200


def test_creative_router_registered():
    from api.main import app
    client = TestClient(app)
    response = client.get("/creative/health")
    assert response.status_code == 200


def test_execution_router_registered():
    from api.main import app
    client = TestClient(app)
    response = client.get("/execution/health")
    assert response.status_code == 200


def test_memory_router_registered():
    from api.main import app
    client = TestClient(app)
    response = client.get("/memory/health")
    assert response.status_code == 200
