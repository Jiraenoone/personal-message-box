import { AuthProvider } from './context/AuthContext';
import AppRouter from './Router';
import './assets/styles/global.css';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
