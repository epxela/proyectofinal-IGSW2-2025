import { useState, useEffect } from 'react'
import { getClientes, createCliente, updateCliente, deleteCliente } from '../api'

function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [form, setForm] = useState({ 
    nombre: '', 
    nit: 'CF', 
    telefono: '', 
    email: '', 
    tipo: 'minorista' 
  })

  useEffect(() => {
    loadData()
  }, [filtroTipo])

  const loadData = async () => {
    try {
      const { data } = await getClientes(filtroTipo || undefined)
      setClientes(data)
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
        await updateCliente(editando.id, form)
      } else {
        await createCliente(form)
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err) {
      alert('Error al guardar')
    }
  }

  const handleEdit = (cliente) => {
    setEditando(cliente)
    setForm({ 
      nombre: cliente.nombre, 
      nit: cliente.nit || 'CF',
      telefono: cliente.telefono || '', 
      email: cliente.email || '',
      tipo: cliente.tipo
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return
    try {
      await deleteCliente(id)
      loadData()
    } catch (err) {
      alert('Error al eliminar')
    }
  }

  const resetForm = () => {
    setForm({ nombre: '', nit: 'CF', telefono: '', email: '', tipo: 'minorista' })
    setEditando(null)
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Clientes</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
          + Nuevo Cliente
        </button>
      </div>

      <div className="filters">
        <div className="form-group">
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="minorista">Minorista</option>
            <option value="corporativo">Corporativo</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>NIT</th>
              <th>Tipo</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.nombre}</td>
                <td>{c.nit}</td>
                <td>
                  <span className={`status ${c.tipo === 'corporativo' ? 'status-ok' : 'status-bajo'}`}>
                    {c.tipo}
                  </span>
                </td>
                <td>{c.telefono || '-'}</td>
                <td>{c.email || '-'}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(c)}>Editar</button>
                  {' '}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientes.length === 0 && <p className="empty-state">No hay clientes</p>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editando ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
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
                  <label>NIT</label>
                  <input 
                    type="text" 
                    value={form.nit}
                    onChange={e => setForm({...form, nit: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select 
                    value={form.tipo}
                    onChange={e => setForm({...form, tipo: e.target.value})}
                  >
                    <option value="minorista">Minorista</option>
                    <option value="corporativo">Corporativo</option>
                  </select>
                </div>
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

export default Clientes
