from app import db
from datetime import datetime

class Categoria(db.Model):
    __tablename__ = 'categorias'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    activo = db.Column(db.Boolean, default=True)
    
    productos = db.relationship('Producto', backref='categoria', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'activo': self.activo
        }


class Proveedor(db.Model):
    __tablename__ = 'proveedores'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    telefono = db.Column(db.String(20))
    email = db.Column(db.String(100))
    activo = db.Column(db.Boolean, default=True)
    
    compras = db.relationship('Compra', backref='proveedor', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'telefono': self.telefono,
            'email': self.email,
            'activo': self.activo
        }


class Cliente(db.Model):
    __tablename__ = 'clientes'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    nit = db.Column(db.String(20), default='CF')
    telefono = db.Column(db.String(20))
    email = db.Column(db.String(100))
    tipo = db.Column(db.String(20), default='minorista')
    activo = db.Column(db.Boolean, default=True)
    
    ventas = db.relationship('Venta', backref='cliente', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'nit': self.nit,
            'telefono': self.telefono,
            'email': self.email,
            'tipo': self.tipo,
            'activo': self.activo
        }


class Producto(db.Model):
    __tablename__ = 'productos'
    
    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    nombre = db.Column(db.String(200), nullable=False)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categorias.id'))
    precio_compra = db.Column(db.Numeric(10, 2), default=0)
    precio_venta = db.Column(db.Numeric(10, 2), nullable=False)
    stock_actual = db.Column(db.Integer, default=0)
    stock_minimo = db.Column(db.Integer, default=5)
    activo = db.Column(db.Boolean, default=True)
    
    movimientos = db.relationship('MovimientoInventario', backref='producto', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'sku': self.sku,
            'nombre': self.nombre,
            'categoria_id': self.categoria_id,
            'categoria_nombre': self.categoria.nombre if self.categoria else None,
            'precio_compra': float(self.precio_compra) if self.precio_compra else 0,
            'precio_venta': float(self.precio_venta),
            'stock_actual': self.stock_actual,
            'stock_minimo': self.stock_minimo,
            'activo': self.activo
        }


class MovimientoInventario(db.Model):
    __tablename__ = 'movimientos_inventario'
    
    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos.id'), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)  # entrada, salida
    motivo = db.Column(db.String(30), nullable=False)  # compra, venta, devolucion, ajuste
    cantidad = db.Column(db.Integer, nullable=False)
    stock_anterior = db.Column(db.Integer, nullable=False)
    stock_nuevo = db.Column(db.Integer, nullable=False)
    referencia_id = db.Column(db.Integer)
    observaciones = db.Column(db.Text)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'producto_id': self.producto_id,
            'producto_nombre': self.producto.nombre if self.producto else None,
            'producto_sku': self.producto.sku if self.producto else None,
            'tipo': self.tipo,
            'motivo': self.motivo,
            'cantidad': self.cantidad,
            'stock_anterior': self.stock_anterior,
            'stock_nuevo': self.stock_nuevo,
            'referencia_id': self.referencia_id,
            'observaciones': self.observaciones,
            'fecha': self.fecha.isoformat() if self.fecha else None
        }


class Compra(db.Model):
    __tablename__ = 'compras'
    
    id = db.Column(db.Integer, primary_key=True)
    proveedor_id = db.Column(db.Integer, db.ForeignKey('proveedores.id'), nullable=False)
    numero_documento = db.Column(db.String(50))
    total = db.Column(db.Numeric(10, 2), default=0)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    
    detalles = db.relationship('CompraDetalle', backref='compra', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'proveedor_id': self.proveedor_id,
            'proveedor_nombre': self.proveedor.nombre if self.proveedor else None,
            'numero_documento': self.numero_documento,
            'total': float(self.total) if self.total else 0,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'detalles': [d.to_dict() for d in self.detalles]
        }


