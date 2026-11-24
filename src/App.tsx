import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type Tarea = {
  id: number
  texto: string
  completada: boolean
}

type Modo = 'login' | 'registro' | 'verificar'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

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
  const [codigo, setCodigo] = useState('')
  const [modo, setModo] = useState<Modo>('login')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

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

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo)
    setError('')
    setMensaje('')
  }

  function iniciarSesion(datos: { token: string; email: string }) {
    localStorage.setItem('token', datos.token)
    localStorage.setItem('email', datos.email)
    setToken(datos.token)
    setEmailSesion(datos.email)
    setEmail('')
    setPassword('')
    setCodigo('')
    setError('')
    setMensaje('')
  }

  function cerrarSesion() {
    limpiarSesion()
    setToken(null)
    setEmailSesion(null)
    setTareas([])
    setModo('login')
  }

  function sesionVencida(respuesta: Response) {
    if (respuesta.status !== 401) return false
    cerrarSesion()
    return true
  }

  async function enviarCredenciales(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMensaje('')

    const ruta = modo === 'login' ? '/login' : '/registro'
    const respuesta = await fetch(`${API}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const datos = await respuesta.json()

    if (
      modo === 'login' &&
      respuesta.status === 403 &&
      datos.requiereVerificacion
    ) {
      setPassword('')
      setModo('verificar')
      setMensaje(
        'Tu cuenta todavía no está verificada. Ingresá el código que te enviamos o pedí uno nuevo.'
      )
      return
    }

    if (!respuesta.ok) {
      setError(datos.error ?? 'Ocurrió un error')
      return
    }

    if (modo === 'login') {
      iniciarSesion(datos)
      return
    }

    setPassword('')
    setModo('verificar')
    setMensaje(`${datos.mensaje}. Revisá la casilla de ${datos.email}.`)
  }

  async function verificarCodigo(e: FormEvent) {
    e.preventDefault()
    setError('')

    const respuesta = await fetch(`${API}/verificar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, codigo }),
    })
    const datos = await respuesta.json()

    if (!respuesta.ok) {
      setError(datos.error ?? 'Ocurrió un error')
      return
    }

    iniciarSesion(datos)
  }

  async function reenviarCodigo() {
    setError('')

    const respuesta = await fetch(`${API}/reenviar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const datos = await respuesta.json()
    setMensaje(datos.mensaje ?? '')
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
    const tarea = tareas.find((t) => t.id === id)
    if (!tarea) return
    const nuevoValor = !tarea.completada
    const anteriores = tareas

    setTareas(
      tareas.map((t) => (t.id === id ? { ...t, completada: nuevoValor } : t))
    )

    const respuesta = await pedir(`/tareas/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ completada: nuevoValor }),
    })
    if (sesionVencida(respuesta)) return
    if (!respuesta.ok) setTareas(anteriores)
  }

  async function eliminarTarea(id: number) {
    const anteriores = tareas
    setTareas(tareas.filter((t) => t.id !== id))

    const respuesta = await pedir(`/tareas/${id}`, token, { method: 'DELETE' })
    if (sesionVencida(respuesta)) return
    if (!respuesta.ok) setTareas(anteriores)
  }

  if (!token && modo === 'verificar') {
    return (
      <main className="tarjeta">
        <h1>Verificá tu correo</h1>
        <p className="subtitulo">
          Ingresá el código de 6 dígitos que te enviamos a {email}.
        </p>

        {mensaje && <p className="mensaje">{mensaje}</p>}

        <form className="formulario vertical" onSubmit={verificarCodigo}>
          <input
            value={codigo}
            inputMode="numeric"
            maxLength={6}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
            placeholder="Código de 6 dígitos"
          />
          <button
            className="primario"
            type="submit"
            disabled={codigo.length !== 6}
          >
            Verificar
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <button className="enlace" onClick={reenviarCodigo}>
          Reenviar código
        </button>
        <button className="enlace" onClick={() => cambiarModo('login')}>
          Volver a iniciar sesión
        </button>
      </main>
    )
  }

  if (!token) {
    return (
      <main className="tarjeta">
        <h1>{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
        <p className="subtitulo">
          {modo === 'login'
            ? 'Entrá para ver tus tareas.'
            : 'Registrate para guardar tus tareas.'}
        </p>

        <form className="formulario vertical" onSubmit={enviarCredenciales}>
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
          <button className="primario" type="submit">
            {modo === 'login' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <button
          className="enlace"
          onClick={() => cambiarModo(modo === 'login' ? 'registro' : 'login')}
        >
          {modo === 'login'
            ? '¿No tenés cuenta? Registrate'
            : '¿Ya tenés cuenta? Iniciá sesión'}
        </button>
      </main>
    )
  }

  const pendientes = tareas.filter((t) => !t.completada).length

  return (
    <main className="tarjeta">
      <div className="barra-sesion">
        <span>{emailSesion}</span>
        <button className="secundario" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>

      <h1>Lista de Tareas</h1>
      <p className="subtitulo">
        {tareas.length === 0
          ? 'Todavía no hay tareas. ¡Agregá la primera!'
          : `${pendientes} pendientes de ${tareas.length}`}
      </p>

      <form className="formulario" onSubmit={agregarTarea}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Nueva tarea..."
        />
        <button className="primario" type="submit">
          Agregar
        </button>
      </form>

      <ul className="lista">
        {tareas.map((t) => (
          <li key={t.id} className={t.completada ? 'tarea completada' : 'tarea'}>
            <input
              type="checkbox"
              checked={t.completada}
              onChange={() => alternarCompletada(t.id)}
            />
            <span>{t.texto}</span>
            <button className="peligro" onClick={() => eliminarTarea(t.id)}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App