import { useState, useEffect } from 'react'
import { getAlertas, marcarAlertaLeida, marcarTodasLeidas } from '../api'

function Alertas({ onUpdate }) {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarTodas, setMostrarTodas] = useState(false)

  useEffect(() => {
    loadData()
  }, [mostrarTodas])

  const loadData = async () => {
    try {
      const { data } = await getAlertas(!mostrarTodas)
      setAlertas(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarLeida = async (id) => {
    try {
      await marcarAlertaLeida(id)
      loadData()
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarcarTodas = async () => {
    try {
      await marcarTodasLeidas()
      loadData()
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error(err)
    }
  }

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'stock_critico': return '🔴'
      case 'stock_bajo': return '🟡'
      case 'reabastecimiento': return '📦'
      default: return '🔔'
    }
  }

  if (loading) return <div className="loading">Cargando...</div>

  const alertasPendientes = alertas.filter(a => !a.leida)

  return (
    <div>
      <div className="page-header">
        <h1>Alertas</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={mostrarTodas} 
              onChange={e => setMostrarTodas(e.target.checked)} 
            />
            Mostrar todas
          </label>
          {alertasPendientes.length > 0 && (
            <button className="btn btn-secondary" onClick={handleMarcarTodas}>
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {alertas.length > 0 ? (
          alertas.map(a => (
            <div key={a.id} className={`alerta-item ${a.leida ? 'leida' : ''}`}>
              <div className="alerta-info">
                <h4>
                  {getTipoIcon(a.tipo)} {a.producto_nombre || 'Sistema'}
                  {' '}
                  <span className={`status ${a.tipo === 'stock_critico' ? 'status-critico' : 'status-bajo'}`}>
                    {a.tipo.replace('_', ' ')}
                  </span>
                </h4>
                <p>{a.mensaje}</p>
                <span className="alerta-fecha">
                  {new Date(a.fecha).toLocaleString()}
                </span>
              </div>
              {!a.leida && (
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={() => handleMarcarLeida(a.id)}
                >
                  ✓ Leída
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="empty-state">
            {mostrarTodas ? 'No hay alertas registradas' : '¡Sin alertas pendientes! ✓'}
          </p>
        )}
      </div>
    </div>
  )
}

export default Alertas
