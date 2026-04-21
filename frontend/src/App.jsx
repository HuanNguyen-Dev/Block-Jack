import sunImg from '/frontend/src/assets/sun.png'
import moonImg from '/frontend/src/assets/moon.png'
import heroImg from '/frontend/src/assets/main.png'
import { useEffect, useState } from 'react'
import './App.css'
import Home from './pages/Home'
import BlackjackTable from './pages/BlackjackTable'
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="blackjack" element={<BlackjackTable />} />
    </Routes>
  )
}

export default App
