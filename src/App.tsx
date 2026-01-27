import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import { HomeScreen } from './screens/Home/HomeScreen';
import { GameScreen } from './screens/Game/GameScreen';
import { ResultScreen } from './screens/Result/ResultScreen';

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/result" element={<ResultScreen />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
