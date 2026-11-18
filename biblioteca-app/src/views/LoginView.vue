<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Eye,
  EyeOff,
  GraduationCap,
  Library,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next'
import BrandMark from '@/components/BrandMark.vue'
import { CUENTAS_DEMO } from '@/data/usuarios'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const correo = ref('')
const clave = ref('')
const mostrarClave = ref(false)
const error = ref('')

const anio = new Date().getFullYear()

const iconosDemo = {
  'Administrador/a': ShieldCheck,
  'Bibliotecario/a': Library,
  Estudiante: GraduationCap,
  Docente: UserRound,
}

const destino = computed(() => {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('/ingresar')) {
    return redirect
  }
  return auth.homeRoute
})

function ingresar() {
  error.value = ''
  if (!correo.value.trim() || !clave.value) {
    error.value = 'Completá el correo y la contraseña.'
    return
  }

  const resultado = auth.login(correo.value, clave.value)
  if (!resultado.ok) {
    error.value = resultado.error
    return
  }

  ui.success(`Bienvenido/a, ${resultado.usuario.nombre}.`)
  router.push(destino.value)
}

function accesoDemo(cuenta) {
  correo.value = cuenta.correo
  clave.value = cuenta.clave
  ingresar()
}
</script>

<template>
  <div class="login">
    <section class="login__hero">
      <div class="login__brand">
        <BrandMark :size="44" />
        <div>
          <strong>Biblioteca Escolar</strong>
          <span>Precooperativa</span>
        </div>
      </div>

      <div class="login__hero-content">
        <p class="login__eyebrow">Etapa 6 · Primera versión</p>
        <h1>La biblioteca,<br />ordenada y al día.</h1>
        <p class="login__lead">
          Catálogo, préstamos y devoluciones en un solo lugar. Sepamos siempre qué libro tiene
          cada persona y cuándo debe volver.
        </p>

        <ul class="login__features">
          <li>
            <span><BookOpen /></span>
            Catálogo con búsqueda y disponibilidad en tiempo real.
          </li>
          <li>
            <span><CalendarDays /></span>
            Vencimientos claros y panel de préstamos atrasados.
          </li>
          <li>
            <span><Library /></span>
            Circulación simple para el personal de la biblioteca.
          </li>
        </ul>
      </div>

      <p class="login__footer">
        Proyecto de digitalización y gestión de préstamos · {{ anio }}
      </p>
    </section>

    <section class="login__panel">
      <div class="login__card">
        <header class="login__header">
          <p class="eyebrow">Acceso al sistema</p>
          <h2>Iniciar sesión</h2>
          <p>Ingresá con la cuenta que te entregó la biblioteca.</p>
        </header>

        <form class="login__form" @submit.prevent="ingresar">
          <div class="field">
            <label class="field__label" for="login-correo">Correo</label>
            <div class="login__input">
              <Mail />
              <input
                id="login-correo"
                v-model="correo"
                class="input"
                type="email"
                placeholder="usuario@escuela.edu.ar"
                autocomplete="username"
                autofocus
              />
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="login-clave">Contraseña</label>
            <div class="login__input">
              <Lock />
              <input
                id="login-clave"
                v-model="clave"
                class="input"
                :type="mostrarClave ? 'text' : 'password'"
                placeholder="Tu contraseña"
                autocomplete="current-password"
              />
              <button
                class="login__eye"
                type="button"
                :aria-label="mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="mostrarClave = !mostrarClave"
              >
                <EyeOff v-if="mostrarClave" />
                <Eye v-else />
              </button>
            </div>
          </div>

          <p v-if="error" class="form-error">
            <AlertCircle />
            {{ error }}
          </p>

          <button class="btn btn--primary btn--block login__submit" type="submit">
            Ingresar
            <ArrowRight />
          </button>

          <p class="login__help">
            ¿Olvidaste tu contraseña? El personal de la biblioteca puede restablecerla.
          </p>
        </form>

        <div class="login__demo">
          <div class="login__demo-title">
            <span>Cuentas de demostración</span>
            <span class="login__line" />
          </div>
          <div class="login__demo-grid">
            <button
              v-for="cuenta in CUENTAS_DEMO"
              :key="cuenta.correo"
              class="demo-card"
              type="button"
              @click="accesoDemo(cuenta)"
            >
              <span class="demo-card__icon">
                <component :is="iconosDemo[cuenta.rol] || UserRound" />
              </span>
              <span class="demo-card__text">
                <strong>{{ cuenta.rol }}</strong>
                <small>{{ cuenta.correo }}</small>
              </span>
              <ArrowRight class="demo-card__arrow" />
            </button>
          </div>
          <p class="login__note">
            Prototipo académico: los datos son de ejemplo y se guardan solo en este navegador.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login {
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
}

.login__hero {
  display: flex;
  flex-direction: column;
  padding: 38px 48px 30px;
  background:
    radial-gradient(circle at 82% 12%, rgba(197, 138, 50, 0.22), transparent 40%),
    radial-gradient(circle at 10% 90%, rgba(43, 100, 145, 0.35), transparent 46%),
    linear-gradient(160deg, var(--navy-800) 0%, var(--navy-950) 100%);
  color: #eef2f5;
  overflow: hidden;
  position: relative;
}

