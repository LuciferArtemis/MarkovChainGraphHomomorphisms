from flask import Flask, jsonify, request
from flask_cors import CORS
import networkx as nx
import random

app = Flask(__name__)
CORS(app) 

# G = nx.erdos_renyi_graph(n=1000, p=0.05)

# G = nx.barabasi_albert_graph(n=10, m=9)

G = nx.complete_graph(50)

# G = nx.watts_strogatz_graph(n=1000, k=4, p=0.3)

# G = nx.powerlaw_cluster_graph(n=1000, m=3, p=0.5)

current_homomorphism = {}
S = None

def is_valid_homomorphism(S, G, mapping):
    for u, v in S.edges():
        mapped_u = mapping.get(u)
        mapped_v = mapping.get(v)

        if mapped_u is None or mapped_v is None:
            return False

        if not G.has_edge(mapped_u, mapped_v):
            return False

    return True

@app.route('/generate_biclique', methods=['POST'])
def generate_biclique():
    global S, current_homomorphism

    set1_size = request.json['set1_size']
    set2_size = request.json['set2_size']

    S = nx.complete_bipartite_graph(set1_size, set2_size)

    if len(G.nodes) == 0:
        return jsonify({'error': 'Graph G is empty'}), 400

    G_vertex1 = list(G.nodes)[0]

    connected_vertices = [v for u, v in G.edges(G_vertex1)]
    if connected_vertices:
        G_vertex2 = connected_vertices[0]

        current_homomorphism = {}
        set1_nodes = list(S.nodes)[:set1_size]
        set2_nodes = list(S.nodes)[set1_size:]

        for node in set1_nodes:
            current_homomorphism[node] = G_vertex1

        for node in set2_nodes:
            current_homomorphism[node] = G_vertex2

        return jsonify({
            'homomorphism': current_homomorphism
        }), 200
    else:
        return jsonify({
            'error': f'No connected vertices found for vertex {G_vertex1} in graph G'
        }), 400

@app.route('/get_graph', methods=['GET'])
def get_graph():

    nodes = list(G.nodes)
    edges = list(G.edges)
    return jsonify({'nodes': nodes, 'edges': edges})


@app.route('/get_homomorphism', methods=['GET'])
def get_homomorphism():

    return jsonify(current_homomorphism)

@app.route('/update_homomorphism', methods=['POST'])
def update_homomorphism():
    global current_homomorphism

    if S is None:
        return jsonify({'error': 'Biclique not generated yet'}), 400

    set1_nodes = list(S.nodes)[:len(S.nodes) // 2]
    set2_nodes = list(S.nodes)[len(S.nodes) // 2:]

    random_vertex_in_S = random.choice(set1_nodes + set2_nodes)
    print(f"Selected vertex from S: {random_vertex_in_S}")

    candidates_in_G = [v for v in G.nodes if v != current_homomorphism.get(random_vertex_in_S)]
    
    if not candidates_in_G:
        print(f"No valid candidates in G to map {random_vertex_in_S}. Current homomorphism: {current_homomorphism}")
        return jsonify({
            'homomorphism': current_homomorphism,
            'success': False,
            'message': 'No valid candidate vertices in G to map to.',
            'selected_S': random_vertex_in_S,
        }), 400

    random_vertex_in_G = random.choice(candidates_in_G)
    print(f"Selected new vertex from G: {random_vertex_in_G}")

    new_mapping = current_homomorphism.copy()
    new_mapping[random_vertex_in_S] = random_vertex_in_G

    print(f"Attempting new mapping for S: {random_vertex_in_S} -> G: {random_vertex_in_G}")
    print(f"New proposed homomorphism: {new_mapping}")

    if is_valid_homomorphism(S, G, new_mapping):
        current_homomorphism = new_mapping
        print(f"Updated homomorphism: {current_homomorphism}")

        homomorphic_edges = []
        for u, v in S.edges():
            if G.has_edge(new_mapping[u], new_mapping[v]):
                homomorphic_edges.append((new_mapping[u], new_mapping[v]))

        return jsonify({
            'homomorphism': current_homomorphism,
            'success': True,
            'selected_S': random_vertex_in_S,
            'selected_G': random_vertex_in_G,
            'homomorphic_edges': homomorphic_edges
        }), 200
    else:
        print(f"Homomorphism attempt failed for S: {random_vertex_in_S}, G: {random_vertex_in_G}. Possible issue with edge preservation.")
        return jsonify({
            'homomorphism': current_homomorphism,
            'success': False,
            'message': 'Homomorphism attempt failed',
            'selected_S': random_vertex_in_S,
            'selected_G': random_vertex_in_G
        }), 200
    
@app.route('/update_homomorphism_neighbourhood', methods=['POST'])
def update_homomorphism_neighbourhood():
    global current_homomorphism

    if S is None:
        return jsonify({'error': 'Biclique not generated yet'}), 400

    set1_nodes = list(S.nodes)[:len(S.nodes) // 2]
    set2_nodes = list(S.nodes)[len(S.nodes) // 2:]

    random_vertex_in_S = random.choice(set1_nodes + set2_nodes)

    mapped_vertices = set(current_homomorphism.values())
    neighbor_candidates = set()
    for v in mapped_vertices:
        neighbor_candidates.update(G.neighbors(v))

    neighbor_candidates.discard(current_homomorphism[random_vertex_in_S])

    if not neighbor_candidates:
        return jsonify({
            'homomorphism': current_homomorphism,
            'success': False,
            'message': 'No valid neighboring vertices to map to.',
            'selected_S': random_vertex_in_S,
        }), 400

    random_vertex_in_G = random.choice(list(neighbor_candidates))

    new_mapping = current_homomorphism.copy()
    new_mapping[random_vertex_in_S] = random_vertex_in_G

    if is_valid_homomorphism(S, G, new_mapping):
        current_homomorphism = new_mapping
        return jsonify({
            'homomorphism': current_homomorphism,
            'success': True,
            'selected_S': random_vertex_in_S,
            'selected_G': random_vertex_in_G
        }), 200
    else:
        return jsonify({
            'homomorphism': current_homomorphism,
            'success': False,
            'message': 'Homomorphism attempt failed',
            'selected_S': random_vertex_in_S,
            'selected_G': random_vertex_in_G
        }), 200


if __name__ == '__main__':
    app.run(debug=True)
