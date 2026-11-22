// TEMPORARY visual-check harness (deleted after verification).
import { createRoot } from 'react-dom/client';
import './styles.css';
import OpsCenter from './components/OpsCenter.jsx';
createRoot(document.getElementById('root')).render(<OpsCenter onAsk={() => {}} />);
