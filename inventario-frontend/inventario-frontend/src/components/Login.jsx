import { useState } from 'react'
import './Login.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    // Credenciales hardcodeadas (cambiar aquí temporalmente)
    const VALID_USERNAME = 'admin'
    const VALID_PASSWORD = '1234'
    
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      onLogin()
    } else {
      setError('Usuario o contraseña incorrectos')
      setPassword('')
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Inventarios</h1>
          <p>ElectroDistribuciones</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              autoFocus
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
            />
          </div>
          
          {error && <div className="login-error">{error}</div>}
          
          <button type="submit" className="btn-login">
            Iniciar Sesión
          </button>
        </form>
        
        <div className="login-footer">
          <small>Credenciales por defecto: admin / 1234</small>
        </div>
      </div>
    </div>
  )
}

export default Login
