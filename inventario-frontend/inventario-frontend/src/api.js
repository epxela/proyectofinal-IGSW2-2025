import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Categorías
export const getCategorias = () => api.get('/categorias')
export const createCategoria = (data) => api.post('/categorias', data)
export const updateCategoria = (id, data) => api.put(`/categorias/${id}`, data)
export const deleteCategoria = (id) => api.delete(`/categorias/${id}`)

// Proveedores
export const getProveedores = () => api.get('/proveedores')
export const createProveedor = (data) => api.post('/proveedores', data)
export const updateProveedor = (id, data) => api.put(`/proveedores/${id}`, data)
export const deleteProveedor = (id) => api.delete(`/proveedores/${id}`)

// Clientes
export const getClientes = (tipo) => api.get('/clientes', { params: { tipo } })
export const createCliente = (data) => api.post('/clientes', data)
export const updateCliente = (id, data) => api.put(`/clientes/${id}`, data)
export const deleteCliente = (id) => api.delete(`/clientes/${id}`)

// Productos
export const getProductos = (params) => api.get('/productos', { params })
export const getProducto = (id) => api.get(`/productos/${id}`)
export const createProducto = (data) => api.post('/productos', data)
export const updateProducto = (id, data) => api.put(`/productos/${id}`, data)
export const deleteProducto = (id) => api.delete(`/productos/${id}`)

// Compras
export const getCompras = (params) => api.get('/compras', { params })
export const createCompra = (data) => api.post('/compras', data)

// Ventas
export const getVentas = (params) => api.get('/ventas', { params })
export const createVenta = (data) => api.post('/ventas', data)

// Devoluciones
export const getDevoluciones = (tipo) => api.get('/devoluciones', { params: { tipo } })
export const createDevolucion = (data) => api.post('/devoluciones', data)

// Movimientos
export const getMovimientos = (params) => api.get('/movimientos', { params })
export const crearAjuste = (data) => api.post('/movimientos/ajuste', data)

// Alertas
export const getAlertas = (pendientes = true) => api.get('/alertas', { params: { pendientes } })
export const getAlertasCount = () => api.get('/alertas/count')
export const marcarAlertaLeida = (id) => api.put(`/alertas/${id}/leer`)
export const marcarTodasLeidas = () => api.put('/alertas/leer-todas')

// Reportes
export const getResumen = () => api.get('/reportes/resumen')
export const getReporteStock = (params) => api.get('/reportes/stock', { params })
export const getStockPorCategoria = () => api.get('/reportes/stock/por-categoria')
export const getMasVendidos = (params) => api.get('/reportes/mas-vendidos', { params })
export const getMenosRotacion = (params) => api.get('/reportes/menos-rotacion', { params })

export default api
