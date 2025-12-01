import { useState, useEffect } from 'react'
import { getDevoluciones, createDevolucion, getProductos } from '../api'

function Devoluciones() {
  const [devoluciones, setDevoluciones] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    tipo: 'cliente',
    referencia_id: '',
    motivo: '',
    detalles: []
  })

  useEffect(() => {
    loadData()
  }, [filtroTipo])

  const loadData = async () => {
    try {
      const [devRes, prodRes] = await Promise.all([
        getDevoluciones(filtroTipo || undefined),
        getProductos()
      ])
      setDevoluciones(devRes.data)
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
    
    if (form.detalles.length === 0) {
      setError('Agrega al menos un producto')
      return
    }
    
    try {
      await createDevolucion({
        tipo: form.tipo,
        referencia_id: form.referencia_id ? parseInt(form.referencia_id) : null,
        motivo: form.motivo,
        detalles: form.detalles.map(d => ({
          producto_id: parseInt(d.producto_id),
          cantidad: parseInt(d.cantidad),
          precio_unitario: parseFloat(d.precio_unitario)
        }))
      })
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const resetForm = () => {
    setForm({ tipo: 'cliente', referencia_id: '', motivo: '', detalles: [] })
    setError('')
  }

  const agregarDetalle = () => {
    setForm({
      ...form,
      detalles: [...form.detalles, { producto_id: '', cantidad: 1, precio_unitario: '' }]
    })
  }

  const actualizarDetalle = (index, campo, valor) => {
    const nuevosDetalles = [...form.detalles]
    nuevosDetalles[index][campo] = valor
    
    if (campo === 'producto_id' && valor) {
      const producto = productos.find(p => p.id === parseInt(valor))
      if (producto) {
        nuevosDetalles[index].precio_unitario = producto.precio_venta
      }
    }
    
    setForm({ ...form, detalles: nuevosDetalles })
  }

  const eliminarDetalle = (index) => {
    setForm({
      ...form,
      detalles: form.detalles.filter((_, i) => i !== index)
    })
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Devoluciones</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
          + Nueva Devolución
        </button>
      </div>

      <div className="filters">
        <div className="form-group">
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="cliente">De Cliente</option>
            <option value="proveedor">A Proveedor</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Motivo</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {devoluciones.map(d => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{new Date(d.fecha).toLocaleDateString()}</td>
                <td>
                  <span className={`status ${d.tipo === 'cliente' ? 'status-ok' : 'status-bajo'}`}>
                    {d.tipo === 'cliente' ? 'De Cliente' : 'A Proveedor'}
                  </span>
                </td>
                <td>{d.motivo}</td>
                <td>Q{d.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {devoluciones.length === 0 && <p className="empty-state">No hay devoluciones</p>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h2>Nueva Devolución</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo *</label>
                  <select 
                    value={form.tipo}
                    onChange={e => setForm({...form, tipo: e.target.value})}
                    required
                  >
                    <option value="cliente">Devolución de Cliente (entrada)</option>
                    <option value="proveedor">Devolución a Proveedor (salida)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ref. Venta/Compra</label>
                  <input 
                    type="number" 
                    value={form.referencia_id}
                    onChange={e => setForm({...form, referencia_id: e.target.value})}
                    placeholder="ID original (opcional)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Motivo *</label>
                <textarea 
                  value={form.motivo}
                  onChange={e => setForm({...form, motivo: e.target.value})}
                  required
                  rows="2"
                  placeholder="Ej: Producto defectuoso, equivocación, etc."
                />
              </div>

              <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Productos</h4>
              
              {form.detalles.map((detalle, index) => (
                <div key={index} className="detalle-item">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Producto</label>
                    <select 
                      value={detalle.producto_id}
                      onChange={e => actualizarDetalle(index, 'producto_id', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>{p.sku} - {p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cantidad</label>
                    <input 
                      type="number" 
                      min="1"
                      value={detalle.cantidad}
                      onChange={e => actualizarDetalle(index, 'cantidad', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio Unit.</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={detalle.precio_unitario}
                      onChange={e => actualizarDetalle(index, 'precio_unitario', e.target.value)}
                      required
                    />
                  </div>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => eliminarDetalle(index)}>
                    ✕
                  </button>
                </div>
              ))}
              
              <button type="button" className="btn btn-secondary" onClick={agregarDetalle}>
                + Agregar Producto
              </button>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Devolución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Devoluciones
