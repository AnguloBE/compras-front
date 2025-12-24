# Angostura - Frontend de E-commerce

Aplicación web de e-commerce para servicio de delivery en Angostura, Bolivia. Desarrollada con Next.js 14+, TypeScript, Tailwind CSS y shadcn/ui.

## 🚀 Características

### Para Usuarios
- 🔐 Autenticación por WhatsApp (código de verificación)
- 🛍️ Catálogo de productos con filtros por categoría y tipo
- 🔍 Búsqueda de productos por nombre o marca
- 🛒 Carrito de compras con persistencia local
- 📦 Historial de pedidos
- 💳 Proceso de checkout simplificado
- 📱 Diseño responsive

### Para Administradores
- 📊 Panel de administración completo
- 📦 Gestión de productos (activar/desactivar)
- 🏷️ Gestión de categorías
- 📋 Gestión de pedidos y asignación de repartidores
- 👥 Visualización de usuarios

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16.0.7 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS 4
- **Componentes UI:** shadcn/ui
- **Estado Global:** Zustand
- **Formularios:** React Hook Form + Zod
- **HTTP Client:** Axios
- **Notificaciones:** Sonner

## 📋 Prerequisitos

- Node.js 20+ 
- npm o pnpm
- Backend API corriendo (ver repositorio compras-api)

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd compras-front
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:

Crear archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. Ejecutar en modo desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
compras-front/
├── src/
│   ├── app/                    # Rutas de la aplicación (App Router)
│   │   ├── admin/             # Panel de administración
│   │   │   ├── page.tsx       # Dashboard principal
│   │   │   ├── productos/     # Gestión de productos
│   │   │   ├── categorias/    # Gestión de categorías
│   │   │   ├── pedidos/       # Gestión de pedidos
│   │   │   └── usuarios/      # Gestión de usuarios
│   │   ├── carrito/           # Carrito de compras
│   │   ├── login/             # Autenticación
│   │   ├── productos/         # Detalle de productos
│   │   ├── usuario/           # Área de usuario
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página principal (catálogo)
│   │   └── globals.css        # Estilos globales
│   ├── components/            # Componentes reutilizables
│   │   ├── providers/         # Providers de React
│   │   │   └── AuthProvider.tsx
│   │   └── ui/                # Componentes de shadcn/ui
│   ├── lib/                   # Utilidades
│   │   ├── api.ts            # Cliente Axios configurado
│   │   └── utils.ts          # Funciones auxiliares
│   ├── store/                # Estado global con Zustand
│   │   ├── auth.ts           # Store de autenticación
│   │   └── cart.ts           # Store del carrito
│   └── types/                # Tipos TypeScript
│       └── index.ts          # Tipos compartidos
├── public/                   # Archivos estáticos
├── .env.local               # Variables de entorno (no versionado)
├── components.json          # Configuración shadcn/ui
├── next.config.ts           # Configuración Next.js
├── package.json             # Dependencias
├── tailwind.config.ts       # Configuración Tailwind
└── tsconfig.json            # Configuración TypeScript
```

## 🔐 Autenticación

El sistema utiliza autenticación basada en JWT:

1. Usuario ingresa su número de teléfono
2. Backend envía código de verificación por WhatsApp
3. Usuario ingresa el código
4. Backend valida y retorna token JWT
5. Token se almacena en localStorage
6. Axios interceptor agrega token a todas las peticiones

## 🛣️ Rutas de la Aplicación

### Públicas
- `/` - Catálogo de productos
- `/login` - Inicio de sesión
- `/productos/[id]` - Detalle de producto

### Autenticadas
- `/carrito` - Carrito de compras
- `/usuario` - Perfil y historial de pedidos

### Solo Administradores
- `/admin` - Dashboard administrativo
- `/admin/productos` - Gestión de productos
- `/admin/categorias` - Gestión de categorías
- `/admin/pedidos` - Gestión de pedidos
- `/admin/usuarios` - Gestión de usuarios

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint
```

## 🎨 Personalización de Temas

El proyecto utiliza Tailwind CSS 4 y shadcn/ui. Para personalizar colores y estilos, editar:

- `src/app/globals.css` - Variables CSS para temas
- `tailwind.config.ts` - Configuración de Tailwind

## 🔄 Estado Global

### Auth Store (`src/store/auth.ts`)
- Gestiona usuario autenticado
- Maneja token JWT
- Funciones: login, logout, checkAuth

### Cart Store (`src/store/cart.ts`)
- Gestiona items del carrito
- Persistencia en localStorage
- Funciones: addItem, removeItem, updateQuantity, clearCart

## 🚧 Próximas Características

- [ ] Imágenes de productos
- [ ] Modo oscuro
- [ ] Notificaciones push
- [ ] Chat con repartidor
- [ ] Valoración de productos
- [ ] Cupones de descuento
- [ ] Múltiples direcciones de entrega

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto es privado y confidencial.

## 👥 Equipo

Desarrollado para el servicio de delivery de Angostura, Bolivia.

---

**Nota:** Este es el frontend de la aplicación. Requiere el backend (compras-api) corriendo para funcionar correctamente.
