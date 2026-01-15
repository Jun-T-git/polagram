import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import PreviewPage from './pages/PreviewPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="*" element={<PreviewPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
