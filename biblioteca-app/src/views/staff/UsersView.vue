<script setup>
import { computed, ref } from 'vue'
import {
  Ban,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Upload,
  Users,
} from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import UserFormModal from '@/components/staff/UserFormModal.vue'
import CsvImportModal from '@/components/staff/CsvImportModal.vue'
import { useUsersStore } from '@/stores/users'
import { useLoansStore } from '@/stores/loans'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { downloadCsv, toCsv } from '@/utils/csv'
import { includesText, pluralize } from '@/utils/text'
import { todayISO } from '@/utils/dates'
import { ETIQUETAS_ROL } from '@/data/configuracion'

const users = useUsersStore()
const loans = useLoansStore()
const auth = useAuthStore()
const ui = useUiStore()

const busqueda = ref('')
const rolFiltro = ref('')
const cursoFiltro = ref('')
const estado = ref('activos')

const modalForm = ref(false)
const usuarioEditando = ref(null)
const modalImport = ref(false)
const modalBaja = ref(false)
const usuarioBaja = ref(null)

const columnasImportacion = [
  { key: 'nombre', label: 'Nombre', required: true },
  { key: 'correo', label: 'Correo', required: true, type: 'email' },
  { key: 'rol', label: 'Rol' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'curso', label: 'Curso' },
  { key: 'identificacion', label: 'Identificación' },
  { key: 'clave', label: 'Clave' },
]

const ejemploImportacion = {
  nombre: 'Ana Pérez',
  correo: 'ana.perez@escuela.edu.ar',
  rol: 'usuario',
  tipo: 'Estudiante',
  curso: '2° B',
  identificacion: 'EST-1050',
  clave: 'biblioteca123',
}

