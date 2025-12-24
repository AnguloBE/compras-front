'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { DiaSemana, HorarioAtencion, Ubicacion } from '@/types';

const checkoutSchema = z.object({
  ubicacionEnvio: z.string().min(1, 'Debes seleccionar una ubicación de envío'),
  fechaEncargo: z.string().optional(),
  notas: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CarritoPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string>('');
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [horarios, setHorarios] = useState<HorarioAtencion[]>([]);
  const [dentroDeHorario, setDentroDeHorario] = useState<boolean>(true);
  const [horarioHoy, setHorarioHoy] = useState<HorarioAtencion | null>(null);
  const [fechaEncargoError, setFechaEncargoError] = useState<string>('');
  const [ubicacionError, setUbicacionError] = useState<string>('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');

  // Verificar si hay productos sin stock que requieren fecha
  const tieneProductosSinStock = items.some(item => Number(item.producto.stock) === 0 && item.producto.permiteEncargo);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  useEffect(() => {
    const cargarUbicaciones = async () => {
      try {
        const response = await api.get('/ubicaciones');
        setUbicaciones(response.data);
      } catch (error) {
        console.error('Error al cargar ubicaciones:', error);
        toast.error('Error al cargar ubicaciones de envío');
      }
    };
    cargarUbicaciones();
  }, []);

  useEffect(() => {
    const cargarHorarios = async () => {
      try {
        const response = await api.get('/horarios');
        setHorarios(response.data);
        verificarHorario(response.data);
      } catch (error) {
        console.error('Error al cargar horarios:', error);
      }
    };
    cargarHorarios();
  }, []);

  const diasSemanaMap: Record<number, DiaSemana> = {
    0: DiaSemana.DOMINGO,
    1: DiaSemana.LUNES,
    2: DiaSemana.MARTES,
    3: DiaSemana.MIERCOLES,
    4: DiaSemana.JUEVES,
    5: DiaSemana.VIERNES,
    6: DiaSemana.SABADO,
  };

  const verificarHorario = (horariosData: HorarioAtencion[]) => {
    const ahora = new Date();
    const diaActual = diasSemanaMap[ahora.getDay()];
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

    const horarioDelDia = horariosData.find(h => h.dia === diaActual && h.activo);
    
    if (!horarioDelDia) {
      setDentroDeHorario(false);
      setHorarioHoy(null);
      return;
    }

    setHorarioHoy(horarioDelDia);

    if (horarioDelDia.cerrado) {
      setDentroDeHorario(false);
      return;
    }

    const [horaApertura, minApertura] = horarioDelDia.horaApertura.split(':').map(Number);
    const [horaCierre, minCierre] = horarioDelDia.horaCierre.split(':').map(Number);
    const minutosApertura = horaApertura * 60 + minApertura;
    const minutosCierre = horaCierre * 60 + minCierre;

    const estaDentro = horaActual >= minutosApertura && horaActual <= minutosCierre;
    setDentroDeHorario(estaDentro);
  };

  const handleUpdateQuantity = (productoId: string, newQuantity: number) => {
    const item = items.find((i) => i.producto.id === productoId);
    if (item && newQuantity > 0) {
      const stock = Number(item.producto.stock);
      
      // Si hay stock disponible, limitar a ese stock
      if (stock > 0) {
        if (newQuantity <= stock) {
          updateQuantity(productoId, newQuantity);
        }
      } else {
        // Si no hay stock (stock = 0), solo permitir si permite encargo
        if (item.producto.permiteEncargo) {
          updateQuantity(productoId, newQuantity);
        }
      }
    }
  };

  const handleRemoveItem = (productoId: string) => {
    removeItem(productoId);
    toast.success('Producto eliminado del carrito');
  };

  const onSubmitPedido = async (data: CheckoutForm) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Validar horario de atención para pedidos inmediatos
    if (!dentroDeHorario && !data.fechaEncargo) {
      toast.error('Estamos fuera de horario. Por favor selecciona una fecha de encargo.');
      setFechaEncargoError('Estamos fuera de horario. Selecciona una fecha de encargo.');
      return;
    }

    // Debug: ver qué datos se están enviando
    console.log('=== DEBUG PEDIDO ===');
    console.log('Datos del formulario:', data);
    console.log('Tiene productos sin stock:', tieneProductosSinStock);
    console.log('Fecha de encargo:', data.fechaEncargo);
    console.log('Tipo de fechaEncargo:', typeof data.fechaEncargo);
    console.log('Longitud fechaEncargo:', data.fechaEncargo?.length);
    console.log('fechaEncargo después de trim:', data.fechaEncargo?.trim());

    // Validar ubicación de envío
    if (!ubicacionSeleccionada || !data.ubicacionEnvio) {
      setUbicacionError('Debes seleccionar una ubicación de envío');
      toast.error('Debes seleccionar una ubicación de envío');
      return;
    }

    // Validar fecha de encargo si hay productos sin stock
    const fechaVacia = !data.fechaEncargo || data.fechaEncargo.trim() === '';
    console.log('¿Fecha vacía?:', fechaVacia);
    
    if (tieneProductosSinStock && fechaVacia) {
      console.log('❌ VALIDACIÓN FALLÓ: Se requiere fecha de encargo');
      setFechaEncargoError('La fecha de encargo es obligatoria para productos sin existencia');
      toast.error('Debes seleccionar una fecha de encargo para productos sin existencia');
      return;
    }

    // Validar que la fecha sea al menos 1 hora en el futuro
    if (data.fechaEncargo) {
      const fechaSeleccionadaDate = new Date(data.fechaEncargo);
      const fechaMinima = new Date();
      fechaMinima.setHours(fechaMinima.getHours() + 1);

      if (fechaSeleccionadaDate < fechaMinima) {
        setFechaEncargoError('La fecha de encargo debe ser al menos 1 hora después de la hora actual');
        toast.error('La fecha de encargo debe ser al menos 1 hora después de la hora actual');
        return;
      }
    }
    
    console.log('✅ VALIDACIÓN PASÓ: Fecha OK o no se requiere');

    // Limpiar errores si la validación pasa
    setUbicacionError('');
    setFechaEncargoError('');
    setLoading(true);
    try {
      const items_pedido = items.map((item) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
      }));

      await api.post('/pedidos', {
        items: items_pedido,
        ubicacionEnvio: data.ubicacionEnvio,
        fechaEncargo: data.fechaEncargo || undefined,
        notas: data.notas || undefined,
        costoEnvio: costoEnvio,
      });

      toast.success('Pedido realizado exitosamente');
      clearCart();
      router.push('/usuario');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al realizar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getTotal();
  const ubicacion = ubicaciones.find(u => u.nombre === ubicacionSeleccionada);
  const costoEnvio = ubicacion ? Number(ubicacion.costo) : 0;
  const total = subtotal + costoEnvio;

  // Calcular fecha mínima: 1 hora desde ahora
  const fechaMinima = new Date();
  fechaMinima.setHours(fechaMinima.getHours() + 1);
  const fechaMinimaString = fechaMinima.toISOString().slice(0, 16); // formato YYYY-MM-DDTHH:mm

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al catálogo
          </Button>

          <div className="text-center py-12">
            <ShoppingCart className="h-24 w-24 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-6">
              Agrega productos desde nuestro catálogo
            </p>
            <Button onClick={() => router.push('/')}>
              Ver productos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>

        <h1 className="text-3xl font-bold mb-8">Carrito de compras</h1>

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
                        Horario: {horarioHoy.horaApertura} - {horarioHoy.horaCierre}. Puedes hacer un encargo para más tarde.
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items del carrito */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.producto.id}>
                <CardContent className="p-4">
                  {/* Layout para móvil y desktop */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Imagen y info básica */}
                    <div className="flex gap-4 flex-1">
                      {/* Imagen del producto */}
                      {item.producto.imagen && (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-white rounded overflow-hidden">
                          <img
                            src={`/uploads/productos/${item.producto.imagen}`}
                            alt={item.producto.nombre}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg">{item.producto.nombre}</h3>
                        {item.producto.marca && (
                          <p className="text-sm text-gray-500">{item.producto.marca}</p>
                        )}
                        {item.producto.contenido && item.producto.medida && (
                          <p className="text-sm text-gray-600">
                            {item.producto.contenido} {item.producto.medida}
                          </p>
                        )}
                        {/* Badge para producto sin stock (encargo) */}
                        {Number(item.producto.stock) === 0 && item.producto.permiteEncargo && (
                          <Badge variant="secondary" className="mt-1">
                            📅 Encargo
                          </Badge>
                        )}
                        <p className="text-lg sm:text-xl font-bold mt-1">
                          ${Number(item.producto.precioVenta).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Controles de cantidad y precio - En móvil van abajo */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-3 sm:gap-2">
                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 sm:h-10 sm:w-10"
                          onClick={() => handleUpdateQuantity(item.producto.id, item.cantidad - 1)}
                          disabled={item.cantidad <= 1}
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val > 0) {
                              handleUpdateQuantity(item.producto.id, val);
                            }
                          }}
                          className="w-14 sm:w-16 text-center h-8 sm:h-10"
                          min={1}
                          max={Number(item.producto.stock) > 0 ? Number(item.producto.stock) : undefined}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 sm:h-10 sm:w-10"
                          onClick={() => handleUpdateQuantity(item.producto.id, item.cantidad + 1)}
                          disabled={Number(item.producto.stock) > 0 && item.cantidad >= Number(item.producto.stock)}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>

                      {/* Precio total y eliminar */}
                      <div className="flex flex-col items-end sm:items-center gap-1">
                        <p className="text-base sm:text-xl font-bold whitespace-nowrap">
                          ${(Number(item.producto.precioVenta) * item.cantidad).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.producto.id)}
                          className="text-red-600 hover:text-red-700 h-7 px-2"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumen del pedido */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costo de envío</span>
                    <span>${costoEnvio.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={form.handleSubmit(onSubmitPedido)} className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="ubicacionEnvio">Ubicación de envío *</Label>
                    <Select
                      onValueChange={(value) => {
                        setUbicacionSeleccionada(value);
                        form.setValue('ubicacionEnvio', value);
                        setUbicacionError(''); // Limpiar error al seleccionar
                      }}
                      value={ubicacionSeleccionada}
                      disabled={ubicaciones.length === 0}
                    >
                      <SelectTrigger className={`w-full ${ubicacionError ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder={ubicaciones.length === 0 ? "No hay ubicaciones disponibles" : "Selecciona una ubicación"} />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {ubicaciones.map((ubicacion) => (
                          <SelectItem key={ubicacion.id} value={ubicacion.nombre}>
                            {ubicacion.nombre} - ${Number(ubicacion.costo).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ubicacionError && (
                      <p className="text-sm text-red-500 mt-1">
                        {ubicacionError}
                      </p>
                    )}
                    {form.formState.errors.ubicacionEnvio && !ubicacionError && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.ubicacionEnvio.message}
                      </p>
                    )}
                    {ubicaciones.length === 0 && (
                      <p className="text-sm text-yellow-600 mt-1">
                        No hay ubicaciones de envío configuradas. Contacta al administrador.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="fechaEncargo">
                      Fecha de encargo {tieneProductosSinStock && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="fechaEncargo"
                      type="datetime-local"
                      min={fechaMinimaString}
                      {...form.register('fechaEncargo', {
                        onChange: (e) => {
                          setFechaSeleccionada(e.target.value);
                          if (e.target.value) {
                            setFechaEncargoError('');
                          }
                        }
                      })}
                      className={fechaEncargoError ? 'border-red-500' : ''}
                    />
                    {fechaEncargoError && (
                      <p className="text-sm text-red-500 mt-1">
                        {fechaEncargoError}
                      </p>
                    )}
                    {tieneProductosSinStock && !fechaSeleccionada ? (
                      <p className="text-xs text-orange-600 mt-1 font-medium">
                        ⚠️ Tienes productos sin existencia, debes seleccionar fecha de encargo (mínimo 1 hora después)
                      </p>
                    ) : tieneProductosSinStock && fechaSeleccionada ? (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        ✓ Fecha de encargo seleccionada
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        Deja vacío para entrega inmediata (opcional: mínimo 1 hora después)
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notas">Notas adicionales (opcional)</Label>
                    <Textarea
                      id="notas"
                      placeholder="Ej: Dejar en portería, tocar timbre..."
                      {...form.register('notas')}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : 'Confirmar pedido'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
