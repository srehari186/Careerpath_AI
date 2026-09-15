import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { Nav } from './components/ui';
import Home from './pages/Home';
import Assessment from './pages/Assessment';
import Recommendations from './pages/Recommendations';
import Pathway from './pages/Pathway';
import CareerDetail from './pages/CareerDetail';
import Assistant from './pages/Assistant';
import AskAiWidget from './components/AskAiWidget';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <div className="min-h-screen bg-[#f6f7fb]">
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/pathway" element={<Pathway />} />
        <Route path="/career/:name" element={<CareerDetail />} />
        <Route path="/assistant" element={<Assistant />} />
      </Routes>
      <AskAiWidget />
    </div>
  </BrowserRouter>
);
