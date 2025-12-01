# Universidad Davinci de Guatemala
## Proyecto final
### Ingenieria de Software
#### Cristián David Aguilar Carné: 202301199
#### Juan Francisco Garzaro Gudiel Carné: 202200158
#### Francisco Javier Rojas Santos Carné: 202302368
#### William Estuardo Cardona Mateo Carné: 202304221

---
# Sistema de Inventarios - ElectroDistribuciones S.A.

Sistema para controlar el inventario de una empresa de productos electrónicos.

## ¿Qué hace?

- Registra productos, categorías, proveedores y clientes
- Controla entradas (compras) y salidas (ventas) de inventario
- Maneja devoluciones y ajustes manuales
- Genera alertas cuando hay poco stock
- Muestra reportes de productos más vendidos y sin movimiento

## Requisitos

- Ubuntu 20.04 o superior
- PostgreSQL 14+
- Python 3.10+
- Node.js 18+

## Uso

- Backend corre en: `http://localhost:5000`
- Frontend corre en: `http://localhost:3000`

Abrir el navegador en `http://178.128.2.165:3000` para usar el sistema.

## Estructura

```
inventario/
├── inventario-backend/    
│   ├── app/
│   │   ├── models.py     
│   │   └── routes/       
│   ├── run.py             
│   └── .env           
│
└── inventario-frontend/   
    └── src/
        ├── components/   
        └── api.js         
```

## Pantallas

| Pantalla | Función |
|----------|---------|
| Dashboard | Resumen general |
| Productos | Agregar, editar, eliminar productos |
| Categorías | Clasificar productos |
| Proveedores | Quién nos vende |
| Clientes | A quién vendemos |
| Compras | Registrar compras (sube el stock) |
| Ventas | Registrar ventas (baja el stock) |
| Devoluciones | Devolver productos |
| Movimientos | Ver historial y hacer ajustes |
| Alertas | Ver productos con poco stock |
| Reportes | Productos más vendidos, sin movimiento |


