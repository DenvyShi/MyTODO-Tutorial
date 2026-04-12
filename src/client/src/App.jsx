import { useState } from 'react';
import { useAuth } from './hooks';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const { user, loading, login, logout, error } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login 
        onLogin={async (username, password) => {
          setLoggingIn(true);
          const success = await login(username, password);
          setLoggingIn(false);
          return success;
        }}
        loading={loggingIn}
        error={error}
      />
    );
  }

  return <Dashboard user={user} onLogout={logout} />;
}

export default App;
