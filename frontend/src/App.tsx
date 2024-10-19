import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

interface Graph {
  nodes: { id: string }[];
  links: { source: string, target: string }[];
}

const App: React.FC = () => {
  const [graphG, setGraphG] = useState<Graph>({ nodes: [], links: [] }); // Large complex graph G
  const [graphS, setGraphS] = useState<Graph>({ nodes: [], links: [] }); // Smaller biclique S
  const [homomorphism, setHomomorphism] = useState<{ [key: string]: string }>({});
  const [bicliqueSize, setBicliqueSize] = useState(3); // Only one input for both sets of the biclique

  // Fetch the large complex graph G
  useEffect(() => {
    axios.get('http://localhost:5000/get_graph')
      .then(response => {
        const { nodes, edges } = response.data;
        const formattedGraph = {
          nodes: nodes.map((node: string) => ({ id: node })),
          links: edges.map(([source, target]: [string, string]) => ({ source, target }))
        };
        setGraphG(formattedGraph);
      })
      .catch(error => console.error('Error fetching graph G:', error));
  }, []);

  // Function to generate the biclique S based on user input
  const generateBiclique = () => {
    axios.post('http://localhost:5000/generate_biclique', {
      set1_size: bicliqueSize, // Set1 and Set2 are equal
      set2_size: bicliqueSize, // Automatically set Set2 to be equal to Set1
    }).then(response => {
      // Update homomorphism and biclique S
      setHomomorphism(response.data.homomorphism);

      // Simulate biclique graph S based on input sizes
      const nodesS = Array.from({ length: bicliqueSize }, (_, i) => ({ id: `S${i}` }))
        .concat(Array.from({ length: bicliqueSize }, (_, i) => ({ id: `G${i}` })));

      const linksS = [];
      for (let i = 0; i < bicliqueSize; i++) {
        for (let j = 0; j < bicliqueSize; j++) {
          linksS.push({ source: `S${i}`, target: `G${j}` });
        }
      }

      setGraphS({ nodes: nodesS, links: linksS });
    });
  };

  // Function to update the homomorphism using the Markov Chain logic
  const updateHomomorphism = () => {
    axios.post('http://localhost:5000/update_homomorphism')
      .then(response => {
        setHomomorphism(response.data.homomorphism);
      })
      .catch(error => console.error('Error updating homomorphism:', error));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
      {/* Left side for the large graph G */}
      <div style={{ flex: 1, border: '1px solid #ccc', marginRight: '10px' }}>
        <h2 style={{ textAlign: 'center' }}>Graph G (Complex Graph)</h2>
        <ForceGraph2D
          graphData={graphG}
          nodeLabel="id"
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          width={window.innerWidth / 2 - 20}  // Split screen into two halves
          height={window.innerHeight - 150}   // Height adjustment
        />
      </div>

      {/* Right side for the smaller biclique S */}
      <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
        <h2 style={{ textAlign: 'center' }}>Biclique S (Smaller Graph)</h2>
        <ForceGraph2D
          graphData={graphS}
          nodeLabel="id"
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          width={window.innerWidth / 2 - 20}  // Split screen into two halves
          height={window.innerHeight - 300}   // Height adjustment
        />

        {/* Controls for setting biclique size */}
        <div style={{ marginTop: '20px' }}>
          <label>
            Biclique size:
            <input 
              type="number" 
              value={bicliqueSize} 
              onChange={(e) => setBicliqueSize(Number(e.target.value))} 
            />
          </label>
          <button onClick={generateBiclique} style={{ marginLeft: '10px' }}>
            Generate Biclique
          </button>
        </div>

        {/* Display current homomorphism */}
        <h3>Current Homomorphism:</h3>
        <ul>
          {Object.entries(homomorphism).map(([S_vertex, G_vertex]) => (
            <li key={S_vertex}>{S_vertex} &rarr; {G_vertex}</li>
          ))}
        </ul>

        <button onClick={updateHomomorphism} style={{ marginTop: '10px' }}>
          Update Homomorphism
        </button>
      </div>
    </div>
  );
};

export default App;
