import { useState, useEffect } from 'react'
import { getVentas, createVenta, getClientes, getProductos } from '../api'

function Ventas() {
  const [ventas, setVentas] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetalle, setShowDetalle] = useState(null)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    cliente_id: '',
    punto_venta: '',
    detalles: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ventasRes, cliRes, prodRes] = await Promise.all([
        getVentas(),
        getClientes(),
        getProductos()
      ])
      setVentas(ventasRes.data)
      setClientes(cliRes.data)
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
      await createVenta({
        cliente_id: form.cliente_id ? parseInt(form.cliente_id) : null,
        punto_venta: form.punto_venta,
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
    setForm({ cliente_id: '', punto_venta: '', detalles: [] })
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
    
    // Auto-completar precio de venta y validar stock
    if (campo === 'producto_id' && valor) {
      const producto = productos.find(p => p.id === parseInt(valor))
      if (producto) {
        nuevosDetalles[index].precio_unitario = producto.precio_venta
        nuevosDetalles[index].stock_disponible = producto.stock_actual
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

  const calcularTotal = () => {
    return form.detalles.reduce((sum, d) => {
      return sum + (parseFloat(d.cantidad) || 0) * (parseFloat(d.precio_unitario) || 0)
    }, 0)
  }

  const getStockProducto = (producto_id) => {
    const producto = productos.find(p => p.id === parseInt(producto_id))
    return producto ? producto.stock_actual : 0
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Ventas</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
          + Nueva Venta
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>POS</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map(v => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{new Date(v.fecha).toLocaleDateString()}</td>
                <td>{v.cliente_nombre}</td>
                <td>{v.punto_venta || '-'}</td>
                <td>Q{v.total.toFixed(2)}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowDetalle(v)}>
                    Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ventas.length === 0 && <p className="empty-state">No hay ventas registradas</p>}
      </div>

      {/* Modal Nueva Venta */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h2>Nueva Venta</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Cliente (opcional)</label>
                  <select 
                    value={form.cliente_id}
                    onChange={e => setForm({...form, cliente_id: e.target.value})}
                  >
                    <option value="">Consumidor Final</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Punto de Venta</label>
                  <input 
                    type="text" 
                    value={form.punto_venta}
                    onChange={e => setForm({...form, punto_venta: e.target.value})}
                    placeholder="POS-01"
                  />
                </div>
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
                      {productos.filter(p => p.stock_actual > 0).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.nombre} (Stock: {p.stock_actual})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cantidad</label>
                    <input 
                      type="number" 
                      min="1"
                      max={getStockProducto(detalle.producto_id)}
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

              <div className="detalles-total">
                Total: Q{calcularTotal().toFixed(2)}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Registrar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle */}
      {showDetalle && (
        <div className="modal-overlay" onClick={() => setShowDetalle(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Venta #{showDetalle.id}</h2>
            <p><strong>Cliente:</strong> {showDetalle.cliente_nombre}</p>
            <p><strong>Fecha:</strong> {new Date(showDetalle.fecha).toLocaleString()}</p>
            <p><strong>Punto de Venta:</strong> {showDetalle.punto_venta || '-'}</p>
            
            <table style={{ marginTop: '15px' }}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>P. Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {showDetalle.detalles.map(d => (
                  <tr key={d.id}>
                    <td>{d.producto_nombre}</td>
                    <td>{d.cantidad}</td>
                    <td>Q{d.precio_unitario.toFixed(2)}</td>
                    <td>Q{d.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="detalles-total">
              Total: Q{showDetalle.total.toFixed(2)}
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDetalle(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ventas