const filtrados = computed(() => {
  const texto = busqueda.value.trim()
  return [...users.usuarios]
    .filter((usuario) => {
      if (estado.value === 'activos' && !usuario.activo) return false
      if (estado.value === 'inactivos' && usuario.activo) return false
      if (rolFiltro.value && usuario.rol !== rolFiltro.value) return false
      if (cursoFiltro.value && usuario.curso !== cursoFiltro.value) return false
      if (texto) {
        const contenido = [
          usuario.nombre,
          usuario.correo,
          usuario.identificacion,
          usuario.curso,
          usuario.tipo,
        ].join(' ')
        if (!includesText(contenido, texto)) return false
      }
      return true
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
})

const hayFiltros = computed(
  () =>
    Boolean(busqueda.value.trim()) ||
    Boolean(rolFiltro.value) ||
    Boolean(cursoFiltro.value) ||
    estado.value !== 'activos',
)

function limpiarFiltros() {
  busqueda.value = ''
  rolFiltro.value = ''
  cursoFiltro.value = ''
  estado.value = 'activos'
}

function abrirNuevo() {
  usuarioEditando.value = null
  modalForm.value = true
}

function abrirEdicion(usuario) {
  usuarioEditando.value = usuario
  modalForm.value = true
}

function pedirBaja(usuario) {
  if (usuario.id === auth.currentUser?.id) {
    ui.error('No podés dar de baja tu propia cuenta.')
    return
  }
  if (loans.activosDeUsuario(usuario.id).length > 0) {
    ui.error('El usuario tiene préstamos activos. Registrá las devoluciones antes de darlo de baja.')
    return
  }
  usuarioBaja.value = usuario
  modalBaja.value = true
}

function confirmarBaja() {
  if (!usuarioBaja.value) return
  users.baja(usuarioBaja.value.id)
  ui.success(`Se dio de baja la cuenta de ${usuarioBaja.value.nombre}.`)
  usuarioBaja.value = null
}

function reactivar(usuario) {
  users.reactivar(usuario.id)
  ui.success(`Se reactivó la cuenta de ${usuario.nombre}.`)
}

function importar(filas) {
  const resumen = users.importar(filas)
  if (resumen.creados) {
    ui.success(`Se importaron ${pluralize(resumen.creados, 'usuario', 'usuarios')}.`)
  }
  if (resumen.omitidos) {
    ui.info(
      `${pluralize(resumen.omitidos, 'cuenta omitida', 'cuentas omitidas')} por correo duplicado.`,
    )
  }
  if (resumen.errores.length) {
    ui.error(
      `${pluralize(resumen.errores.length, 'fila con error', 'filas con error')}. ${resumen.errores[0]}`,
    )
  }
}

function exportar() {
  const filas = filtrados.value.map((usuario) => ({
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: ETIQUETAS_ROL[usuario.rol] || usuario.rol,
    tipo: usuario.tipo,
    curso: usuario.curso,
    identificacion: usuario.identificacion,
    estado: usuario.activo ? 'Activo' : 'Inactivo',
    prestamosActivos: loans.activosDeUsuario(usuario.id).length,
  }))

  const contenido = toCsv(filas, [
    { key: 'nombre', label: 'Nombre' },
    { key: 'correo', label: 'Correo' },
    { key: 'rol', label: 'Rol' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'curso', label: 'Curso' },
    { key: 'identificacion', label: 'Identificación' },
    { key: 'estado', label: 'Estado' },
    { key: 'prestamosActivos', label: 'Préstamos activos' },
  ])

  downloadCsv(`usuarios-${todayISO()}.csv`, contenido)
  ui.success('Se descargó la lista de usuarios en CSV.')
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="page-header__title">
        <p class="eyebrow">Comunidad</p>
        <h1>Gestión de usuarios</h1>
        <p>
          Las cuentas las crea el personal de la biblioteca. Cada rol accede solo a las funciones
          que le corresponden y las bajas conservan el historial.
        </p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--ghost" type="button" @click="modalImport = true">
          <Upload />
          Importar CSV
        </button>
        <button class="btn btn--ghost" type="button" @click="exportar">
          <Download />
          Exportar
        </button>
        <button class="btn btn--primary" type="button" @click="abrirNuevo">
          <Plus />
          Nuevo usuario
        </button>
      </div>
    </header>

    <div class="users-summary">
      <span class="chip">{{ users.activos.length }} cuentas activas</span>
      <span class="chip">{{ users.estudiantes.length }} estudiantes</span>
      <span class="chip">{{ users.docentes.length }} docentes</span>
      <span class="chip">
        {{ users.usuarios.filter((u) => u.rol === 'bibliotecario' && u.activo).length }}
        bibliotecarios/as
      </span>
    </div>

    <div class="toolbar">
      <div class="toolbar__search">
        <Search />
        <input
          v-model="busqueda"
          class="input"
          type="search"
          placeholder="Buscar por nombre, correo, curso o identificación…"
          aria-label="Buscar usuarios"
        />
      </div>

      <select v-model="rolFiltro" class="select toolbar__select" aria-label="Filtrar por rol">
        <option value="">Todos los roles</option>
        <option value="usuario">Usuarios</option>
        <option value="bibliotecario">Bibliotecarios/as</option>
        <option value="administrador">Administradores/as</option>
      </select>

      <select v-model="cursoFiltro" class="select toolbar__select" aria-label="Filtrar por curso">
        <option value="">Todos los cursos</option>
        <option v-for="curso in users.cursos" :key="curso" :value="curso">{{ curso }}</option>
      </select>

      <select v-model="estado" class="select toolbar__select" aria-label="Filtrar por estado">
        <option value="activos">Solo activos</option>
        <option value="inactivos">Solo dados de baja</option>
        <option value="todos">Todos</option>
      </select>

      <button v-if="hayFiltros" class="btn btn--quiet btn--sm" type="button" @click="limpiarFiltros">
        <RotateCcw />
        Limpiar
      </button>
    </div>

    <p class="result-count">{{ pluralize(filtrados.length, 'cuenta', 'cuentas') }}</p>

    <div v-if="filtrados.length" class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Tipo / curso</th>
            <th>Identificación</th>
            <th class="num">Préstamos activos</th>
            <th>Estado</th>
            <th class="num">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="usuario in filtrados" :key="usuario.id">
            <td>
              <div class="cell-title">
                <strong>{{ usuario.nombre }}</strong>
                <span>{{ usuario.correo }}</span>
              </div>
            </td>
            <td>
              <span
                class="badge"
                :class="{
                  'badge--purple': usuario.rol === 'administrador',
                  'badge--blue': usuario.rol === 'bibliotecario',
                  'badge--gray': usuario.rol === 'usuario',
                }"
              >
                {{ ETIQUETAS_ROL[usuario.rol] }}
              </span>
            </td>
            <td>
              <div class="cell-title">
                <strong>{{ usuario.tipo || '—' }}</strong>
                <span>{{ usuario.curso || 'Sin curso' }}</span>
              </div>
            </td>
            <td class="nowrap muted">{{ usuario.identificacion || '—' }}</td>
            <td class="num">
              <span
                class="badge"
                :class="
                  loans.activosDeUsuario(usuario.id).length
                    ? 'badge--blue'
                    : 'badge--gray badge--plain'
                "
              >
                {{ loans.activosDeUsuario(usuario.id).length }}
              </span>
            </td>
            <td>
              <span class="badge" :class="usuario.activo ? 'badge--green' : 'badge--gray'">
                {{ usuario.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <div class="cell-actions">
                <button
                  class="btn btn--quiet btn--sm"
                  type="button"
                  title="Editar usuario"
                  @click="abrirEdicion(usuario)"
                >
                  <Pencil />
                  Editar
                </button>
                <button
                  v-if="usuario.activo && auth.can('usuarios:eliminar')"
                  class="btn btn--quiet btn--sm"
                  type="button"
                  title="Dar de baja"
                  @click="pedirBaja(usuario)"
                >
                  <Ban />
                  Baja
                </button>
                <button
                  v-if="!usuario.activo && auth.can('usuarios:eliminar')"
                  class="btn btn--quiet btn--sm"
                  type="button"
                  title="Reactivar cuenta"
                  @click="reactivar(usuario)"
                >
                  <RotateCcw />
                  Activar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <EmptyState
      v-else
      :icon="Users"
      title="No hay usuarios con esos filtros"
      message="Probá limpiar la búsqueda o creá una cuenta nueva para incorporar a la comunidad."
    >
      <button v-if="hayFiltros" class="btn btn--ghost" type="button" @click="limpiarFiltros">
        <RotateCcw />
        Limpiar filtros
      </button>
      <button class="btn btn--primary" type="button" @click="abrirNuevo">
        <Plus />
        Nuevo usuario
      </button>
    </EmptyState>

    <UserFormModal v-model="modalForm" :usuario="usuarioEditando" />
    <CsvImportModal
      v-model="modalImport"
      tipo="usuarios"
      titulo="Importar usuarios desde CSV"
      descripcion="Cargá cursos completos o cuentas del personal. Si no se indica una clave, se asigna la clave temporal biblioteca123."
      :columnas="columnasImportacion"
      :ejemplo="ejemploImportacion"
      @importar="importar"
    />
    <ConfirmDialog
      v-model="modalBaja"
      title="Dar de baja la cuenta"
      :message="`${usuarioBaja?.nombre || 'El usuario'} no podrá iniciar sesión. El historial de préstamos se conserva y la cuenta puede reactivarse.`"
      confirm-label="Dar de baja"
      @confirm="confirmarBaja"
    />
  </div>
</template>

<style scoped>
.users-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 14px;
}

.result-count {
  margin: 14px 2px 10px;
  color: var(--muted);
  font-size: 0.78rem;
}
</style>
