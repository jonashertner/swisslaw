import { createRoot } from 'react-dom/client';
import SiteApp from './components/site/site-app';
import './base.css';

createRoot(document.getElementById('root')!).render(<SiteApp />);
