<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { AlertCircle, Info, Save } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  usuario: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const users = useUsersStore()
const auth = useAuthStore()
const ui = useUiStore()

const esEdicion = computed(() => Boolean(props.usuario?.id))
const esPropiaCuenta = computed(() => props.usuario?.id === auth.currentUser?.id)

const form = reactive({
  nombre: '',
  correo: '',
  rol: 'usuario',
  tipo: 'Estudiante',
  curso: '',
  identificacion: '',
  clave: '',
})
const errores = reactive({})

const cursosSugeridos = computed(() => users.cursos)

function limpiarErrores() {
  Object.keys(errores).forEach((clave) => delete errores[clave])
}

function cargarFormulario() {
  const usuario = props.usuario
  Object.assign(form, {
    nombre: usuario?.nombre ?? '',
    correo: usuario?.correo ?? '',
    rol: usuario?.rol ?? 'usuario',
    tipo: usuario?.tipo === 'Docente' ? 'Docente' : 'Estudiante',
    curso: usuario?.curso ?? '',
    identificacion: usuario?.identificacion ?? '',
    clave: '',
  })
  limpiarErrores()
}

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) cargarFormulario()
  },
  { immediate: true },
)

watch(
  () => props.usuario,
  () => {
    if (props.modelValue) cargarFormulario()
  },
)

watch(
  () => form.rol,
  (rol) => {
    if (rol !== 'usuario') form.curso = ''
  },
)

function validar() {
  limpiarErrores()
  if (!form.nombre.trim()) errores.nombre = 'Ingresá el nombre completo.'
  if (!form.correo.trim()) {
    errores.correo = 'Ingresá el correo.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) {
    errores.correo = 'El correo no tiene un formato válido.'
  } else if (users.existeCorreo(form.correo, props.usuario?.id)) {
    errores.correo = 'Ya existe un usuario con ese correo.'
  }

  if (!form.rol) errores.rol = 'Seleccioná un rol.'
  if (form.rol === 'usuario' && form.tipo === 'Estudiante' && !form.curso.trim()) {
    errores.curso = 'Indicá el curso del estudiante.'
  }

  if (!esEdicion.value && form.clave && form.clave.length < 6) {
    errores.clave = 'La contraseña inicial debe tener al menos 6 caracteres.'
  }
  if (esEdicion.value && form.clave && form.clave.length < 6) {
    errores.clave = 'La nueva contraseña debe tener al menos 6 caracteres.'
  }

  return Object.keys(errores).length === 0
}

function guardar() {
  if (!validar()) return

  const payload = {
    nombre: form.nombre,
    correo: form.correo,
    rol: form.rol,
    tipo: form.rol === 'usuario' ? form.tipo : '',
    curso: form.curso,
    identificacion: form.identificacion,
    clave: form.clave || undefined,
  }

  if (esPropiaCuenta.value && props.usuario) {
    payload.rol = props.usuario.rol
    payload.tipo = props.usuario.tipo
  }

  if (esEdicion.value) {
    users.actualizar(props.usuario.id, payload)
    ui.success('Los datos del usuario se actualizaron.')
  } else {
    users.crear({ ...payload, clave: form.clave || 'biblioteca123' })
    ui.success('La cuenta se creó correctamente.')
  }

  emit('saved')
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="esEdicion ? 'Editar usuario' : 'Nuevo usuario'"
    :subtitle="
      esEdicion
        ? 'Modificá los datos de la cuenta. La baja es lógica para conservar el historial.'
        : 'Las cuentas las crea el personal de la biblioteca. No hay autorregistro.'
    "
    size="wide"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form id="form-usuario" @submit.prevent="guardar">
      <div class="form-grid">
        <div class="field field--full">
          <label class="field__label" for="usuario-nombre">
            Nombre completo <span class="req">*</span>
          </label>
          <input
            id="usuario-nombre"
            v-model="form.nombre"
            class="input"
            type="text"
            autocomplete="off"
            placeholder="Nombre y apellido"
          />
          <p v-if="errores.nombre" class="field__error">{{ errores.nombre }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="usuario-correo">
            Correo <span class="req">*</span>
          </label>
          <input
            id="usuario-correo"
            v-model="form.correo"
            class="input"
            type="email"
            autocomplete="off"
            placeholder="usuario@escuela.edu.ar"
          />
          <p v-if="errores.correo" class="field__error">{{ errores.correo }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="usuario-identificacion">Identificación</label>
          <input
            id="usuario-identificacion"
            v-model="form.identificacion"
            class="input"
            type="text"
            placeholder="Ej.: EST-1042"
          />
        </div>

        <div class="field">
          <label class="field__label" for="usuario-rol">
            Rol <span class="req">*</span>
          </label>
          <select
            id="usuario-rol"
            v-model="form.rol"
            class="select"
            :disabled="esPropiaCuenta"
          >
            <option value="usuario">Usuario (estudiante o docente)</option>
            <option value="bibliotecario">Bibliotecario/a</option>
            <option value="administrador">Administrador/a</option>
          </select>
          <p v-if="esPropiaCuenta" class="field__hint">
            No podés cambiar tu propio rol desde esta pantalla.
          </p>
          <p v-if="errores.rol" class="field__error">{{ errores.rol }}</p>
        </div>

        <template v-if="form.rol === 'usuario'">
          <div class="field">
            <label class="field__label" for="usuario-tipo">Tipo de usuario</label>
            <select id="usuario-tipo" v-model="form.tipo" class="select">
              <option value="Estudiante">Estudiante</option>
              <option value="Docente">Docente</option>
            </select>
          </div>

          <div class="field">
            <label class="field__label" for="usuario-curso">
              Curso o área
              <span v-if="form.tipo === 'Estudiante'" class="req">*</span>
            </label>
            <input
              id="usuario-curso"
              v-model="form.curso"
              class="input"
              type="text"
              list="cursos-sugeridos"
              placeholder="Ej.: 3° A"
            />
            <datalist id="cursos-sugeridos">
              <option v-for="curso in cursosSugeridos" :key="curso" :value="curso" />
            </datalist>
            <p v-if="errores.curso" class="field__error">{{ errores.curso }}</p>
          </div>
        </template>

        <div class="field field--full">
          <label class="field__label" for="usuario-clave">
            {{ esEdicion ? 'Nueva contraseña (opcional)' : 'Contraseña inicial' }}
          </label>
          <input
            id="usuario-clave"
            v-model="form.clave"
            class="input"
            type="password"
            autocomplete="new-password"
            :placeholder="esEdicion ? 'Dejar vacío para conservar la actual' : 'biblioteca123'"
          />
          <p class="field__hint">
            Mínimo 6 caracteres. Si no se indica, se usa la clave temporal
            <strong>biblioteca123</strong>.
          </p>
          <p v-if="errores.clave" class="field__error">{{ errores.clave }}</p>
        </div>
      </div>

      <p class="inline-note" style="margin-top: 16px">
        <Info />
        En producción las contraseñas deben guardarse cifradas. Este prototipo usa datos locales
        de demostración.
      </p>

      <p v-if="errores.general" class="form-error">
        <AlertCircle />
        {{ errores.general }}
      </p>
    </form>

    <template #footer>
      <button class="btn btn--ghost" type="button" @click="emit('update:modelValue', false)">
        Cancelar
      </button>
      <button class="btn btn--primary" type="submit" form="form-usuario">
        <Save />
        {{ esEdicion ? 'Guardar cambios' : 'Crear cuenta' }}
      </button>
    </template>
  </BaseModal>
</template>
