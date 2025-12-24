'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { RolUsuario } from '@/types';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';

interface Ubicacion {
  id: string;
  nombre: string;
  costo: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UbicacionesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    costo: '',
  });

  useEffect(() => {
    if (!isLoading && (!user || user.rol !== RolUsuario.ADMIN)) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.rol === RolUsuario.ADMIN) {
      cargarUbicaciones();
    }
  }, [user]);

  const cargarUbicaciones = async () => {
    try {
      const response = await api.get('/ubicaciones');
      setUbicaciones(response.data);
    } catch (error) {
      toast.error('Error al cargar ubicaciones');
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const costo = parseFloat(formData.costo);
    if (isNaN(costo) || costo < 0) {
      toast.error('El costo debe ser un número válido mayor o igual a 0');
      return;
    }

    try {
      if (editingUbicacion) {
        await api.patch(`/ubicaciones/${editingUbicacion.id}`, {
          nombre: formData.nombre,
          costo,
        });
        toast.success('Ubicación actualizada');
      } else {
        await api.post('/ubicaciones', {
          nombre: formData.nombre,
          costo,
        });
        toast.success('Ubicación creada');
      }

      setFormData({ nombre: '', costo: '' });
      setEditingUbicacion(null);
      setIsDialogOpen(false);
      cargarUbicaciones();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar ubicación');
      console.error(error);
    }
  };

  const handleEdit = (ubicacion: Ubicacion) => {
    setEditingUbicacion(ubicacion);
    setFormData({
      nombre: ubicacion.nombre,
      costo: ubicacion.costo.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta ubicación?')) {
      return;
    }

    try {
      await api.delete(`/ubicaciones/${id}`);
      toast.success('Ubicación eliminada');
      cargarUbicaciones();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar ubicación');
      console.error(error);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUbicacion(null);
    setFormData({ nombre: '', costo: '' });
  };

  if (isLoading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user || user.rol !== RolUsuario.ADMIN) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Panel
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-2xl font-bold">Gestión de Ubicaciones</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleCloseDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Ubicación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUbicacion ? 'Editar Ubicación' : 'Nueva Ubicación'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    placeholder="Ej: Angostura"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="costo">Costo de envío ($)</Label>
                  <Input
                    id="costo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costo}
                    onChange={(e) =>
                      setFormData({ ...formData, costo: e.target.value })
                    }
                    placeholder="Ej: 35"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingUbicacion ? 'Actualizar' : 'Crear'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {ubicaciones.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hay ubicaciones registradas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Costo de envío</TableHead>
                  <TableHead>Fecha creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ubicaciones.map((ubicacion) => (
                  <TableRow key={ubicacion.id}>
                    <TableCell className="font-medium">{ubicacion.nombre}</TableCell>
                    <TableCell>${Number(ubicacion.costo).toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(ubicacion.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(ubicacion)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(ubicacion.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
