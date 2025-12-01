from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Configuración
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://usuario:password@localhost:5432/inventario_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JSON_SORT_KEYS'] = False
    
    # Inicializar extensiones
    db.init_app(app)
    CORS(app)  # Habilitar CORS para React
    
    # Registrar blueprints
    from app.routes.categorias import categorias_bp
    from app.routes.proveedores import proveedores_bp
    from app.routes.clientes import clientes_bp
    from app.routes.productos import productos_bp
    from app.routes.compras import compras_bp
    from app.routes.ventas import ventas_bp
    from app.routes.devoluciones import devoluciones_bp
    from app.routes.movimientos import movimientos_bp
    from app.routes.alertas import alertas_bp
    from app.routes.reportes import reportes_bp
    
    app.register_blueprint(categorias_bp, url_prefix='/api/categorias')
    app.register_blueprint(proveedores_bp, url_prefix='/api/proveedores')
    app.register_blueprint(clientes_bp, url_prefix='/api/clientes')
    app.register_blueprint(productos_bp, url_prefix='/api/productos')
    app.register_blueprint(compras_bp, url_prefix='/api/compras')
    app.register_blueprint(ventas_bp, url_prefix='/api/ventas')
    app.register_blueprint(devoluciones_bp, url_prefix='/api/devoluciones')
    app.register_blueprint(movimientos_bp, url_prefix='/api/movimientos')
    app.register_blueprint(alertas_bp, url_prefix='/api/alertas')
    app.register_blueprint(reportes_bp, url_prefix='/api/reportes')
    
    # Ruta de prueba
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'API funcionando'}
    
    return app
