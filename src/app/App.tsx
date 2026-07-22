import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DemoPreviewPage } from '../features/demo-preview/DemoPreviewPage';
import { WalletProviders } from '../lib/WalletProviders';
import { DemoStateProvider } from './DemoStateProvider';
import { AppRouter } from './router';

function CanonicalApp() {
  return (
    <WalletProviders>
      <DemoStateProvider>
        <AppRouter />
      </DemoStateProvider>
    </WalletProviders>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/demo-preview" element={<DemoPreviewPage />} />
        <Route path="*" element={<CanonicalApp />} />
      </Routes>
    </BrowserRouter>
  );
}
