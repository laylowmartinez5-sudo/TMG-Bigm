import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Releases from './pages/Releases';
import ReleaseDetail from './pages/ReleaseDetail';
import Analytics from './pages/Analytics';
import Royalties from './pages/Royalties';
import Bitcoin from './pages/Bitcoin';
import Player from './pages/Player';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/releases" element={<Releases />} />
        <Route path="/releases/:id" element={<ReleaseDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/royalties" element={<Royalties />} />
        <Route path="/bitcoin" element={<Bitcoin />} />
        <Route path="/player" element={<Player />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
