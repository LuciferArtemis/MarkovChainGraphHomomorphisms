import pytest
from backend.app import app as flask_app
@pytest.fixture
def app():
    return flask_app

@pytest.fixture
def client(app):
    return app.test_client()

def test_generate_biclique(client):
    response = client.post('/generate_biclique', json={
        'set1_size': 3,
        'set2_size': 3
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'homomorphism' in data
    assert isinstance(data['homomorphism'], dict)
    assert len(data['homomorphism']) == 6

def test_get_graph(client):
    response = client.get('/get_graph')
    assert response.status_code == 200
    data = response.get_json()
    assert 'nodes' in data
    assert 'edges' in data
    assert isinstance(data['nodes'], list)
    assert isinstance(data['edges'], list)

def test_update_homomorphism(client):
    client.post('/generate_biclique', json={
        'set1_size': 2,
        'set2_size': 2
    })

    response = client.post('/update_homomorphism')
    assert response.status_code in (200, 400)
    data = response.get_json()
    assert 'homomorphism' in data
    assert 'selected_S' in data

def test_update_neighbourhood(client):
    client.post('/generate_biclique', json={
        'set1_size': 2,
        'set2_size': 2
    })

    response = client.post('/update_homomorphism_neighbourhood')
    assert response.status_code in (200, 400)
    data = response.get_json()
    assert 'homomorphism' in data
    assert 'selected_S' in data
