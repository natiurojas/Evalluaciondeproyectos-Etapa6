export const MATERIAS = [
  { nombre: 'Literatura', color: '#6d4aa8', suave: '#f0ebfa' },
  { nombre: 'Historia', color: '#a35b2a', suave: '#faf0e6' },
  { nombre: 'Geografía', color: '#2f7d6e', suave: '#e7f5f1' },
  { nombre: 'Ciencias Naturales', color: '#2f7d4f', suave: '#e8f5ec' },
  { nombre: 'Matemática', color: '#2b5d8a', suave: '#e8f0f8' },
  { nombre: 'Lengua', color: '#8a4a5e', suave: '#f9ecf1' },
  { nombre: 'Arte', color: '#b0722a', suave: '#fbf1e2' },
  { nombre: 'Tecnología', color: '#3f5c7a', suave: '#eaf0f6' },
  { nombre: 'Filosofía', color: '#6b5a3e', suave: '#f4efe5' },
  { nombre: 'Inglés', color: '#4a6b8a', suave: '#eaf1f7' },
  { nombre: 'Ciudadanía', color: '#7a4f3a', suave: '#f7ede6' },
  { nombre: 'Educación Física', color: '#4f7a3f', suave: '#eef6e8' },
]

export const MATERIAS_NOMBRES = MATERIAS.map((materia) => materia.nombre)

const DEFAULT = { nombre: 'General', color: '#54636d', suave: '#eef1f3' }

export function materiaInfo(nombre) {
  return MATERIAS.find((materia) => materia.nombre === nombre) ?? DEFAULT
}
