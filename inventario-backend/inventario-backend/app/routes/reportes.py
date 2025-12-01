from flask import Blueprint, request, jsonify
from app import db
from app.models import Producto, Categoria, MovimientoInventario, Venta, VentaDetalle
from sqlalchemy import func, desc
from datetime import datetime, timedelta

reportes_bp = Blueprint('reportes', __name__)

@reportes_bp.route('/stock', methods=['GET'])
def reporte_stock():
    """Stock actual por producto y categoría"""
    categoria_id = request.args.get('categoria_id', type=int)
    solo_bajo = request.args.get('stock_bajo', 'false').lower() == 'true'
    
    query = db.session.query(
        Producto.id,
        Producto.sku,
        Producto.nombre,
        Categoria.nombre.label('categoria'),
        Producto.stock_actual,
        Producto.stock_minimo,
        Producto.precio_venta
    ).outerjoin(Categoria, Producto.categoria_id == Categoria.id).filter(
        Producto.activo == True
    )
    
    if categoria_id:
        query = query.filter(Producto.categoria_id == categoria_id)
    
    if solo_bajo:
        query = query.filter(Producto.stock_actual <= Producto.stock_minimo)
    
    resultados = query.order_by(Categoria.nombre, Producto.nombre).all()
    
    return jsonify([{
        'id': r.id,
        'sku': r.sku,
        'nombre': r.nombre,
        'categoria': r.categoria or 'Sin categoría',
        'stock_actual': r.stock_actual,
        'stock_minimo': r.stock_minimo,
        'estado': 'CRITICO' if r.stock_actual == 0 else ('BAJO' if r.stock_actual <= r.stock_minimo else 'OK'),
        'valor_inventario': float(r.stock_actual * r.precio_venta)
    } for r in resultados])


@reportes_bp.route('/stock/por-categoria', methods=['GET'])
def stock_por_categoria():
    """Resumen de stock agrupado por categoría"""
    resultados = db.session.query(
        Categoria.nombre,
        func.count(Producto.id).label('total_productos'),
        func.sum(Producto.stock_actual).label('stock_total'),
        func.sum(Producto.stock_actual * Producto.precio_venta).label('valor_total')
    ).outerjoin(Producto, Categoria.id == Producto.categoria_id).filter(
        Producto.activo == True
    ).group_by(Categoria.id, Categoria.nombre).all()
    
    return jsonify([{
        'categoria': r.nombre,
        'total_productos': r.total_productos,
        'stock_total': r.stock_total or 0,
        'valor_total': float(r.valor_total or 0)
    } for r in resultados])


