'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import api from '@/lib/api';
import { Producto } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ShoppingCart, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { addItem } = useCartStore();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProducto();
    }
  }, [params.id]);

  const fetchProducto = async () => {
    try {
      const response = await api.get(`/productos/${params.id}`);
      setProducto(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching producto:', error);
      toast.error('Error al cargar el producto');
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (producto) {
      addItem(producto, cantidad);
      toast.success(`${cantidad} x ${producto.nombre} agregado al carrito`);
      router.push('/');
    }
  };

  const incrementCantidad = () => {
    if (producto && cantidad < Number(producto.stock)) {
      setCantidad(cantidad + 1);
    }
  };

  const decrementCantidad = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al catálogo
          </Button>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Imagen del producto */}
          <div className="bg-white rounded-lg p-6 sm:p-8 flex items-center justify-center h-64 sm:h-96">
            {producto.imagen ? (
              <img
                src={`/uploads/productos/${producto.imagen}`}
                alt={producto.nombre}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <ShoppingCart className="h-16 sm:h-24 w-16 sm:w-24 mx-auto mb-4" />
                <p>Imagen del producto</p>
              </div>
            )}
          </div>

          {/* Detalles del producto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">{producto.nombre}</CardTitle>
              {producto.marca && (
                <p className="text-base sm:text-lg text-gray-500">{producto.marca}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {producto.contenido && producto.medida && (
                <div>
                  <Label>Contenido</Label>
                  <p className="text-lg">{producto.contenido} {producto.medida}</p>
                </div>
              )}

              {producto.codigoBarras && (
                <div>
                  <Label>Código de barras</Label>
                  <p className="text-lg">{producto.codigoBarras}</p>
                </div>
              )}

              {producto.descripcion && (
                <div>
                  <Label>Descripción</Label>
                  <p className="text-gray-700">{producto.descripcion}</p>
                </div>
              )}

              {producto.categoria && (
                <div>
                  <Label>Categoría</Label>
                  <Badge className="ml-2">{producto.categoria.nombre}</Badge>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <Label>Precio</Label>
                    <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                      ${Number(producto.precioVenta).toFixed(2)}
                    </p>
                  </div>
                  <Badge variant={Number(producto.stock) > 10 ? 'default' : 'destructive'} className="self-start sm:self-auto">
                    Stock: {Number(producto.stock)}
                  </Badge>
                </div>

                <div className="mb-4">
                  <Label>Cantidad</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decrementCantidad}
                      disabled={cantidad <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={cantidad}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val > 0 && val <= Number(producto.stock)) {
                          setCantidad(val);
                        }
                      }}
                      className="w-20 text-center"
                      min={1}
                      max={Number(producto.stock)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={incrementCantidad}
                      disabled={cantidad >= Number(producto.stock)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {producto.permiteEncargo && (
                  <p className="text-sm text-blue-600 mb-4">
                    ✓ Este producto permite encargo
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={Number(producto.stock) === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Agregar al carrito - ${(Number(producto.precioVenta) * cantidad).toFixed(2)}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
