'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { RolUsuario, Usuario } from '@/types';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit, Search } from 'lucide-react';
import { toast } from 'sonner';

const usuarioSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  rol: z.enum(['ADMIN', 'USUARIO', 'REPARTIDOR']),
});

type UsuarioForm = z.infer<typeof usuarioSchema>;

export default function AdminUsuariosPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  const form = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioSchema),
  });

  useEffect(() => {
    if (!isLoading && (!user || user.rol !== RolUsuario.ADMIN)) {
      router.push('/');
    } else if (user) {
      fetchUsuarios();
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsuarios(usuarios);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = usuarios.filter(
        (u) =>
          u.nombre.toLowerCase().includes(term) ||
          u.telefono.includes(term)
      );
      setFilteredUsuarios(filtered);
    }
  }, [searchTerm, usuarios]);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
      setFilteredUsuarios(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      setLoading(false);
    }
  };

  const openEditDialog = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    form.reset({
      nombre: usuario.nombre,
      rol: usuario.rol as any,
    });
    setIsEditDialogOpen(true);
  };

  const onEditUsuario = async (data: UsuarioForm) => {
    if (!selectedUsuario) return;

    try {
      await api.patch(`/usuarios/${selectedUsuario.id}`, {
        nombre: data.nombre,
      });

      if (data.rol !== selectedUsuario.rol) {
        await api.patch(`/usuarios/${selectedUsuario.id}/rol`, {
          rol: data.rol,
        });
      }

      toast.success('Usuario actualizado exitosamente');
      form.reset();
      setSelectedUsuario(null);
      setIsEditDialogOpen(false);
      fetchUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO');
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

        <h1 className="text-3xl font-bold mb-8">Gestión de Usuarios</h1>

        <Card>
          <CardHeader>
            <CardTitle>Todos los usuarios</CardTitle>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.nombre}</TableCell>
                      <TableCell>{usuario.telefono}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            usuario.rol === RolUsuario.ADMIN
                              ? 'destructive'
                              : usuario.rol === RolUsuario.REPARTIDOR
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {usuario.rol}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(usuario.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(usuario)}
                          disabled={usuario.id === user?.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog para editar usuario */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onEditUsuario)} className="space-y-4">
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={selectedUsuario?.telefono || ''}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">El teléfono no se puede modificar</p>
              </div>

              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  placeholder="Nombre completo"
                  {...form.register('nombre')}
                />
                {form.formState.errors.nombre && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.nombre.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="rol">Rol *</Label>
                <Select 
                  value={form.watch('rol')}
                  onValueChange={(value) => form.setValue('rol', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USUARIO">Usuario</SelectItem>
                    <SelectItem value="REPARTIDOR">Repartidor</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.rol && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.rol.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Actualizar Usuario
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
