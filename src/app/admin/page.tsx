'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RolUsuario } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingBag, Users, TruckIcon, ArrowLeft, MapPin, Clock } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!user || user.rol !== RolUsuario.ADMIN)) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user || user.rol !== RolUsuario.ADMIN) {
    return null;
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
          Volver a la tienda
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Panel de Administración</h1>
          <p className="text-gray-600 mt-2">Bienvenido, {user.nombre}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/admin/productos')}
          >
            <CardHeader>
              <Package className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Productos</CardTitle>
              <CardDescription>
                Gestionar catálogo de productos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/admin/categorias')}
          >
            <CardHeader>
              <ShoppingBag className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Categorías</CardTitle>
              <CardDescription>
                Gestionar categorías de productos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/admin/pedidos')}
          >
            <CardHeader>
              <TruckIcon className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Pedidos</CardTitle>
              <CardDescription>
                Ver y gestionar pedidos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/admin/usuarios')}
          >
            <CardHeader>
              <Users className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>
                Gestionar usuarios del sistema
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/admin/ubicaciones')}
          >
            <CardHeader>
              <MapPin className="h-10 w-10 text-red-600 mb-2" />
              <CardTitle>Ubicaciones</CardTitle>
              <CardDescription>
                Gestionar ubicaciones de envío
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/admin/horarios')}
          >
            <CardHeader>
              <Clock className="h-10 w-10 text-indigo-600 mb-2" />
              <CardTitle>Horarios</CardTitle>
              <CardDescription>
                Configurar horarios de atención
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