@reportes_bp.route('/movimientos', methods=['GET'])
def reporte_movimientos():
    """Historial de movimientos con filtros"""
    fecha_desde = request.args.get('fecha_desde')
    fecha_hasta = request.args.get('fecha_hasta')
    tipo = request.args.get('tipo')
    motivo = request.args.get('motivo')
    
    query = db.session.query(
        MovimientoInventario.fecha,
        Producto.sku,
        Producto.nombre.label('producto'),
        MovimientoInventario.tipo,
        MovimientoInventario.motivo,
        MovimientoInventario.cantidad,
        MovimientoInventario.stock_anterior,
        MovimientoInventario.stock_nuevo,
        MovimientoInventario.observaciones
    ).join(Producto, MovimientoInventario.producto_id == Producto.id)
    
    if fecha_desde:
        query = query.filter(MovimientoInventario.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(MovimientoInventario.fecha <= fecha_hasta)
    if tipo:
        query = query.filter(MovimientoInventario.tipo == tipo)
    if motivo:
        query = query.filter(MovimientoInventario.motivo == motivo)
    
    resultados = query.order_by(MovimientoInventario.fecha.desc()).limit(500).all()
    
    return jsonify([{
        'fecha': r.fecha.isoformat() if r.fecha else None,
        'sku': r.sku,
        'producto': r.producto,
        'tipo': r.tipo,
        'motivo': r.motivo,
        'cantidad': r.cantidad,
        'stock_anterior': r.stock_anterior,
        'stock_nuevo': r.stock_nuevo,
        'observaciones': r.observaciones
    } for r in resultados])


@reportes_bp.route('/mas-vendidos', methods=['GET'])
def productos_mas_vendidos():
    """Top productos más vendidos"""
    limit = request.args.get('limit', 10, type=int)
    dias = request.args.get('dias', 30, type=int)
    
    fecha_inicio = datetime.utcnow() - timedelta(days=dias)
    
    resultados = db.session.query(
        Producto.id,
        Producto.sku,
        Producto.nombre,
        Categoria.nombre.label('categoria'),
        func.sum(VentaDetalle.cantidad).label('total_vendido'),
        func.sum(VentaDetalle.subtotal).label('total_ingresos'),
        func.count(func.distinct(VentaDetalle.venta_id)).label('num_ventas')
    ).join(VentaDetalle, Producto.id == VentaDetalle.producto_id
    ).join(Venta, VentaDetalle.venta_id == Venta.id
    ).outerjoin(Categoria, Producto.categoria_id == Categoria.id
    ).filter(Venta.fecha >= fecha_inicio
    ).group_by(Producto.id, Producto.sku, Producto.nombre, Categoria.nombre
    ).order_by(desc('total_vendido')
    ).limit(limit).all()
    
    return jsonify([{
        'id': r.id,
        'sku': r.sku,
        'nombre': r.nombre,
        'categoria': r.categoria or 'Sin categoría',
        'total_vendido': r.total_vendido,
        'total_ingresos': float(r.total_ingresos),
        'num_ventas': r.num_ventas
    } for r in resultados])


@reportes_bp.route('/menos-rotacion', methods=['GET'])
def productos_sin_rotacion():
    """Productos con menos rotación (sin ventas en X días)"""
    dias = request.args.get('dias', 30, type=int)
    
    fecha_limite = datetime.utcnow() - timedelta(days=dias)
    
    # Subconsulta de productos vendidos recientemente
    vendidos_reciente = db.session.query(
        VentaDetalle.producto_id
    ).join(Venta).filter(
        Venta.fecha >= fecha_limite
    ).distinct().subquery()
    
    # Productos sin ventas recientes
    resultados = db.session.query(
        Producto.id,
        Producto.sku,
        Producto.nombre,
        Categoria.nombre.label('categoria'),
        Producto.stock_actual,
        func.max(MovimientoInventario.fecha).label('ultimo_movimiento')
    ).outerjoin(Categoria, Producto.categoria_id == Categoria.id
    ).outerjoin(MovimientoInventario, Producto.id == MovimientoInventario.producto_id
    ).filter(
        Producto.activo == True,
        Producto.stock_actual > 0,
        ~Producto.id.in_(vendidos_reciente)
    ).group_by(Producto.id, Producto.sku, Producto.nombre, Categoria.nombre, Producto.stock_actual
    ).order_by(func.max(MovimientoInventario.fecha).asc().nullsfirst()
    ).all()
    
    return jsonify([{
        'id': r.id,
        'sku': r.sku,
        'nombre': r.nombre,
        'categoria': r.categoria or 'Sin categoría',
        'stock_actual': r.stock_actual,
        'ultimo_movimiento': r.ultimo_movimiento.isoformat() if r.ultimo_movimiento else None,
        'dias_sin_venta': (datetime.utcnow() - r.ultimo_movimiento).days if r.ultimo_movimiento else 'Nunca'
    } for r in resultados])


@reportes_bp.route('/resumen', methods=['GET'])
def resumen_general():
    """Resumen general del inventario"""
    
    # Total productos
    total_productos = Producto.query.filter_by(activo=True).count()
    
    # Productos con stock bajo
    stock_bajo = Producto.query.filter(
        Producto.activo == True,
        Producto.stock_actual <= Producto.stock_minimo,
        Producto.stock_actual > 0
    ).count()
    
    # Productos sin stock
    sin_stock = Producto.query.filter(
        Producto.activo == True,
        Producto.stock_actual == 0
    ).count()
    
    # Valor total inventario
    valor_total = db.session.query(
        func.sum(Producto.stock_actual * Producto.precio_venta)
    ).filter(Producto.activo == True).scalar() or 0
    
    # Alertas pendientes
    from app.models import Alerta
    alertas_pendientes = Alerta.query.filter_by(leida=False).count()
    
    # Ventas del día
    hoy = datetime.utcnow().date()
    ventas_hoy = db.session.query(
        func.count(Venta.id),
        func.coalesce(func.sum(Venta.total), 0)
    ).filter(func.date(Venta.fecha) == hoy).first()
    
    return jsonify({
        'total_productos': total_productos,
        'productos_stock_bajo': stock_bajo,
        'productos_sin_stock': sin_stock,
        'valor_inventario': float(valor_total),
        'alertas_pendientes': alertas_pendientes,
        'ventas_hoy': {
            'cantidad': ventas_hoy[0] or 0,
            'total': float(ventas_hoy[1] or 0)
        }
    })
