import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Dashboard from './pages/Dashboard';
import Ministry from './pages/Ministry';
import Budget from './pages/Budget';
import Report from './pages/Report';
import DataImport from './pages/DataImport';
import StressTest from './pages/StressTest';
import './App.css';

function App() {
  return (
    <GameProvider>
      <Router basename="/La-Fronce">
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ministry/:id" element={<Ministry />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/report" element={<Report />} />
            <Route path="/data" element={<DataImport />} />
            <Route path="/stress" element={<StressTest />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;
