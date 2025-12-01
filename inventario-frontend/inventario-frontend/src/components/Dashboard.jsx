import { useState, useEffect } from 'react'
import { getResumen, getMasVendidos, getAlertas } from '../api'

function Dashboard() {
  const [resumen, setResumen] = useState(null)
  const [masVendidos, setMasVendidos] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [resumenRes, vendidosRes, alertasRes] = await Promise.all([
        getResumen(),
        getMasVendidos({ limit: 5, dias: 30 }),
        getAlertas(true)
      ])
      setResumen(resumenRes.data)
      setMasVendidos(vendidosRes.data)
      setAlertas(alertasRes.data.slice(0, 5))
    } catch (err) {
      console.error('Error cargando dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      {resumen && (
        <div className="cards-grid">
          <div className="card card-stat">
            <div className="number">{resumen.total_productos}</div>
            <div className="label">Total Productos</div>
          </div>
          
          <div className="card card-stat warning">
            <div className="number">{resumen.productos_stock_bajo}</div>
            <div className="label">Stock Bajo</div>
          </div>
          
          <div className="card card-stat danger">
            <div className="number">{resumen.productos_sin_stock}</div>
            <div className="label">Sin Stock</div>
          </div>
          
          <div className="card card-stat success">
            <div className="number">Q{resumen.valor_inventario.toLocaleString()}</div>
            <div className="label">Valor Inventario</div>
          </div>
          
          <div className="card card-stat">
            <div className="number">{resumen.ventas_hoy.cantidad}</div>
            <div className="label">Ventas Hoy</div>
          </div>
          
          <div className="card card-stat success">
            <div className="number">Q{resumen.ventas_hoy.total.toLocaleString()}</div>
            <div className="label">Ingresos Hoy</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>Más Vendidos (30 días)</h3>
          {masVendidos.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Vendidos</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {masVendidos.map(p => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.total_vendido}</td>
                    <td>Q{p.total_ingresos.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">Sin ventas registradas</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>Alertas Recientes</h3>
          {alertas.length > 0 ? (
            <div>
              {alertas.map(a => (
                <div key={a.id} className="alerta-item">
                  <div className="alerta-info">
                    <h4>{a.producto_nombre || 'Sistema'}</h4>
                    <p>{a.mensaje}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">Sin alertas pendientes ✓</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
