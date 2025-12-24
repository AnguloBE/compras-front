'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { RolUsuario, Pedido, EstadoPedido } from '@/types';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, CheckCircle, Truck } from 'lucide-react';
import { toast } from 'sonner';

const updateEstadoSchema = z.object({
  estado: z.nativeEnum(EstadoPedido),
  repartidorId: z.string().optional(),
});

type UpdateEstadoForm = z.infer<typeof updateEstadoSchema>;

export default function AdminPedidosPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [repartidores, setRepartidores] = useState<any[]>([]);

  const form = useForm<UpdateEstadoForm>({
    resolver: zodResolver(updateEstadoSchema),
  });

  useEffect(() => {
    if (!isLoading && (!user || user.rol !== RolUsuario.ADMIN)) {
      router.push('/');
    } else if (user) {
      fetchData();
    }
  }, [user, isLoading]);

  const fetchData = async () => {
    try {
      const [pedidosRes, repartidoresRes] = await Promise.all([
        api.get('/pedidos'),
        api.get('/usuarios?rol=REPARTIDOR'),
      ]);
      setPedidos(pedidosRes.data);
      setRepartidores(repartidoresRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleUpdateEstado = async (pedidoId: string, data: UpdateEstadoForm) => {
    try {
      await api.patch(`/pedidos/${pedidoId}/estado`, data);
      toast.success('Estado actualizado correctamente');
      fetchData();
      setSelectedPedido(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const handleTomarPedido = async (pedidoId: string) => {
    if (!user?.id) return;
    
    try {
      await api.patch(`/pedidos/${pedidoId}/tomar`);
      toast.success('Pedido tomado exitosamente. (Si hay números inválidos, las notificaciones WhatsApp pueden fallar)');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al tomar el pedido');
    }
  };

  const handleMarcarEnCamino = async (pedidoId: string) => {
    try {
      await api.patch(`/pedidos/${pedidoId}/en-camino`);
      toast.success('Pedido marcado como en camino. Cliente notificado por WhatsApp.');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al marcar en camino');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFechaEncargo = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTiempoRestante = (fechaEncargo: string) => {
    const ahora = new Date();
    const encargo = new Date(fechaEncargo);
    const diff = encargo.getTime() - ahora.getTime();

    if (diff < 0) {
      return <span className="text-red-600 font-semibold">¡Ya pasó!</span>;
    }

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (horas > 24) {
      const dias = Math.floor(horas / 24);
      return <span className="text-green-600">{dias}d {horas % 24}h</span>;
    } else if (horas > 0) {
      return <span className="text-yellow-600">{horas}h {minutos}m</span>;
    } else {
      return <span className="text-red-600">{minutos}m</span>;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al panel
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-8">Gestión de Pedidos</h1>

        <Card>
          <CardHeader>
            <CardTitle>Todos los pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Fecha Pedido</TableHead>
                  <TableHead>Encargo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-mono text-sm">
                      {pedido.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pedido.usuario.nombre}</p>
                        <p className="text-sm text-gray-500">{pedido.usuario.telefono}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge>{pedido.estado}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${Number(pedido.total).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {pedido.ubicacionEnvio || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(pedido.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {pedido.fechaEncargo ? (
                        <div className="flex flex-col gap-1">
                          <span>{formatFechaEncargo(pedido.fechaEncargo)}</span>
                          <div className="text-xs">
                            {getTiempoRestante(pedido.fechaEncargo)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin encargo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {pedido.estado === 'PENDIENTE' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleTomarPedido(pedido.id)}
                            title="Tomar pedido"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Tomar
                          </Button>
                        )}
                        {pedido.estado === 'EN_PREPARACION' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarcarEnCamino(pedido.id)}
                            title="Marcar como en camino"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            En Camino
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPedido(pedido)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalle del Pedido</DialogTitle>
                            </DialogHeader>
                            {selectedPedido && (
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold mb-2">Productos</h3>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Cant.</TableHead>
                                        <TableHead>Precio</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedPedido.detalles.map((detalle) => (
                                        <TableRow key={detalle.id}>
                                          <TableCell>{detalle.producto.nombre}</TableCell>
                                          <TableCell>{Number(detalle.cantidad)}</TableCell>
                                          <TableCell>${Number(detalle.subtotal).toFixed(2)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>

                                <form
                                  onSubmit={form.handleSubmit((data) =>
                                    handleUpdateEstado(selectedPedido.id, data)
                                  )}
                                  className="space-y-4"
                                >
                                  <div>
                                    <Label>Estado</Label>
                                    <Select
                                      onValueChange={(value) =>
                                        form.setValue('estado', value as EstadoPedido)
                                      }
                                      defaultValue={selectedPedido.estado}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.values(EstadoPedido).map((estado) => (
                                          <SelectItem key={estado} value={estado}>
                                            {estado}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label>Asignar Repartidor</Label>
                                    <Select
                                      onValueChange={(value) =>
                                        form.setValue('repartidorId', value)
                                      }
                                      defaultValue={selectedPedido.repartidor?.id}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar repartidor" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {repartidores.map((repartidor) => (
                                          <SelectItem key={repartidor.id} value={repartidor.id}>
                                            {repartidor.nombre}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <Button type="submit" className="w-full">
                                    Actualizar Pedido
                                  </Button>
                                </form>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
