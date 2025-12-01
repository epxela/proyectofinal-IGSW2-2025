import { useState, useEffect } from 'react'
import { getMovimientos, crearAjuste, getProductos } from '../api'

function Movimientos() {
  const [movimientos, setMovimientos] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  
  const [filtros, setFiltros] = useState({
    tipo: '',
    motivo: '',
    producto_id: ''
  })
  
  const [form, setForm] = useState({
    producto_id: '',
    tipo: 'entrada',
    cantidad: 1,
    observaciones: ''
  })

  useEffect(() => {
    loadData()
  }, [filtros])

  const loadData = async () => {
    try {
      const params = {}
      if (filtros.tipo) params.tipo = filtros.tipo
      if (filtros.motivo) params.motivo = filtros.motivo
      if (filtros.producto_id) params.producto_id = filtros.producto_id
      
      const [movRes, prodRes] = await Promise.all([
        getMovimientos(params),
        getProductos()
      ])
      setMovimientos(movRes.data)
      setProductos(prodRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      await crearAjuste({
        producto_id: parseInt(form.producto_id),
        tipo: form.tipo,
        cantidad: parseInt(form.cantidad),
        observaciones: form.observaciones
      })
      setShowModal(false)
      setForm({ producto_id: '', tipo: 'entrada', cantidad: 1, observaciones: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const getProductoInfo = () => {
    if (!form.producto_id) return null
    return productos.find(p => p.id === parseInt(form.producto_id))
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Movimientos de Inventario</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Ajuste Manual
        </button>
      </div>

      <div className="filters">
        <div className="form-group">
          <select value={filtros.tipo} onChange={e => setFiltros({...filtros, tipo: e.target.value})}>
            <option value="">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
          </select>
        </div>
        <div className="form-group">
          <select value={filtros.motivo} onChange={e => setFiltros({...filtros, motivo: e.target.value})}>
            <option value="">Todos los motivos</option>
            <option value="compra">Compra</option>
            <option value="venta">Venta</option>
            <option value="devolucion">Devolución</option>
            <option value="ajuste">Ajuste</option>
          </select>
        </div>
        <div className="form-group">
          <select value={filtros.producto_id} onChange={e => setFiltros({...filtros, producto_id: e.target.value})}>
            <option value="">Todos los productos</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>{p.sku} - {p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Tipo</th>
              <th>Motivo</th>
              <th>Cantidad</th>
              <th>Stock Ant.</th>
              <th>Stock Nuevo</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map(m => (
              <tr key={m.id}>
                <td>{new Date(m.fecha).toLocaleString()}</td>
                <td><strong>{m.producto_sku}</strong> - {m.producto_nombre}</td>
                <td>
                  <span className={`status ${m.tipo === 'entrada' ? 'status-ok' : 'status-bajo'}`}>
                    {m.tipo === 'entrada' ? '↑ Entrada' : '↓ Salida'}
                  </span>
                </td>
                <td>{m.motivo}</td>
                <td><strong>{m.cantidad}</strong></td>
                <td>{m.stock_anterior}</td>
                <td>{m.stock_nuevo}</td>
                <td>{m.observaciones || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {movimientos.length === 0 && <p className="empty-state">No hay movimientos</p>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Ajuste Manual de Inventario</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Producto *</label>
                <select 
                  value={form.producto_id}
                  onChange={e => setForm({...form, producto_id: e.target.value})}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.nombre} (Stock: {p.stock_actual})
                    </option>
                  ))}
                </select>
              </div>

              {getProductoInfo() && (
                <div className="alert alert-warning">
                  Stock actual: <strong>{getProductoInfo().stock_actual}</strong> unidades
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Ajuste *</label>
                  <select 
                    value={form.tipo}
                    onChange={e => setForm({...form, tipo: e.target.value})}
                    required
                  >
                    <option value="entrada">Entrada (+)</option>
                    <option value="salida">Salida (-)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cantidad *</label>
                  <input 
                    type="number" 
                    min="1"
                    value={form.cantidad}
                    onChange={e => setForm({...form, cantidad: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea 
                  value={form.observaciones}
                  onChange={e => setForm({...form, observaciones: e.target.value})}
                  rows="2"
                  placeholder="Ej: Conteo físico, producto dañado, etc."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Movimientos
