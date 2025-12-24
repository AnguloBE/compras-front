export enum RolUsuario {
  ADMIN = 'ADMIN',
  USUARIO = 'USUARIO',
  REPARTIDOR = 'REPARTIDOR',
}

export enum EstadoPedido {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  EN_PREPARACION = 'EN_PREPARACION',
  EN_CAMINO = 'EN_CAMINO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export enum UnidadMedida {
  L = 'L',
  ML = 'ML',
  KG = 'KG',
  GR = 'GR',
  PZ = 'PZ',
  MTR = 'MTR',
}

export enum DiaSemana {
  LUNES = 'LUNES',
  MARTES = 'MARTES',
  MIERCOLES = 'MIERCOLES',
  JUEVES = 'JUEVES',
  VIERNES = 'VIERNES',
  SABADO = 'SABADO',
  DOMINGO = 'DOMINGO',
}

export interface Usuario {
  id: string;
  nombre: string;
  telefono: string;
  rol: RolUsuario;
  fechaNacimiento?: string;
  createdAt: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  _count?: {
    productos: number;
  };
}

export interface Producto {
  id: string;
  nombre: string;
  codigoBarras?: string;
  marca?: string;
  contenido?: string;
  medida?: UnidadMedida;
  descripcion?: string;
  precioCompra: string | number;
  precioVenta: string | number;
  stock: string | number;
  imagen?: string;
  permiteEncargo: boolean;
  activo: boolean;
  categoriaId: string;
  categoria?: Categoria;
}

export interface DetallePedido {
  id: string;
  cantidad: string | number;
  precioUnitario: string | number;
  subtotal: string | number;
  producto: Producto;
}

export interface Pedido {
  id: string;
  usuarioId: string;
  usuario: {
    id: string;
    nombre: string;
    telefono: string;
  };
  repartidor?: {
    id: string;
    nombre: string;
    telefono: string;
  };
  estado: EstadoPedido;
  subtotal: string | number;
  costoEnvio: string | number;
  total: string | number;
  fechaEncargo?: string;
  notas?: string;
  fechaEntrega?: string;
  createdAt: string;
  detalles: DetallePedido[];
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

export interface HorarioAtencion {
  id: string;
  dia: DiaSemana;
  horaApertura: string;
  horaCierre: string;
  cerrado: boolean;
  activo: boolean;
}
