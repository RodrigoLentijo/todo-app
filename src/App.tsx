import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type Tarea = {
  id: number
  texto: string
  completada: boolean
}

const API = 'http://localhost:3001/api'

function pedir(ruta: string, token: string | null, opciones: RequestInit = {}) {
  return fetch(`${API}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

function limpiarSesion() {
  localStorage.removeItem('token')
  localStorage.removeItem('email')
}

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  )
  const [emailSesion, setEmailSesion] = useState<string | null>(
    localStorage.getItem('email')
  )
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [texto, setTexto] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    pedir('/tareas', token)
      .then((respuesta) => {
        if (respuesta.status === 401) {
          limpiarSesion()
          setToken(null)
          return []
        }
        return respuesta.json()
      })
      .then((datos) => setTareas(datos))
  }, [token])

  function cerrarSesion() {
    limpiarSesion()
    setToken(null)
    setEmailSesion(null)
    setTareas([])
  }

  function sesionVencida(respuesta: Response) {
    if (respuesta.status !== 401) return false
    cerrarSesion()
    return true
  }

  async function enviarCredenciales(e: FormEvent) {
    e.preventDefault()
    setError('')

    const ruta = modo === 'login' ? '/login' : '/registro'
    const respuesta = await fetch(`${API}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const datos = await respuesta.json()

    if (!respuesta.ok) {
      setError(datos.error ?? 'Ocurrió un error')
      return
    }

    localStorage.setItem('token', datos.token)
    localStorage.setItem('email', datos.email)
    setToken(datos.token)
    setEmailSesion(datos.email)
    setEmail('')
    setPassword('')
  }

  async function agregarTarea(e: FormEvent) {
    e.preventDefault()
    const limpio = texto.trim()
    if (limpio === '') return

    const respuesta = await pedir('/tareas', token, {
      method: 'POST',
      body: JSON.stringify({ texto: limpio }),
    })
    if (sesionVencida(respuesta) || !respuesta.ok) return

    const nueva: Tarea = await respuesta.json()
    setTareas([...tareas, nueva])
    setTexto('')
  }

  async function alternarCompletada(id: number) {
    const respuesta = await pedir(`/tareas/${id}`, token, { method: 'PATCH' })
    if (sesionVencida(respuesta) || !respuesta.ok) return

    const actualizada: Tarea = await respuesta.json()
    setTareas(tareas.map((t) => (t.id === id ? actualizada : t)))
  }

  async function eliminarTarea(id: number) {
    const respuesta = await pedir(`/tareas/${id}`, token, { method: 'DELETE' })
    if (sesionVencida(respuesta) || !respuesta.ok) return

    setTareas(tareas.filter((t) => t.id !== id))
  }

  if (!token) {
    return (
      <main>
        <h1>{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>

        <form onSubmit={enviarCredenciales}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña (mínimo 8 caracteres)"
          />
          <button type="submit">
            {modo === 'login' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <button
          onClick={() => {
            setModo(modo === 'login' ? 'registro' : 'login')
            setError('')
          }}
        >
          {modo === 'login'
            ? '¿No tenés cuenta? Registrate'
            : '¿Ya tenés cuenta? Iniciá sesión'}
        </button>
      </main>
    )
  }

  return (
    <main>
      <h1>Lista de Tareas</h1>
      <p>
        Sesión: {emailSesion} <button onClick={cerrarSesion}>Cerrar sesión</button>
      </p>

      <form onSubmit={agregarTarea}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Nueva tarea..."
        />
        <button type="submit">Agregar</button>
      </form>

      <ul>
        {tareas.map((t) => (
          <li key={t.id}>
            <input
              type="checkbox"
              checked={t.completada}
              onChange={() => alternarCompletada(t.id)}
            />
            <span
              style={{
                textDecoration: t.completada ? 'line-through' : 'none',
              }}
            >
              {t.texto}
            </span>
            <button onClick={() => eliminarTarea(t.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App