import { useState, type FormEvent } from 'react'
import './App.css'

type Tarea = {
  id: number
  texto: string
  completada: boolean
}

function App() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [texto, setTexto] = useState('')

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

  return (
    <main>
      <h1>Mi lista de tareas</h1>

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
          <li key={t.id}>{t.texto}</li>
        ))}
      </ul>
    </main>
  )
}

export default App