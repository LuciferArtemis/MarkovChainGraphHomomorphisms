import React, { useState } from "react";
import RegularUpdate from "./RegularUpdate";
import SmartUpdate from "./SmartUpdate";

const App: React.FC = () => {
  const [mode, setMode] = useState<"regular" | "smart">("regular");

  return (
    <div>
      <h1>Graph Homomorphism Simulation</h1>
      <div>
        <button onClick={() => setMode("regular")}>Regular Update</button>
        <button onClick={() => setMode("smart")}>Smart Update</button>
      </div>
      {mode === "regular" ? <RegularUpdate /> : <SmartUpdate />}
    </div>
  );
};

export default App;
