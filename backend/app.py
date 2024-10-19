from flask import Flask, jsonify, request
from flask_cors import CORS
import networkx as nx
import random

app = Flask(__name__)
CORS(app)  # Allows cross-origin requests

# Create a complex graph (G)
# G = nx.Graph()
# G.add_edges_from([('A', 'B'), ('B', 'C'), ('C', 'D')])  # Example edges

# Generate a larger random Erdős–Rényi graph
G = nx.erdos_renyi_graph(1000, 0.01)  # 1000 nodes, 1% probability of an edge between each pair

# # Generate a scale-free Barabási–Albert graph
# G = nx.barabasi_albert_graph(1000, 5)  # 1000 nodes, each new node connects to 5 existing nodes

# # Generate a Watts-Strogatz small-world graph
# G = nx.watts_strogatz_graph(1000, 6, 0.1)  # 1000 nodes, each connected to 6 neighbors, rewiring probability of 10%

# # Generate a power-law tree graph
# G = nx.random_powerlaw_tree(1000, tries=100)  # 1000 nodes, more iterations for accuracy

# Biclique (S) will be generated dynamically based on user input
S = None

# Store the current homomorphism
current_homomorphism = {}

# Route to get the complex graph (G)
@app.route('/get_graph', methods=['GET'])
def get_graph():
    nodes = list(G.nodes)
    edges = list(G.edges)
    return jsonify({'nodes': nodes, 'edges': edges})

# Route to generate the biclique (S) based on user input
@app.route('/generate_biclique', methods=['POST'])
def generate_biclique():
    data = request.json
    set1_size = data.get('set1_size')
    set2_size = data.get('set2_size')

    global S
    S = nx.complete_bipartite_graph(set1_size, set2_size)  # Generate a biclique

    # Generate the initial homomorphism: map the biclique to a single edge in G
    edge_in_G = random.choice(list(G.edges))  # Pick a random edge from G
    set1 = [node for node in S.nodes if S.nodes[node].get('bipartite') == 0]
    set2 = [node for node in S.nodes if S.nodes[node].get('bipartite') == 1]

    global current_homomorphism
    if set1 and set2:
        # Map one node from each set in S to the endpoints of the random edge in G
        current_homomorphism = {
            set1[0]: edge_in_G[0],
            set2[0]: edge_in_G[1]
        }

    return jsonify({'homomorphism': current_homomorphism})

# Route to get the current homomorphism
@app.route('/get_homomorphism', methods=['GET'])
def get_homomorphism():
    return jsonify(current_homomorphism)

# Route to update the homomorphism
@app.route('/update_homomorphism', methods=['POST'])
def update_homomorphism():
    global current_homomorphism

    if S is None:
        return jsonify({'error': 'Biclique not generated yet'}), 400

    # Randomly pick a vertex from S and G
    random_vertex_in_S = random.choice(list(S.nodes))
    random_vertex_in_G = random.choice(list(G.nodes))

    # Tentatively map this vertex from S to G
    new_mapping = current_homomorphism.copy()
    new_mapping[random_vertex_in_S] = random_vertex_in_G

    # Check if the new mapping is valid
    if is_valid_homomorphism(S, G, new_mapping):
        current_homomorphism = new_mapping  # Update the homomorphism
        return jsonify({'homomorphism': current_homomorphism}), 200
    else:
        # If the new mapping is invalid, return the current valid homomorphism
        return jsonify({'homomorphism': current_homomorphism}), 200

# Helper function to check if the homomorphism is valid
def is_valid_homomorphism(S, G, mapping):
    # Ensure adjacency-preserving homomorphism: if (u, v) is an edge in S,
    # then (mapping[u], mapping[v]) should be an edge in G.
    for u, v in S.edges():
        if mapping.get(u) and mapping.get(v):
            if not G.has_edge(mapping[u], mapping[v]):
                return False
    return True

if __name__ == '__main__':
    app.run(debug=True)
