import React, { useState } from "react";
import RegularUpdate from "./RegularUpdate";
import SmartUpdate from "./NeighbourhoodUpdate";
import NeighbourhoodUpdate from "./NeighbourhoodUpdate";

const App: React.FC = () => {
  const [mode, setMode] = useState<"regular" | "neighbourhood">("regular");

  return (
    <div>
      <h1>Graph Homomorphism Simulation</h1>
      <div>
        <button onClick={() => setMode("regular")}>Regular Update</button>
        <button onClick={() => setMode("neighbourhood")}>Neighbourhood Update</button>
      </div>
      {mode === "regular" ? <RegularUpdate /> : <NeighbourhoodUpdate />}
    </div>
  );
};

export default App;
