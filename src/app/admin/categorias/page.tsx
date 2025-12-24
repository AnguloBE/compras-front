'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { RolUsuario, Categoria } from '@/types';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';

const categoriaSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
});

type CategoriaForm = z.infer<typeof categoriaSchema>;

export default function AdminCategoriasPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<CategoriaForm>({
    resolver: zodResolver(categoriaSchema),
  });

  const editForm = useForm<CategoriaForm>({
    resolver: zodResolver(categoriaSchema),
  });

  useEffect(() => {
    if (!isLoading && (!user || user.rol !== RolUsuario.ADMIN)) {
      router.push('/');
    } else if (user) {
      fetchCategorias();
    }
  }, [user, isLoading]);

  const fetchCategorias = async () => {
    try {
      const response = await api.get('/categorias');
      setCategorias(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categorias:', error);
      setLoading(false);
    }
  };

  const filteredCategorias = categorias.filter((categoria) =>
    categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditDialog = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    editForm.reset({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
    });
    setIsEditDialogOpen(true);
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      await api.patch(`/categorias/${id}`, { activo: !activo });
      toast.success('Categoría actualizada');
      fetchCategorias();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar categoría');
    }
  };

  const onSubmitCategoria = async (data: CategoriaForm) => {
    try {
      await api.post('/categorias', {
        ...data,
        activo: true,
      });
      toast.success('Categoría creada exitosamente');
      form.reset();
      setIsDialogOpen(false);
      fetchCategorias();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear categoría');
    }
  };

  const onEditCategoria = async (data: CategoriaForm) => {
    if (!selectedCategoria) return;
    
    try {
      await api.patch(`/categorias/${selectedCategoria.id}`, data);
      toast.success('Categoría actualizada exitosamente');
      editForm.reset();
      setSelectedCategoria(null);
      setIsEditDialogOpen(false);
      fetchCategorias();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar categoría');
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Gestión de Categorías</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Categoría</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmitCategoria)} className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Lácteos"
                    {...form.register('nombre')}
                  />
                  {form.formState.errors.nombre && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.nombre.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Descripción de la categoría"
                    {...form.register('descripcion')}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Crear Categoría
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todas las categorías</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Buscador */}
            <div className="mb-6">
              <Label htmlFor="search">Buscar por nombre</Label>
              <Input
                id="search"
                placeholder="Buscar categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell className="font-medium">{categoria.nombre}</TableCell>
                    <TableCell>{categoria.descripcion || '-'}</TableCell>
                    <TableCell>{categoria._count?.productos || 0}</TableCell>
                    <TableCell>
                      <Badge variant={categoria.activo ? 'default' : 'secondary'}>
                        {categoria.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(categoria)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActivo(categoria.id, categoria.activo)}
                        >
                          {categoria.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Diálogo de edición */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Categoría</DialogTitle>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(onEditCategoria)} className="space-y-4">
              <div>
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  placeholder="Ej: Lácteos"
                  {...editForm.register('nombre')}
                />
                {editForm.formState.errors.nombre && (
                  <p className="text-sm text-red-500 mt-1">
                    {editForm.formState.errors.nombre.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-descripcion">Descripción</Label>
                <Textarea
                  id="edit-descripcion"
                  placeholder="Descripción de la categoría"
                  {...editForm.register('descripcion')}
                />
              </div>

              <Button type="submit" className="w-full">
                Actualizar Categoría
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
