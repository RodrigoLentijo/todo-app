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

  function agregarTarea(e: FormEvent) {
    e.preventDefault()
    const limpio = texto.trim()
    if (limpio === '') return

    const nueva: Tarea = {
      id: Date.now(),
      texto: limpio,
      completada: false,
    }
    setTareas([...tareas, nueva])
    setTexto('')
  }


  function alternarCompletada(id: number) {
    setTareas(
      tareas.map((t) =>
        t.id === id ? { ...t, completada: !t.completada } : t
      )
    )
  }

  function eliminarTarea(id: number) {
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