import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DemoPreviewPage } from '../features/demo-preview/DemoPreviewPage';
import { DemoStateProvider } from './DemoStateProvider';
import { AppRouter } from './router';

function CanonicalApp() {
  return (
    <DemoStateProvider>
      <AppRouter />
    </DemoStateProvider>
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
