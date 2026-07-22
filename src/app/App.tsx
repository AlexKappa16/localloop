import { BrowserRouter } from 'react-router-dom';
import { DemoStateProvider } from './DemoStateProvider';
import { AppRouter } from './router';

export function App() {
  return (
    <BrowserRouter>
      <DemoStateProvider>
        <AppRouter />
      </DemoStateProvider>
    </BrowserRouter>
  );
}
