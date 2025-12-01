import { useState, useEffect } from 'react'
import { getProveedores, createProveedor, updateProveedor, deleteProveedor } from '../api'

function Proveedores() {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data } = await getProveedores()
      setProveedores(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        await updateProveedor(editando.id, form)
      } else {
        await createProveedor(form)
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err) {
      alert('Error al guardar')
    }
  }

  const handleEdit = (prov) => {
    setEditando(prov)
    setForm({ nombre: prov.nombre, telefono: prov.telefono || '', email: prov.email || '' })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este proveedor?')) return
    try {
      await deleteProveedor(id)
      loadData()
    } catch (err) {
      alert('Error al eliminar')
    }
  }

  const resetForm = () => {
    setForm({ nombre: '', telefono: '', email: '' })
    setEditando(null)
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Proveedores</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
          + Nuevo Proveedor
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.nombre}</td>
                <td>{p.telefono || '-'}</td>
                <td>{p.email || '-'}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(p)}>Editar</button>
                  {' '}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {proveedores.length === 0 && <p className="empty-state">No hay proveedores</p>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
            <form onSubmit={handleSubmit}>
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
                  <label>Teléfono</label>
                  <input 
                    type="text" 
                    value={form.telefono}
                    onChange={e => setForm({...form, telefono: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editando ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Proveedores
