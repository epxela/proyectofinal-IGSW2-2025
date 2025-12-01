import { Routes, Route, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getAlertasCount } from './api'

import Dashboard from './components/Dashboard'
import Productos from './components/Productos'
import Categorias from './components/Categorias'
import Proveedores from './components/Proveedores'
import Clientes from './components/Clientes'
import Compras from './components/Compras'
import Ventas from './components/Ventas'
import Devoluciones from './components/Devoluciones'
import Movimientos from './components/Movimientos'
import Alertas from './components/Alertas'
import Reportes from './components/Reportes'
import Login from './components/Login'

function App() {
  const [alertasCount, setAlertasCount] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    loadAlertasCount()
    const interval = setInterval(loadAlertasCount, 30000000) // cada 30 seg
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const loadAlertasCount = async () => {
    try {
      const { data } = await getAlertasCount()
      setAlertasCount(data.pendientes)
    } catch (err) {
      console.error('Error cargando alertas:', err)
    }
  }

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">
          <h2>Inventarios</h2>
          <small>ElectroDistribuciones</small>
        </div>
        
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #eee' }}>
          <button 
            onClick={handleLogout} 
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '13px' }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
        
        <ul className="nav-links">
          <li>
            <NavLink to="/">Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/productos">Productos</NavLink>
          </li>
          <li>
            <NavLink to="/categorias">Categorías</NavLink>
          </li>
          <li>
            <NavLink to="/proveedores">Proveedores</NavLink>
          </li>
          <li>
            <NavLink to="/clientes">Clientes</NavLink>
          </li>
          
          <li className="nav-separator">Operaciones</li>
          
          <li>
            <NavLink to="/compras">Compras</NavLink>
          </li>
          <li>
            <NavLink to="/ventas">Ventas</NavLink>
          </li>
          <li>
            <NavLink to="/devoluciones">Devoluciones</NavLink>
          </li>
          <li>
            <NavLink to="/movimientos">Movimientos</NavLink>
          </li>
          
          <li className="nav-separator">Sistema</li>
          
          <li>
            <NavLink to="/alertas">
              Alertas
              {alertasCount > 0 && <span className="badge">{alertasCount}</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/reportes">Reportes</NavLink>
          </li>
        </ul>
      </nav>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/devoluciones" element={<Devoluciones />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/alertas" element={<Alertas onUpdate={loadAlertasCount} />} />
          <Route path="/reportes" element={<Reportes />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