class CompraDetalle(db.Model):
    __tablename__ = 'compras_detalle'
    
    id = db.Column(db.Integer, primary_key=True)
    compra_id = db.Column(db.Integer, db.ForeignKey('compras.id', ondelete='CASCADE'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos.id'), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    precio_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    
    producto = db.relationship('Producto')
    
    def to_dict(self):
        return {
            'id': self.id,
            'compra_id': self.compra_id,
            'producto_id': self.producto_id,
            'producto_nombre': self.producto.nombre if self.producto else None,
            'producto_sku': self.producto.sku if self.producto else None,
            'cantidad': self.cantidad,
            'precio_unitario': float(self.precio_unitario),
            'subtotal': float(self.subtotal)
        }


class Venta(db.Model):
    __tablename__ = 'ventas'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'))
    punto_venta = db.Column(db.String(20))
    total = db.Column(db.Numeric(10, 2), default=0)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    
    detalles = db.relationship('VentaDetalle', backref='venta', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'cliente_nombre': self.cliente.nombre if self.cliente else 'Consumidor Final',
            'punto_venta': self.punto_venta,
            'total': float(self.total) if self.total else 0,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'detalles': [d.to_dict() for d in self.detalles]
        }


class VentaDetalle(db.Model):
    __tablename__ = 'ventas_detalle'
    
    id = db.Column(db.Integer, primary_key=True)
    venta_id = db.Column(db.Integer, db.ForeignKey('ventas.id', ondelete='CASCADE'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos.id'), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    precio_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    
    producto = db.relationship('Producto')
    
    def to_dict(self):
        return {
            'id': self.id,
            'venta_id': self.venta_id,
            'producto_id': self.producto_id,
            'producto_nombre': self.producto.nombre if self.producto else None,
            'producto_sku': self.producto.sku if self.producto else None,
            'cantidad': self.cantidad,
            'precio_unitario': float(self.precio_unitario),
            'subtotal': float(self.subtotal)
        }


class Devolucion(db.Model):
    __tablename__ = 'devoluciones'
    
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(20), nullable=False)  # cliente, proveedor
    referencia_id = db.Column(db.Integer)
    motivo = db.Column(db.Text, nullable=False)
    total = db.Column(db.Numeric(10, 2), default=0)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    
    detalles = db.relationship('DevolucionDetalle', backref='devolucion', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'tipo': self.tipo,
            'referencia_id': self.referencia_id,
            'motivo': self.motivo,
            'total': float(self.total) if self.total else 0,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'detalles': [d.to_dict() for d in self.detalles]
        }


class DevolucionDetalle(db.Model):
    __tablename__ = 'devoluciones_detalle'
    
    id = db.Column(db.Integer, primary_key=True)
    devolucion_id = db.Column(db.Integer, db.ForeignKey('devoluciones.id', ondelete='CASCADE'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos.id'), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    precio_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    
    producto = db.relationship('Producto')
    
    def to_dict(self):
        return {
            'id': self.id,
            'devolucion_id': self.devolucion_id,
            'producto_id': self.producto_id,
            'producto_nombre': self.producto.nombre if self.producto else None,
            'cantidad': self.cantidad,
            'precio_unitario': float(self.precio_unitario)
        }


class Alerta(db.Model):
    __tablename__ = 'alertas'
    
    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('productos.id'))
    tipo = db.Column(db.String(30), nullable=False)
    mensaje = db.Column(db.Text, nullable=False)
    leida = db.Column(db.Boolean, default=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    
    producto = db.relationship('Producto')
    
    def to_dict(self):
        return {
            'id': self.id,
            'producto_id': self.producto_id,
            'producto_nombre': self.producto.nombre if self.producto else None,
            'producto_sku': self.producto.sku if self.producto else None,
            'tipo': self.tipo,
            'mensaje': self.mensaje,
            'leida': self.leida,
            'fecha': self.fecha.isoformat() if self.fecha else None
        }
