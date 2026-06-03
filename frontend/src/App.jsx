import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TransactionProvider>
          <AppRoutes />
        </TransactionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
