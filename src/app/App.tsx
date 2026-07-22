import { BrowserRouter } from 'react-router-dom';
import { DemoStateProvider } from './DemoStateProvider';
import { AppRouter } from './router';
import { WalletProviders } from '../lib/WalletProviders';

export function App() {
  return (
    <BrowserRouter>
      <WalletProviders>
        <DemoStateProvider>
          <AppRouter />
        </DemoStateProvider>
      </WalletProviders>
    </BrowserRouter>
  );
}
