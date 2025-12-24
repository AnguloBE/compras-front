'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import api from '@/lib/api';
import { Producto, Categoria, RolUsuario, DiaSemana, HorarioAtencion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, User, LogOut, Package, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { addItem, getItemCount } = useCartStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [horarioHoy, setHorarioHoy] = useState<HorarioAtencion | null>(null);
  const [dentroDeHorario, setDentroDeHorario] = useState<boolean>(true);

  useEffect(() => {
    fetchData();
    cargarHorario();
  }, []);

  useEffect(() => {
    filterProductos();
  }, [searchTerm, selectedCategoria, productos]);

  const fetchData = async () => {
    try {
      const [productosRes, categoriasRes] = await Promise.all([
        api.get('/productos'),
        api.get('/categorias'),
      ]);
      setProductos(productosRes.data);
      setCategorias(categoriasRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const diasSemanaMap: Record<number, DiaSemana> = {
    0: DiaSemana.DOMINGO,
    1: DiaSemana.LUNES,
    2: DiaSemana.MARTES,
    3: DiaSemana.MIERCOLES,
    4: DiaSemana.JUEVES,
    5: DiaSemana.VIERNES,
    6: DiaSemana.SABADO,
  };

  const cargarHorario = async () => {
    try {
      const response = await api.get('/horarios');
      const horarios = response.data;
      
      const ahora = new Date();
      const diaActual = diasSemanaMap[ahora.getDay()];
      const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

      const horarioDelDia = horarios.find((h: HorarioAtencion) => h.dia === diaActual && h.activo);
      
      if (!horarioDelDia || horarioDelDia.cerrado) {
        setHorarioHoy(horarioDelDia || null);
        setDentroDeHorario(false);
        return;
      }

      setHorarioHoy(horarioDelDia);

      const [horaApertura, minApertura] = horarioDelDia.horaApertura.split(':').map(Number);
      const [horaCierre, minCierre] = horarioDelDia.horaCierre.split(':').map(Number);
      const minutosApertura = horaApertura * 60 + minApertura;
      const minutosCierre = horaCierre * 60 + minCierre;

      const estaDentro = horaActual >= minutosApertura && horaActual <= minutosCierre;
      setDentroDeHorario(estaDentro);
    } catch (error) {
      console.error('Error al cargar horario:', error);
    }
  };

  const filterProductos = () => {
    // Mostrar productos activos que tengan stock O que permitan encargo
    let filtered = productos.filter((p) => p.activo && (Number(p.stock) > 0 || p.permiteEncargo));

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.marca?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategoria !== 'all') {
      filtered = filtered.filter((p) => p.categoriaId === selectedCategoria);
    }

    setFilteredProductos(filtered);
  };

  const handleAddToCart = (producto: Producto) => {
    addItem(producto, 1);
    toast.success(`${producto.nombre} agregado al carrito`);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Compras Angostura</h1>
            <div className="flex items-center gap-1 sm:gap-2">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/usuario')}
                    className="px-2 sm:px-3"
                  >
                    <User className="h-4 w-4" />
                    <span className="ml-1 sm:ml-2 hidden sm:inline">{user.nombre}</span>
                  </Button>
                  {user.rol === 'ADMIN' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/admin')}
                      className="px-2 sm:px-3"
                    >
                      <Package className="h-4 w-4" />
                      <span className="ml-1 sm:ml-2 hidden sm:inline">Admin</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="px-2 sm:px-3"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => router.push('/login')}
                  className="px-3 sm:px-4"
                >
                  <User className="h-4 w-4" />
                  <span className="ml-2">Iniciar Sesión</span>
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push('/carrito')}
                className="relative px-2 sm:px-3"
              >
                <ShoppingCart className="h-4 w-4" />
                {getItemCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {getItemCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Horario de atención */}
        {horarioHoy && (
          <Card className={`mb-6 ${!dentroDeHorario ? 'border-orange-500' : 'border-green-500'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className={`h-5 w-5 ${!dentroDeHorario ? 'text-orange-500' : 'text-green-500'}`} />
                <div className="flex-1">
                  {horarioHoy.cerrado ? (
                    <p className="text-sm font-medium text-red-600">
                      📅 Cerrado hoy - Puedes hacer encargos para otro día
                    </p>
                  ) : !dentroDeHorario ? (
                    <div>
                      <p className="text-sm font-medium text-orange-600">
                        🕐 Estamos fuera de horario
                      </p>
                      <p className="text-xs text-gray-600">
                        Horario: {horarioHoy.horaApertura} - {horarioHoy.horaCierre}. Puedes hacer encargos.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        ✅ Estamos abiertos
                      </p>
                      <p className="text-xs text-gray-600">
                        Horario: {horarioHoy.horaApertura} - {horarioHoy.horaCierre}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4">
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categorias
                  .filter((c) => c.activo)
                  .map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProductos.map((producto) => (
            <Card key={producto.id} className="flex flex-col">
              {producto.imagen && (
                <div className="w-full h-48 overflow-hidden bg-white">
                  <img
                    src={`/uploads/productos/${producto.imagen}`}
                    alt={producto.nombre}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{producto.nombre}</CardTitle>
                {producto.marca && (
                  <p className="text-sm text-gray-500">{producto.marca}</p>
                )}
                {/* Badge para productos bajo encargo sin stock */}
                {producto.permiteEncargo && Number(producto.stock) === 0 && (
                  <Badge variant="secondary" className="mt-2 w-fit">
                    📅 Bajo encargo
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                {producto.contenido && producto.medida && (
                  <p className="text-sm text-gray-600 mb-2">
                    {producto.contenido} {producto.medida}
                  </p>
                )}
                {producto.descripcion && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {producto.descripcion}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    ${Number(producto.precioVenta).toFixed(2)}
                  </span>
                  {user?.rol === RolUsuario.ADMIN && (
                    <Badge variant={Number(producto.stock) > 10 ? 'default' : 'destructive'}>
                      Stock: {Number(producto.stock)}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(producto)}
                  disabled={Number(producto.stock) === 0 && !producto.permiteEncargo}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {producto.permiteEncargo && Number(producto.stock) === 0 
                    ? 'Encargar' 
                    : 'Agregar al carrito'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProductos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        )}
      </main>
    </div>
  );
}
