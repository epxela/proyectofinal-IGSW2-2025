import { useState, useEffect } from 'react'
import { getReporteStock, getStockPorCategoria, getMasVendidos, getMenosRotacion } from '../api'

function Reportes() {
  const [reporte, setReporte] = useState('stock')
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState({
    stock_bajo: false,
    limit: 10,
    dias: 30
  })

  useEffect(() => {
    loadReporte()
  }, [reporte, filtros])

  const loadReporte = async () => {
    setLoading(true)
    try {
      let response
      switch (reporte) {
        case 'stock':
          response = await getReporteStock({ stock_bajo: filtros.stock_bajo })
          break
        case 'categoria':
          response = await getStockPorCategoria()
          break
        case 'vendidos':
          response = await getMasVendidos({ limit: filtros.limit, dias: filtros.dias })
          break
        case 'rotacion':
          response = await getMenosRotacion({ dias: filtros.dias })
          break
        default:
          response = { data: [] }
      }
      setDatos(response.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const renderTabla = () => {
    if (loading) return <div className="loading">Cargando...</div>
    if (datos.length === 0) return <p className="empty-state">Sin datos</p>

    switch (reporte) {
      case 'stock':
        return (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Estado</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {datos.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.sku}</strong></td>
                  <td>{d.nombre}</td>
                  <td>{d.categoria}</td>
                  <td>{d.stock_actual}</td>
                  <td>{d.stock_minimo}</td>
                  <td>
                    <span className={`status status-${d.estado.toLowerCase()}`}>
                      {d.estado}
                    </span>
                  </td>
                  <td>Q{d.valor_inventario.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'categoria':
        return (
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Productos</th>
                <th>Stock Total</th>
                <th>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d, i) => (
                <tr key={i}>
                  <td><strong>{d.categoria}</strong></td>
                  <td>{d.total_productos}</td>
                  <td>{d.stock_total}</td>
                  <td>Q{d.valor_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'vendidos':
        return (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Vendidos</th>
                <th>Ingresos</th>
                <th># Ventas</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d, i) => (
                <tr key={d.id}>
                  <td><strong>{i + 1}</strong></td>
                  <td>{d.sku}</td>
                  <td>{d.nombre}</td>
                  <td>{d.categoria}</td>
                  <td><strong>{d.total_vendido}</strong></td>
                  <td>Q{d.total_ingresos.toFixed(2)}</td>
                  <td>{d.num_ventas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'rotacion':
        return (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Último Mov.</th>
                <th>Días sin Venta</th>
              </tr>
            </thead>
            <tbody>
              {datos.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.sku}</strong></td>
                  <td>{d.nombre}</td>
                  <td>{d.categoria}</td>
                  <td>{d.stock_actual}</td>
                  <td>{d.ultimo_movimiento ? new Date(d.ultimo_movimiento).toLocaleDateString() : 'Nunca'}</td>
                  <td>
                    <span className={`status ${d.dias_sin_venta === 'Nunca' || d.dias_sin_venta > 60 ? 'status-critico' : 'status-bajo'}`}>
                      {d.dias_sin_venta}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      default:
        return null
    }
  }

  const calcularTotales = () => {
    if (reporte === 'stock') {
      const total = datos.reduce((sum, d) => sum + d.valor_inventario, 0)
      return `Valor total: Q${total.toFixed(2)}`
    }
    if (reporte === 'categoria') {
      const total = datos.reduce((sum, d) => sum + d.valor_total, 0)
      return `Valor total: Q${total.toFixed(2)}`
    }
    if (reporte === 'vendidos') {
      const total = datos.reduce((sum, d) => sum + d.total_ingresos, 0)
      return `Ingresos totales: Q${total.toFixed(2)}`
    }
    return null
  }

  return (
    <div>
      <div className="page-header">
        <h1>Reportes</h1>
      </div>

      <div className="filters" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label>Tipo de Reporte</label>
          <select value={reporte} onChange={e => setReporte(e.target.value)}>
            <option value="stock">Stock por Producto</option>
            <option value="categoria">Stock por Categoría</option>
            <option value="vendidos">Productos Más Vendidos</option>
            <option value="rotacion">Productos Sin Rotación</option>
          </select>
        </div>

        {reporte === 'stock' && (
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                checked={filtros.stock_bajo} 
                onChange={e => setFiltros({...filtros, stock_bajo: e.target.checked})}
              />
              Solo stock bajo
            </label>
          </div>
        )}

        {(reporte === 'vendidos' || reporte === 'rotacion') && (
          <div className="form-group">
            <label>Período (días)</label>
            <select 
              value={filtros.dias} 
              onChange={e => setFiltros({...filtros, dias: parseInt(e.target.value)})}
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="60">Últimos 60 días</option>
              <option value="90">Últimos 90 días</option>
            </select>
          </div>
        )}

        {reporte === 'vendidos' && (
          <div className="form-group">
            <label>Mostrar</label>
            <select 
              value={filtros.limit} 
              onChange={e => setFiltros({...filtros, limit: parseInt(e.target.value)})}
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
            </select>
          </div>
        )}
      </div>

      <div className="table-container">
        {renderTabla()}
      </div>

      {datos.length > 0 && calcularTotales() && (
        <div className="detalles-total" style={{ marginTop: '20px' }}>
          {calcularTotales()}
        </div>
      )}
    </div>
  )
}

export default Reportes
