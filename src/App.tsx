import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type Tarea = {
  id: number
  texto: string
  completada: boolean
}

const API = 'http://localhost:3001/api/tareas'

function App() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [texto, setTexto] = useState('')
    useEffect(() => {
    fetch(API)
      .then((respuesta) => respuesta.json())
      .then((datos) => setTareas(datos))
  }, [])

  async function agregarTarea(e: FormEvent) {
    e.preventDefault()
    const limpio = texto.trim()
    if (limpio === '') return

    const respuesta = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: limpio }),
    })
    if (!respuesta.ok) return

    const nueva: Tarea = await respuesta.json()
    setTareas([...tareas, nueva])
    setTexto('')
  }

    async function alternarCompletada(id: number) {
    console.log('Click en check, id:', id)
    const respuesta = await fetch(`${API}/${id}`, { method: 'PATCH' })
    if (!respuesta.ok) return

    const actualizada: Tarea = await respuesta.json()
    setTareas(tareas.map((t) => (t.id === id ? actualizada : t)))
  }

  async function eliminarTarea(id: number) {
    console.log('Click en eliminar, id:', id)
    const respuesta = await fetch(`${API}/${id}`, { method: 'DELETE' })
    if (!respuesta.ok) return

    setTareas(tareas.filter((t) => t.id !== id))
  }

  return (
    <main>
      <h1>Lista de Tareas</h1>

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