from flask import Flask, jsonify, request
from flask_cors import CORS
import networkx as nx
import random

app = Flask(__name__)
CORS(app)  # Allows cross-origin requests

# Create the large complex graph G
# Generate a random graph with 100 nodes and a 0.05 probability of edge creation
# G = nx.erdos_renyi_graph(n=100, p=0.05)
# # Generate a Barabási-Albert graph with 100 nodes, where each new node is attached to 3 existing nodes
# G = nx.barabasi_albert_graph(n=100, m=3)
# # Generate a Watts-Strogatz small-world graph with 100 nodes, each connected to 4 neighbors, and a 0.3 probability of rewiring
# G = nx.watts_strogatz_graph(n=100, k=4, p=0.3)
# Generate a power-law cluster graph with 100 nodes, where each new node attaches to 3 existing nodes and clustering probability of 0.5
G = nx.powerlaw_cluster_graph(n=100, m=3, p=0.5)


# Store the current homomorphism and the biclique S
current_homomorphism = {}
S = None

# Function to check if a given homomorphism is valid
def is_valid_homomorphism(S, G, mapping):
    """
    Check if the given mapping is a valid graph homomorphism
    from S to G.
    
    S: The biclique (smaller graph)
    G: The large complex graph
    mapping: A dictionary representing the homomorphism from S to G
             
    Returns True if the mapping is valid, False otherwise.
    """
    for u, v in S.edges():  # For every edge (u, v) in S
        mapped_u = mapping.get(u)
        mapped_v = mapping.get(v)
        
        # Check if the mapped vertices in G (mapped_u, mapped_v) form an edge
        if mapped_u is None or mapped_v is None:
            return False  # Mapping is incomplete
        
        if not G.has_edge(mapped_u, mapped_v):
            return False  # Mapping does not preserve adjacency (edge is missing in G)
    
    return True  # All edges are preserved


@app.route('/generate_biclique', methods=['POST'])
def generate_biclique():
    global current_homomorphism, S
    set1_size = request.json.get('set1_size')
    set2_size = request.json.get('set2_size')

    # Create biclique S (Set1 and Set2)
    S = nx.complete_bipartite_graph(set1_size, set2_size)

    # Select a single edge from G for the initial mapping
    edge_in_G = list(G.edges())[0]  # Select the first edge in G (e.g., G1, G2)
    G1, G2 = edge_in_G

    # Initialize the homomorphism to map all vertices in S to this single edge in G
    current_homomorphism = {}

    # Map all vertices in Set1 of S to G1 and all vertices in Set2 of S to G2
    for i in range(set1_size):
        current_homomorphism[f'S{i}'] = G1  # Map Set1 vertices to G1
    for j in range(set2_size):
        current_homomorphism[f'G{j}'] = G2  # Map Set2 vertices to G2

    return jsonify({
        'homomorphism': current_homomorphism,
        'success': True
    }), 200


@app.route('/get_graph', methods=['GET'])
def get_graph():
    """
    Return the nodes and edges of the large complex graph G.
    """
    nodes = list(G.nodes)
    edges = list(G.edges)
    return jsonify({'nodes': nodes, 'edges': edges})


@app.route('/get_homomorphism', methods=['GET'])
def get_homomorphism():
    """
    Return the current state of the homomorphism.
    """
    return jsonify(current_homomorphism)


@app.route('/update_homomorphism', methods=['POST'])
def update_homomorphism():
    """
    Attempt to update the homomorphism by randomly selecting a vertex from S and G,
    and creating a new mapping. If valid, the new state is added to the Markov Chain.
    """
    global current_homomorphism

    if S is None:
        return jsonify({'error': 'Biclique not generated yet'}), 400

    # Randomly pick a vertex from S and G
    random_vertex_in_S = random.choice(list(S.nodes))
    random_vertex_in_G = random.choice(list(G.nodes))

    # Tentatively map this vertex from S to G
    new_mapping = current_homomorphism.copy()  # Create a copy of the current state (homomorphism)
    new_mapping[random_vertex_in_S] = random_vertex_in_G

    # Check if the new mapping is valid (adjacency-preserving)
    if is_valid_homomorphism(S, G, new_mapping):
        # The new mapping is valid, so this becomes the next state in the Markov Chain
        current_homomorphism = new_mapping  # Update the homomorphism with the new valid state
        return jsonify({
            'homomorphism': current_homomorphism,
            'success': True,
            'selected_S': random_vertex_in_S,
            'selected_G': random_vertex_in_G
        }), 200
    else:
        # The new mapping is invalid, return the failure status and selected vertices
        return jsonify({
            'homomorphism': current_homomorphism,
            'success': False,
            'message': 'Homomorphism attempt failed',
            'selected_S': random_vertex_in_S,
            'selected_G': random_vertex_in_G
        }), 200


if __name__ == '__main__':
    app.run(debug=True)
