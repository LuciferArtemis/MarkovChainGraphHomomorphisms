import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

interface Graph {
  nodes: { id: string, x?: number, y?: number, fx?: number, fy?: number }[];
  links: { source: string, target: string }[];
}

const NeighbourhoodUpdate: React.FC = () => {
  const [graphG, setGraphG] = useState<Graph>({ nodes: [], links: [] });
  const [graphS, setGraphS] = useState<Graph>({ nodes: [], links: [] });
  const [homomorphism, setHomomorphism] = useState<{ [key: string]: string }>({});
  const [markovChain, setMarkovChain] = useState<Array<{ [key: string]: string }>>([]);
  const [bicliqueSize, setBicliqueSize] = useState(3);
  const [selectedS, setSelectedS] = useState<string | null>(null);
  const [selectedG, setSelectedG] = useState<string | null>(null);
  const [homomorphicEdges, setHomomorphicEdges] = useState<Array<[string, string]>>([]);
  const [numIterations, setNumIterations] = useState(100);


  const graphRefG = useRef<any>(null);
  const graphRefS = useRef<any>(null);

  const [graphMetadata, setGraphMetadata] = useState({
    graph_type: "Loading...",
    num_nodes: 0,
    num_edges: 0
});

useEffect(() => {
  axios.get('http://localhost:5000/get_graph')
    .then(response => {
      const { nodes, edges, graph_type, num_nodes, num_edges } = response.data;
      setGraphG({
        nodes: nodes.map((node: string) => ({ id: `G-${node}` })),
        links: edges.map(([source, target]: [string, string]) => ({ source: `G-${source}`, target: `G-${target}` }))
      });

      setGraphMetadata({
        graph_type: graph_type,
        num_nodes: num_nodes,
        num_edges: num_edges
      });

      setTimeout(() => {
        if (graphRefG.current) {
          graphRefG.current.zoomToFit(400, 50);
        }
      }, 100);
    })
    .catch(error => console.error('Error fetching graph G:', error));
}, []);




  const generateBiclique = () => {
    axios.post('http://localhost:5000/generate_biclique', {
      set1_size: bicliqueSize,
      set2_size: bicliqueSize,
    }).then(response => {
      setHomomorphism(response.data.homomorphism);
      setMarkovChain([response.data.homomorphism]);

      const nodesS = Array.from({ length: bicliqueSize }, (_, i) => ({
        id: `S-${i}`,
        x: -150,
        y: i * 100 - ((bicliqueSize - 1) * 50),
        fx: -150,
        fy: i * 100 - ((bicliqueSize - 1) * 50),
      }))
        .concat(Array.from({ length: bicliqueSize }, (_, i) => ({
          id: `S-${bicliqueSize + i}`,
          x: 150,
          y: i * 100 - ((bicliqueSize - 1) * 50),
          fx: 150,
          fy: i * 100 - ((bicliqueSize - 1) * 50),
        })));

      const linksS = [];
      for (let i = 0; i < bicliqueSize; i++) {
        for (let j = 0; j < bicliqueSize; j++) {
          linksS.push({ source: `S-${i}`, target: `S-${bicliqueSize + j}` });
        }
      }

      setGraphS({ nodes: nodesS, links: linksS });

      setTimeout(() => {
        if (graphRefS.current) {
          graphRefS.current.zoomToFit(400, 50);
        }
      }, 100);
    }).catch(error => {
      console.error('Error generating biclique:', error.response ? error.response.data : error.message);
      alert('Error: ' + (error.response ? error.response.data.error : error.message));
    });
  };

  const updateHomomorphismNeighbourhood = () => {
    axios.post('http://localhost:5000/update_homomorphism_neighbourhood')
      .then(response => {
        const { homomorphism, success, message, selected_S, selected_G, homomorphic_edges } = response.data;

        setSelectedS(`S-${selected_S}`);
        setSelectedG(`G-${selected_G}`);
        setHomomorphicEdges(homomorphic_edges || []);

        if (success) {
          setHomomorphism(homomorphism);
          setMarkovChain(prevChain => [...prevChain, homomorphism]);
        } else {
          alert(message || 'Homomorphism update attempt failed.');
        }
      })
      .catch(error => {
        console.error('Error updating homomorphism:', error);
        alert('An error occurred while updating the homomorphism.');
      });
  };

  const updateHomomorphismNeighbourhoodMultiple = async () => {
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < numIterations; i++) {
      try {
        const response = await axios.post('http://localhost:5000/update_homomorphism_neighbourhood');
        const { homomorphism, success, selected_S, selected_G, homomorphic_edges } = response.data;

        setSelectedS(`S-${selected_S}`);
        setSelectedG(`G-${selected_G}`);
        setHomomorphicEdges(homomorphic_edges || []);

        if (success) {
          setHomomorphism(homomorphism);
          setMarkovChain(prevChain => [...prevChain, homomorphism]);
          successCount++;
        } else {
          failureCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error('Error during homomorphism update:', error);
        failureCount++;
      }
    }

    alert(`Out of ${numIterations} iterations:\n- Successful homomorphisms: ${successCount}\n- Failed homomorphisms: ${failureCount}`);
};


  const renderNode = (node: any, ctx: any, globalScale: number) => {
    const size = 10 / globalScale;
    const isSet1 = node.id.startsWith('S-') && parseInt(node.id.split('-')[1]) < bicliqueSize;
    const isSet2 = node.id.startsWith('S-') && parseInt(node.id.split('-')[1]) >= bicliqueSize;
    const isComplexGraph = node.id.startsWith('G-');

    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);

    if (node.id === selectedS && (isSet1 || isSet2)) {
      ctx.fillStyle = 'yellow';
    } else if (node.id === selectedG && isComplexGraph) {
      ctx.fillStyle = 'green';
    } else {
      if (isSet1) {
        ctx.fillStyle = 'red';
      } else if (isSet2) {
        ctx.fillStyle = 'blue';
      } else if (isComplexGraph) {
        ctx.fillStyle = 'gray';
      }
    }

    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
  };

  const renderLink = (link: any, ctx: any, globalScale: number) => {
    const isHomomorphicEdge = homomorphicEdges.some(edge =>
      (edge[0] === link.source.id && edge[1] === link.target.id) ||
      (edge[0] === link.target.id && edge[1] === link.source.id)
    );

    ctx.strokeStyle = isHomomorphicEdge ? 'green' : 'gray';
    ctx.lineWidth = isHomomorphicEdge ? 3 / globalScale : 1 / globalScale;
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
      <div style={{ flex: 2, border: '1px solid #ccc', marginRight: '10px' }}>
        <h2 style={{ textAlign: 'center' }}>Graph G (Complex Graph)</h2>

        <div style={{ padding: '10px', borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
          <h3>Graph Information</h3>
          <p><strong>Type:</strong> {graphMetadata.graph_type}</p>
          <p><strong>Nodes:</strong> {graphMetadata.num_nodes}</p>
          <p><strong>Edges:</strong> {graphMetadata.num_edges}</p>
        </div>

        <ForceGraph2D
          ref={graphRefG}
          graphData={graphG}
          nodeLabel="id"
          linkDirectionalArrowLength={0}
          linkDirectionalArrowRelPos={0}
          width={window.innerWidth / 2 - 20}
          height={window.innerHeight - 150}
          nodeCanvasObject={renderNode}
          linkCanvasObject={renderLink}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
          <h2 style={{ textAlign: 'center' }}>Biclique S (Smaller Graph)</h2>
          <ForceGraph2D
            ref={graphRefS}
            graphData={graphS}
            nodeLabel="id"
            linkDirectionalArrowLength={0}
            linkDirectionalArrowRelPos={0}
            width={window.innerWidth / 4 - 20}
            height={window.innerHeight / 2 - 150}
            nodeCanvasObject={renderNode}
            linkCanvasObject={renderLink}
          />

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
        </div>

        <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
          <h3>Current Homomorphism (Using Neighbourhood Algo):</h3>
          <ul>
            {Object.entries(homomorphism).map(([S_vertex, G_vertex]) => (
              <li key={S_vertex}>
                <strong>Vertex from S:</strong> {S_vertex} &rarr; <strong>Mapped to G:</strong> {G_vertex}
              </li>
            ))}
          </ul>

          <div style={{ marginTop: '10px' }}>
            <button onClick={updateHomomorphismNeighbourhood} style={{ marginRight: '10px' }}>
              Update Homomorphism (Single Step)
            </button>
           <div style={{ marginTop: '10px' }}>
              <label>
                  Number of iterations:
                  <input
                      type="number"
                      value={numIterations}
                      onChange={(e) => setNumIterations(Number(e.target.value))}
                      style={{ marginLeft: '10px', width: '60px' }}
                      min="1"
                  />
              </label>
              <button onClick={updateHomomorphismNeighbourhoodMultiple} style={{ marginLeft: '10px' }}>
                  Update Homomorphism 
              </button>
          </div>

          </div>

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
    </div>
  );
};

export default NeighbourhoodUpdate;
