import { useState, useEffect } from 'react'
import { getProductos, createProducto, updateProducto, deleteProducto, getCategorias } from '../api'

function Productos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStockBajo, setFiltroStockBajo] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    sku: '',
    nombre: '',
    categoria_id: '',
    precio_compra: '',
    precio_venta: '',
    stock_actual: 0,
    stock_minimo: 5
  })

  useEffect(() => {
    loadData()
  }, [filtroCategoria, filtroStockBajo])

  const loadData = async () => {
    try {
      const params = {}
      if (filtroCategoria) params.categoria_id = filtroCategoria
      if (filtroStockBajo) params.stock_bajo = true
      
      const [prodRes, catRes] = await Promise.all([
        getProductos(params),
        getCategorias()
      ])
      setProductos(prodRes.data)
      setCategorias(catRes.data)
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
      const data = {
        ...form,
        categoria_id: form.categoria_id || null,
        precio_compra: parseFloat(form.precio_compra) || 0,
        precio_venta: parseFloat(form.precio_venta),
        stock_actual: parseInt(form.stock_actual) || 0,
        stock_minimo: parseInt(form.stock_minimo) || 5
      }
      
      if (editando) {
        await updateProducto(editando.id, data)
      } else {
        await createProducto(data)
      }
      
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const handleEdit = (producto) => {
    setEditando(producto)
    setForm({
      sku: producto.sku,
      nombre: producto.nombre,
      categoria_id: producto.categoria_id || '',
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await deleteProducto(id)
      loadData()
    } catch (err) {
      alert('Error al eliminar')
    }
  }

  const resetForm = () => {
    setForm({
      sku: '',
      nombre: '',
      categoria_id: '',
      precio_compra: '',
      precio_venta: '',
      stock_actual: 0,
      stock_minimo: 5
    })
    setEditando(null)
    setError('')
  }

  const getEstadoStock = (producto) => {
    if (producto.stock_actual === 0) return <span className="status status-critico">SIN STOCK</span>
    if (producto.stock_actual <= producto.stock_minimo) return <span className="status status-bajo">BAJO</span>
    return <span className="status status-ok">OK</span>
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Productos</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
          + Nuevo Producto
        </button>
      </div>

      <div className="filters">
        <div className="form-group">
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={filtroStockBajo} 
              onChange={e => setFiltroStockBajo(e.target.checked)} 
            />
            Solo stock bajo
          </label>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>P. Compra</th>
              <th>P. Venta</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id}>
                <td><strong>{p.sku}</strong></td>
                <td>{p.nombre}</td>
                <td>{p.categoria_nombre || '-'}</td>
                <td>Q{p.precio_compra.toFixed(2)}</td>
                <td>Q{p.precio_venta.toFixed(2)}</td>
                <td>{p.stock_actual} / {p.stock_minimo}</td>
                <td>{getEstadoStock(p)}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(p)}>Editar</button>
                  {' '}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productos.length === 0 && <p className="empty-state">No hay productos</p>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editando ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>SKU *</label>
                  <input 
                    type="text" 
                    value={form.sku}
                    onChange={e => setForm({...form, sku: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <select 
                    value={form.categoria_id}
                    onChange={e => setForm({...form, categoria_id: e.target.value})}
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Nombre *</label>
                <input 
                  type="text" 
                  value={form.nombre}
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Precio Compra</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={form.precio_compra}
                    onChange={e => setForm({...form, precio_compra: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Precio Venta *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={form.precio_venta}
                    onChange={e => setForm({...form, precio_venta: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Stock Actual</label>
                  <input 
                    type="number"
                    value={form.stock_actual}
                    onChange={e => setForm({...form, stock_actual: e.target.value})}
                    disabled={editando}
                  />
                </div>
                <div className="form-group">
                  <label>Stock Mínimo</label>
                  <input 
                    type="number"
                    value={form.stock_minimo}
                    onChange={e => setForm({...form, stock_minimo: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editando ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Productos
