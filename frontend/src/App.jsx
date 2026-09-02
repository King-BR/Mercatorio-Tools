import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./Pages/Home/Home";
import ProductionPlanner from "./Pages/ProductionPlanner/ProductionPlanner";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/production-planner" element={<ProductionPlanner />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