.login__hero::after {
  content: '';
  position: absolute;
  inset: auto -120px -160px auto;
  width: 420px;
  height: 420px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  box-shadow: 0 0 0 60px rgba(255, 255, 255, 0.025), 0 0 0 120px rgba(255, 255, 255, 0.02);
}

.login__brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.login__brand strong {
  display: block;
  font-family: var(--font-serif);
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
}

.login__brand span {
  display: block;
  font-size: 0.66rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(238, 242, 245, 0.55);
}

.login__hero-content {
  max-width: 520px;
  margin: auto 0;
  padding: 48px 0;
  position: relative;
  z-index: 1;
}

.login__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  color: #e7bb72;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.login__eyebrow::before {
  content: '';
  width: 24px;
  height: 1px;
  background: currentColor;
}

.login__hero h1 {
  color: #fff;
  font-size: clamp(2.4rem, 1.4rem + 2.6vw, 3.6rem);
  font-weight: 500;
  line-height: 1.06;
}

.login__lead {
  max-width: 440px;
  margin-top: 20px;
  color: rgba(238, 242, 245, 0.72);
  font-size: 0.95rem;
  line-height: 1.65;
}

.login__features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 30px 0 0;
  padding: 0;
  list-style: none;
}

.login__features li {
  display: flex;
  align-items: center;
  gap: 11px;
  color: rgba(238, 242, 245, 0.82);
  font-size: 0.83rem;
}

.login__features li span {
  display: grid;
  width: 32px;
  height: 32px;
  flex: none;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.06);
  color: #e7bb72;
}

.login__features svg {
  width: 15px;
  height: 15px;
}

.login__footer {
  color: rgba(238, 242, 245, 0.35);
  font-size: 0.68rem;
  letter-spacing: 0.02em;
}

.login__panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  background:
    radial-gradient(circle at 100% 0%, rgba(197, 138, 50, 0.1), transparent 40%),
    var(--cream);
}

.login__card {
  width: min(460px, 100%);
}

.login__header {
  margin-bottom: 24px;
}

.login__header h2 {
  margin-top: 6px;
  font-size: 1.9rem;
}

.login__header p:last-child {
  margin-top: 6px;
  color: var(--muted);
  font-size: 0.86rem;
}

.login__input {
  position: relative;
}

.login__input > svg {
  position: absolute;
  top: 50%;
  left: 13px;
  width: 16px;
  height: 16px;
  color: var(--muted-light);
  transform: translateY(-50%);
  pointer-events: none;
}

.login__input .input {
  padding-right: 42px;
  padding-left: 39px;
  background: #fff;
}

.login__eye {
  position: absolute;
  top: 50%;
  right: 7px;
  display: grid;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transform: translateY(-50%);
}

.login__eye:hover {
  background: #f1ede4;
}

.login__eye svg {
  width: 15px;
  height: 15px;
}

.login__submit {
  margin-top: 18px;
  min-height: 44px;
}

.login__help {
  margin-top: 10px;
  color: var(--muted);
  font-size: 0.73rem;
  text-align: center;
}

.login__demo {
  margin-top: 30px;
  padding-top: 22px;
  border-top: 1px solid var(--line-strong);
}

.login__demo-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--muted);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.login__line {
  flex: 1;
  height: 1px;
  background: var(--line);
}

.login__demo-grid {
  display: grid;
  gap: 7px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.demo-card {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--paper);
  color: var(--ink-soft);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease, transform 0.12s ease;
}

.demo-card:hover {
  border-color: var(--navy-600);
  background: #fff;
  transform: translateY(-1px);
}

.demo-card__icon {
  display: grid;
  width: 28px;
  height: 28px;
  flex: none;
  place-items: center;
  border-radius: 7px;
  background: var(--navy-50);
  color: var(--navy-700);
}

.demo-card__icon svg {
  width: 14px;
  height: 14px;
}

.demo-card__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}

.demo-card__text strong {
  font-size: 0.74rem;
  font-weight: 600;
}

.demo-card__text small {
  overflow: hidden;
  color: var(--muted);
  font-size: 0.62rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-card__arrow {
  width: 13px;
  height: 13px;
  flex: none;
  margin-left: auto;
  color: var(--muted-light);
}

.login__note {
  margin-top: 12px;
  color: var(--muted-light);
  font-size: 0.64rem;
  line-height: 1.5;
}

@media (max-width: 960px) {
  .login {
    grid-template-columns: 1fr;
  }

  .login__hero {
    padding: 26px 26px 30px;
  }

  .login__hero-content {
    margin: 0;
    padding: 34px 0 10px;
  }

  .login__features,
  .login__footer {
    display: none;
  }

  .login__panel {
    padding: 28px 22px 40px;
  }

  .login__card {
    width: min(520px, 100%);
  }
}

@media (max-width: 520px) {
  .login__demo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
