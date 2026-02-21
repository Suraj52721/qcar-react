import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Team from './pages/Team';
import Research from './pages/Research';
import Contact from './pages/Contact';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import { GlobalNotificationProvider } from './components/GlobalNotificationProvider';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <GlobalNotificationProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="team" element={<Team />} />
              <Route path="research" element={<Research />} />
              <Route path="contact" element={<Contact />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
          </Routes>
        </GlobalNotificationProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;

