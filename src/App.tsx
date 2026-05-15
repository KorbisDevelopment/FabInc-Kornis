/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { OperationalRole } from './types';
import Auth from './components/Auth';
import Cockpit from './components/Cockpit';
import Dashboard from './components/Dashboard';
import AdviceBoard from './components/AdviceBoard';
import PhoneBroadcaster from './components/PhoneBroadcaster';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/cockpit" element={<Cockpit />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/board" element={<AdviceBoard />} />
        <Route path="/camera/:streamId" element={<PhoneBroadcaster />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
