'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { Pedido, EstadoPedido } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const estadoConfig = {
  [EstadoPedido.PENDIENTE]: {
    label: 'Pendiente',
    icon: Clock,
    variant: 'secondary' as const,
  },
  [EstadoPedido.CONFIRMADO]: {
    label: 'Confirmado',
    icon: CheckCircle,
    variant: 'default' as const,
  },
  [EstadoPedido.EN_PREPARACION]: {
    label: 'En preparación',
    icon: Package,
    variant: 'default' as const,
  },
  [EstadoPedido.EN_CAMINO]: {
    label: 'En camino',
    icon: Truck,
    variant: 'default' as const,
  },
  [EstadoPedido.ENTREGADO]: {
    label: 'Entregado',
    icon: CheckCircle,
    variant: 'default' as const,
  },
  [EstadoPedido.CANCELADO]: {
    label: 'Cancelado',
    icon: XCircle,
    variant: 'destructive' as const,
  },
};

export default function UsuarioPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPedidos();
  }, [user]);

  const fetchPedidos = async () => {
    try {
      const response = await api.get('/pedidos');
      setPedidos(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pedidos:', error);
      toast.error('Error al cargar los pedidos');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Mi cuenta</h1>
          <p className="text-gray-600 mt-2">Hola, {user?.nombre}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total de pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pedidos.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pedidos activos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {pedidos.filter((p) => 
                  [EstadoPedido.PENDIENTE, EstadoPedido.CONFIRMADO, EstadoPedido.EN_PREPARACION, EstadoPedido.EN_CAMINO].includes(p.estado)
                ).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pedidos entregados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {pedidos.filter((p) => p.estado === EstadoPedido.ENTREGADO).length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            {pedidos.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Aún no tienes pedidos</p>
                <Button onClick={() => router.push('/')}>
                  Comenzar a comprar
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {pedidos.map((pedido) => {
                  const estadoInfo = estadoConfig[pedido.estado];
                  const EstadoIcon = estadoInfo.icon;

                  return (
                    <Card key={pedido.id}>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-sm text-gray-500">
                              Pedido #{pedido.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(pedido.createdAt)}
                            </p>
                          </div>
                          <Badge variant={estadoInfo.variant}>
                            <EstadoIcon className="h-4 w-4 mr-1" />
                            {estadoInfo.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                          <div className="inline-block min-w-full align-middle">
                            <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">Cantidad</TableHead>
                              <TableHead className="text-right">Precio</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pedido.detalles.map((detalle) => (
                              <TableRow key={detalle.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{detalle.producto.nombre}</p>
                                    {detalle.producto.marca && (
                                      <p className="text-sm text-gray-500">{detalle.producto.marca}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{Number(detalle.cantidad)}</TableCell>
                                <TableCell className="text-right">
                                  ${Number(detalle.precioUnitario).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  ${Number(detalle.subtotal).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>                          </div>
                        </div>
                        <div className="mt-4 space-y-2 border-t pt-4">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>${Number(pedido.subtotal).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Envío</span>
                            <span>${Number(pedido.costoEnvio).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>${Number(pedido.total).toFixed(2)}</span>
                          </div>
                        </div>

                        {pedido.notas && (
                          <div className="mt-4 p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium">Notas:</p>
                            <p className="text-sm text-gray-700">{pedido.notas}</p>
                          </div>
                        )}

                        {pedido.fechaEncargo && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Fecha de encargo: {formatDate(pedido.fechaEncargo)}
                            </p>
                          </div>
                        )}

                        {pedido.repartidor && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              Repartidor: {pedido.repartidor.nombre} - {pedido.repartidor.telefono}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
