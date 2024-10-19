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
  const [markovChain, setMarkovChain] = useState<Array<{ [key: string]: string }>>([]); // Store the Markov Chain
  const [bicliqueSize, setBicliqueSize] = useState(3); // Only one input for both sets of the biclique
  const [selectedS, setSelectedS] = useState<string | null>(null); // Selected vertex from S
  const [selectedG, setSelectedG] = useState<string | null>(null); // Selected vertex from G

  // Fetch the large complex graph G
  useEffect(() => {
    axios.get('http://localhost:5000/get_graph')
      .then(response => {
        const { nodes, edges } = response.data;
        const formattedGraph = {
          nodes: nodes.map((node: string) => ({ id: `G-${node}` })), // Prefix with G-
          links: edges.map(([source, target]: [string, string]) => ({ source: `G-${source}`, target: `G-${target}` }))
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
      setMarkovChain([response.data.homomorphism]); // Initialize the Markov Chain with the first homomorphism

      // Simulate biclique graph S based on input sizes, prefixing IDs
      const nodesS = Array.from({ length: bicliqueSize }, (_, i) => ({ id: `S-${i}` }))
        .concat(Array.from({ length: bicliqueSize }, (_, i) => ({ id: `S-G${i}` })));

      const linksS = [];
      for (let i = 0; i < bicliqueSize; i++) {
        for (let j = 0; j < bicliqueSize; j++) {
          linksS.push({ source: `S-${i}`, target: `S-G${j}` });
        }
      }

      setGraphS({ nodes: nodesS, links: linksS });
    });
  };

  // Function to update the homomorphism using the Markov Chain logic
  const updateHomomorphism = () => {
    axios.post('http://localhost:5000/update_homomorphism')
      .then(response => {
        const { homomorphism, success, message, selected_S, selected_G } = response.data;

        // Update the selected vertices for highlighting
        setSelectedS(`S-${selected_S}`);
        setSelectedG(`G-${selected_G}`);

        if (success) {
          // Add the new state to the Markov Chain
          setHomomorphism(homomorphism);
          setMarkovChain(prevChain => [...prevChain, homomorphism]);
        } else {
          // Show a popup with the failure message
          alert(message || 'Homomorphism update attempt failed.');
        }
      })
      .catch(error => console.error('Error updating homomorphism:', error));
  };

  // Function to run 100 iterations of homomorphism updates
  const updateHomomorphismMultiple = async () => {
    for (let i = 0; i < 100; i++) {
      try {
        const response = await axios.post('http://localhost:5000/update_homomorphism');
        const { homomorphism, success, message, selected_S, selected_G } = response.data;

        // Update the selected vertices for highlighting
        setSelectedS(`S-${selected_S}`);
        setSelectedG(`G-${selected_G}`);

        if (success) {
          // Add the new state to the Markov Chain
          setHomomorphism(homomorphism);
          setMarkovChain(prevChain => [...prevChain, homomorphism]);
        } else {
          console.log(message || 'Homomorphism update attempt failed.');
        }
      } catch (error) {
        console.error('Error updating homomorphism:', error);
      }
    }
  };

  // Function to render nodes with custom styles for highlighting
  const renderNode = (node: any, ctx: any, globalScale: number) => {
    const size = 10 / globalScale; // Adjust size based on zoom level
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);

    // Highlight the selected nodes in different colors
    if (node.id === selectedS) {
      ctx.fillStyle = 'red';  // Color for selected vertex in S
    } else if (node.id === selectedG) {
      ctx.fillStyle = 'blue'; // Color for selected vertex in G
    } else {
      ctx.fillStyle = 'gray'; // Default color for unselected nodes
    }
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
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
          nodeCanvasObject={renderNode}       // Render nodes with custom styles
        />
      </div>

      {/* Right side for the smaller biclique S and Markov Chain */}
      <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
        <h2 style={{ textAlign: 'center' }}>Biclique S (Smaller Graph)</h2>
        <ForceGraph2D
          graphData={graphS}
          nodeLabel="id"
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          width={window.innerWidth / 2 - 20}  // Split screen into two halves
          height={window.innerHeight - 300}   // Height adjustment
          nodeCanvasObject={renderNode}       // Render nodes with custom styles
        />

        {/* Controls for setting biclique size */}
        <div style={{ marginTop: '10px' }}>
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

        {/* Buttons for updating homomorphism */}
        <div style={{ marginTop: '10px' }}>
          <button onClick={updateHomomorphism} style={{ marginRight: '10px' }}>
            Update Homomorphism
          </button>
          <button onClick={updateHomomorphismMultiple}>
            Run 100 Iterations
          </button>
        </div>

        {/* Display the entire Markov Chain */}
        <h3 style={{ marginTop: '10px' }}>Markov Chain (States):</h3>
        <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '5px', border: '1px solid #ddd' }}>
          <ol style={{ fontSize: '12px' }}>
            {markovChain.map((state, index) => (
              <li key={index}>
                State {index + 1}:
                <ul>
                  {Object.entries(state).map(([S_vertex, G_vertex]) => (
                    <li key={S_vertex}>{S_vertex} &rarr; {G_vertex}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default App;
