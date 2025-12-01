import { useState, useEffect } from 'react'
import { getCompras, createCompra, getProveedores, getProductos } from '../api'

function Compras() {
  const [compras, setCompras] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetalle, setShowDetalle] = useState(null)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    proveedor_id: '',
    numero_documento: '',
    detalles: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [comprasRes, provRes, prodRes] = await Promise.all([
        getCompras(),
        getProveedores(),
        getProductos()
      ])
      setCompras(comprasRes.data)
      setProveedores(provRes.data)
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
      await createCompra({
        proveedor_id: parseInt(form.proveedor_id),
        numero_documento: form.numero_documento,
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
    setForm({ proveedor_id: '', numero_documento: '', detalles: [] })
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
    
    // Auto-completar precio de compra
    if (campo === 'producto_id' && valor) {
      const producto = productos.find(p => p.id === parseInt(valor))
      if (producto) {
        nuevosDetalles[index].precio_unitario = producto.precio_compra
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

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Compras</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
          + Nueva Compra
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Documento</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {compras.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{new Date(c.fecha).toLocaleDateString()}</td>
                <td>{c.proveedor_nombre}</td>
                <td>{c.numero_documento || '-'}</td>
                <td>Q{c.total.toFixed(2)}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowDetalle(c)}>
                    Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {compras.length === 0 && <p className="empty-state">No hay compras registradas</p>}
      </div>

      {/* Modal Nueva Compra */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h2>Nueva Compra</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Proveedor *</label>
                  <select 
                    value={form.proveedor_id}
                    onChange={e => setForm({...form, proveedor_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nº Documento</label>
                  <input 
                    type="text" 
                    value={form.numero_documento}
                    onChange={e => setForm({...form, numero_documento: e.target.value})}
                    placeholder="Factura, etc."
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

              <div className="detalles-total">
                Total: Q{calcularTotal().toFixed(2)}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Compra
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
            <h2>Compra #{showDetalle.id}</h2>
            <p><strong>Proveedor:</strong> {showDetalle.proveedor_nombre}</p>
            <p><strong>Fecha:</strong> {new Date(showDetalle.fecha).toLocaleString()}</p>
            <p><strong>Documento:</strong> {showDetalle.numero_documento || '-'}</p>
            
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

export default Compras
