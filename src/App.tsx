import { Game } from './game/Game';
import { WebGLErrorBoundary } from './game/WebGLCheck';

function App() {
  return (
    <WebGLErrorBoundary>
      <Game />
    </WebGLErrorBoundary>
  );
}

export default App;
