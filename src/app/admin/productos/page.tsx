'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth';
import { RolUsuario, Producto, Categoria, UnidadMedida } from '@/types';
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
import { ArrowLeft, Plus, Camera, Edit, Package, Crop, Scan, Barcode, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { ImageCropper } from '@/components/ImageCropper';
import { BarcodeScanner } from '@/components/BarcodeScanner';

const productoSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  codigoBarras: z.string().optional(),
  marca: z.string().optional(),
  contenido: z.string().optional(),
  medida: z.enum(['L', 'ML', 'KG', 'GR', 'PZ', 'MTR']).optional(),
  descripcion: z.string().optional(),
  precioCompra: z.string().min(1, 'Precio de compra requerido'),
  precioVenta: z.string().min(1, 'Precio de venta requerido'),
  stock: z.string().min(1, 'Stock requerido'),
  permiteEncargo: z.boolean().optional(),
  categoriaId: z.string().min(1, 'Categoría requerida'),
});

const stockSchema = z.object({
  cantidad: z.string().min(1, 'Cantidad requerida'),
});

type ProductoForm = z.infer<typeof productoSchema>;
type StockForm = z.infer<typeof stockSchema>;

export default function AdminProductosPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'create' | 'edit' | 'stock'>('create');
  const [isQuickStockOpen, setIsQuickStockOpen] = useState(false);
  const [sortField, setSortField] = useState<'nombre' | 'precio' | 'stock' | 'ganancia'>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const form = useForm<ProductoForm>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      permiteEncargo: false,
    },
  });

  const stockForm = useForm<StockForm>({
    resolver: zodResolver(stockSchema),
  });

  useEffect(() => {
    if (!isLoading && (!user || user.rol !== RolUsuario.ADMIN)) {
      router.push('/');
    } else if (user) {
      fetchProductos();
    }
  }, [user, isLoading, showInactive]);

  const fetchProductos = async () => {
    try {
      const [productosRes, categoriasRes] = await Promise.all([
        api.get('/productos', {
          params: { includeInactive: showInactive },
        }),
        api.get('/categorias'),
      ]);
      setProductos(productosRes.data);
      setCategorias(categoriasRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching productos:', error);
      setLoading(false);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    if (scannerMode === 'create' || scannerMode === 'edit') {
      form.setValue('codigoBarras', barcode);
      toast.success(`Código escaneado: ${barcode}`);
    } else if (scannerMode === 'stock') {
      // Buscar producto por código de barras
      handleQuickStock(barcode);
    }
  };

  const handleQuickStock = async (barcode: string) => {
    try {
      const response = await api.get(`/productos/barcode/${barcode}`);
      const producto = response.data;
      setSelectedProducto(producto);
      setIsQuickStockOpen(true);
      toast.success(`Producto encontrado: ${producto.nombre}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Producto no encontrado');
    }
  };

  const onSubmitQuickStock = async (data: StockForm) => {
    if (!selectedProducto) return;

    try {
      const cantidad = parseFloat(data.cantidad);
      await api.patch(`/productos/${selectedProducto.id}/stock`, { cantidad });
      toast.success('Stock actualizado correctamente');
      fetchProductos();
      setIsQuickStockOpen(false);
      stockForm.reset();
      setSelectedProducto(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar stock');
    }
  };

  const filteredProductos = productos.filter((producto) => {
    const matchesSearch = 
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (producto.marca?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (producto.categoria?.nombre.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesCategoria = selectedCategoria === 'all' || producto.categoriaId === selectedCategoria;

    return matchesSearch && matchesCategoria;
  }).sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'nombre':
        return direction * a.nombre.localeCompare(b.nombre);
      case 'precio':
        return direction * (Number(a.precioVenta) - Number(b.precioVenta));
      case 'stock':
        return direction * (Number(a.stock) - Number(b.stock));
      case 'ganancia':
        const gananciaA = Number(a.precioVenta) - Number(a.precioCompra);
        const gananciaB = Number(b.precioVenta) - Number(b.precioCompra);
        return direction * (gananciaA - gananciaB);
      default:
        return 0;
    }
  });

  const toggleSort = (field: 'nombre' | 'precio' | 'stock' | 'ganancia') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTempImageUrl(url);
      setIsCropperOpen(true);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setSelectedFile(croppedFile);
    const url = URL.createObjectURL(croppedFile);
    setPreviewUrl(url);
    setIsCropperOpen(false);
    setTempImageUrl(null);
  };

  const handleCropCancel = () => {
    setIsCropperOpen(false);
    setTempImageUrl(null);
  };

  const onSubmitProducto = async (data: ProductoForm) => {
    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      formData.append('precioCompra', data.precioCompra);
      formData.append('precioVenta', data.precioVenta);
      formData.append('stock', data.stock);
      formData.append('categoriaId', data.categoriaId);
      formData.append('permiteEncargo', String(data.permiteEncargo || false));
      
      if (data.codigoBarras) formData.append('codigoBarras', data.codigoBarras);
      if (data.marca) formData.append('marca', data.marca);
      if (data.contenido) formData.append('contenido', data.contenido);
      if (data.medida) formData.append('medida', data.medida);
      if (data.descripcion) formData.append('descripcion', data.descripcion);
      if (selectedFile) formData.append('imagen', selectedFile);

      await api.post('/productos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('Producto creado exitosamente');
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsDialogOpen(false);
      fetchProductos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear producto');
    }
  };

  const onEditProducto = async (data: ProductoForm) => {
    if (!selectedProducto) return;
    
    try {
      const formData = new FormData();
      formData.append('nombre', data.nombre);
      formData.append('precioCompra', data.precioCompra);
      formData.append('precioVenta', data.precioVenta);
      formData.append('stock', data.stock);
      formData.append('categoriaId', data.categoriaId);
      formData.append('permiteEncargo', String(data.permiteEncargo || false));
      
      if (data.codigoBarras) formData.append('codigoBarras', data.codigoBarras);
      if (data.marca) formData.append('marca', data.marca);
      if (data.contenido) formData.append('contenido', data.contenido);
      if (data.medida) formData.append('medida', data.medida);
      if (data.descripcion) formData.append('descripcion', data.descripcion);
      if (selectedFile) formData.append('imagen', selectedFile);

      await api.patch(`/productos/${selectedProducto.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('Producto actualizado exitosamente');
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedProducto(null);
      setIsEditDialogOpen(false);
      fetchProductos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar producto');
    }
  };

  const onAgregarStock = async (data: StockForm) => {
    if (!selectedProducto) return;
    
    try {
      const stockActual = Number(selectedProducto.stock);
      const cantidadAgregar = Number(data.cantidad);
      const nuevoStock = stockActual + cantidadAgregar;

      await api.patch(`/productos/${selectedProducto.id}`, {
        stock: nuevoStock,
      });
      
      toast.success(`Se agregaron ${cantidadAgregar} unidades. Stock total: ${nuevoStock}`);
      stockForm.reset();
      setSelectedProducto(null);
      setIsStockDialogOpen(false);
      fetchProductos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al agregar stock');
    }
  };

  const openEditDialog = (producto: Producto) => {
    setSelectedProducto(producto);
    form.reset({
      nombre: producto.nombre,
      codigoBarras: producto.codigoBarras || '',
      marca: producto.marca || '',
      contenido: producto.contenido || '',
      medida: producto.medida as any,
      descripcion: producto.descripcion || '',
      precioCompra: String(producto.precioCompra),
      precioVenta: String(producto.precioVenta),
      stock: String(producto.stock),
      permiteEncargo: producto.permiteEncargo,
      categoriaId: producto.categoriaId,
    });
    setIsEditDialogOpen(true);
  };

  const openStockDialog = (producto: Producto) => {
    setSelectedProducto(producto);
    stockForm.reset();
    setIsStockDialogOpen(true);
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      await api.patch(`/productos/${id}`, { activo: !activo });
      toast.success('Producto actualizado');
      fetchProductos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar producto');
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Productos</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setScannerMode('stock');
                setIsScannerOpen(true);
              }}
              className="flex-1 sm:flex-none"
            >
              <Barcode className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Agregar Stock Rápido</span>
              <span className="sm:hidden">Stock</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nuevo Producto</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Producto</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmitProducto)} className="space-y-4 px-1">
                  <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Coca Cola"
                    {...form.register('nombre')}
                  />
                  {form.formState.errors.nombre && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.nombre.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="marca">Marca</Label>
                    <Input
                      id="marca"
                      placeholder="Ej: Coca Cola"
                      {...form.register('marca')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="codigoBarras">Código de Barras</Label>
                    <div className="flex gap-2">
                      <Input
                        id="codigoBarras"
                        placeholder="1234567890"
                        {...form.register('codigoBarras')}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setScannerMode('create');
                          setIsScannerOpen(true);
                        }}
                        title="Escanear código"
                      >
                        <Scan className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contenido">Contenido</Label>
                    <Input
                      id="contenido"
                      placeholder="Ej: 500"
                      {...form.register('contenido')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="medida">Medida</Label>
                    <Select onValueChange={(value) => form.setValue('medida', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Litros (L)</SelectItem>
                        <SelectItem value="ML">Mililitros (ML)</SelectItem>
                        <SelectItem value="KG">Kilogramos (KG)</SelectItem>
                        <SelectItem value="GR">Gramos (GR)</SelectItem>
                        <SelectItem value="PZ">Piezas (PZ)</SelectItem>
                        <SelectItem value="MTR">Metros (MTR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="precioCompra">Precio Compra ($) *</Label>
                    <Input
                      id="precioCompra"
                      type="number"
                      step="0.01"
                      placeholder="8.00"
                      {...form.register('precioCompra')}
                    />
                    {form.formState.errors.precioCompra && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.precioCompra.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="precioVenta">Precio Venta ($) *</Label>
                    <Input
                      id="precioVenta"
                      type="number"
                      step="0.01"
                      placeholder="10.50"
                      {...form.register('precioVenta')}
                    />
                    {form.formState.errors.precioVenta && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.precioVenta.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    step="0.01"
                    placeholder="100"
                    {...form.register('stock')}
                  />
                  {form.formState.errors.stock && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.stock.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="categoriaId">Categoría *</Label>
                  <Select onValueChange={(value) => form.setValue('categoriaId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoriaId && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.categoriaId.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Descripción del producto"
                    {...form.register('descripcion')}
                  />
                </div>

                <div>
                  <Label htmlFor="imagen">Imagen del producto</Label>
                  <div className="space-y-2">
                    <Input
                      id="imagen"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                    />
                    {previewUrl && (
                      <div className="space-y-2">
                        <div className="relative w-full h-48 rounded border">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (previewUrl) {
                              setTempImageUrl(previewUrl);
                              setIsCropperOpen(true);
                            }
                          }}
                        >
                          <Crop className="h-4 w-4 mr-2" />
                          Re-recortar imagen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="permiteEncargo"
                    {...form.register('permiteEncargo')}
                  />
                  <Label htmlFor="permiteEncargo">Permite encargo</Label>
                </div>

                <Button type="submit" className="w-full">
                  Crear Producto
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos los productos</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtros y búsqueda */}
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Buscar por nombre, marca o categoría</Label>
                  <Input
                    id="search"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="categoria-filter">Filtrar por categoría</Label>
                  <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                    <SelectTrigger id="categoria-filter">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant={showInactive ? 'default' : 'outline'}
                    onClick={() => setShowInactive(!showInactive)}
                    className="w-full"
                  >
                    {showInactive ? 'Mostrando inactivos' : 'Mostrar inactivos'}
                  </Button>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Imagen</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('nombre')}
                      className="hover:bg-transparent p-0 h-auto font-medium"
                    >
                      Nombre
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('precio')}
                      className="hover:bg-transparent p-0 h-auto font-medium"
                    >
                      P. Venta
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('ganancia')}
                      className="hover:bg-transparent p-0 h-auto font-medium"
                    >
                      Ganancia
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('stock')}
                      className="hover:bg-transparent p-0 h-auto font-medium"
                    >
                      Stock
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProductos.map((producto) => {
                  const precioCompra = Number(producto.precioCompra);
                  const precioVenta = Number(producto.precioVenta);
                  const ganancia = precioVenta - precioCompra;
                  const porcentajeGanancia = precioCompra > 0 ? (ganancia / precioCompra) * 100 : 0;
                  
                  return (
                    <TableRow key={producto.id}>
                      <TableCell>
                        <div className="w-12 h-12 relative rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                          {producto.imagen && producto.imagen.trim() !== '' ? (
                            <img
                              src={`/uploads/productos/${producto.imagen}`}
                              alt={producto.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{producto.nombre}</TableCell>
                      <TableCell>{producto.marca || '-'}</TableCell>
                      <TableCell>${precioVenta.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={ganancia > 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
                            ${ganancia.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({porcentajeGanancia.toFixed(1)}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={Number(producto.stock) > 10 ? 'default' : 'destructive'}>
                          {Number(producto.stock)} {producto.medida || ''}
                        </Badge>
                      </TableCell>
                      <TableCell>{producto.categoria?.nombre || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={producto.activo ? 'default' : 'secondary'}>
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(producto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStockDialog(producto)}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActivo(producto.id, producto.activo)}
                          >
                            {producto.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog para agregar stock */}
        <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Stock - {selectedProducto?.nombre}</DialogTitle>
            </DialogHeader>
            <form onSubmit={stockForm.handleSubmit(onAgregarStock)} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Stock actual:</p>
                <p className="text-2xl font-bold">{Number(selectedProducto?.stock || 0)} {selectedProducto?.medida || ''}</p>
              </div>
              
              <div>
                <Label htmlFor="cantidad">Cantidad a agregar *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  step="0.01"
                  placeholder="40"
                  {...stockForm.register('cantidad')}
                />
                {stockForm.formState.errors.cantidad && (
                  <p className="text-sm text-red-500 mt-1">
                    {stockForm.formState.errors.cantidad.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Agregar Stock
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar producto */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onEditProducto)} className="space-y-4">
              {/* Reutilizar el mismo formulario que crear */}
              <div>
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  placeholder="Coca Cola"
                  {...form.register('nombre')}
                />
                {form.formState.errors.nombre && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.nombre.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-codigoBarras">Código de Barras</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-codigoBarras"
                      placeholder="7501234567890"
                      {...form.register('codigoBarras')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setScannerMode('edit');
                        setIsScannerOpen(true);
                      }}
                      title="Escanear código"
                    >
                      <Scan className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-marca">Marca</Label>
                  <Input
                    id="edit-marca"
                    placeholder="Coca Cola"
                    {...form.register('marca')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-contenido">Contenido</Label>
                  <Input
                    id="edit-contenido"
                    placeholder="Ej: 500"
                    {...form.register('contenido')}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-medida">Medida</Label>
                  <Select 
                    value={form.watch('medida')}
                    onValueChange={(value) => form.setValue('medida', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Litros (L)</SelectItem>
                      <SelectItem value="ML">Mililitros (ML)</SelectItem>
                      <SelectItem value="KG">Kilogramos (KG)</SelectItem>
                      <SelectItem value="GR">Gramos (GR)</SelectItem>
                      <SelectItem value="PZ">Piezas (PZ)</SelectItem>
                      <SelectItem value="MTR">Metros (MTR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-precioCompra">Precio Compra ($) *</Label>
                  <Input
                    id="edit-precioCompra"
                    type="number"
                    step="0.01"
                    placeholder="8.00"
                    {...form.register('precioCompra')}
                  />
                  {form.formState.errors.precioCompra && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.precioCompra.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-precioVenta">Precio Venta ($) *</Label>
                  <Input
                    id="edit-precioVenta"
                    type="number"
                    step="0.01"
                    placeholder="10.50"
                    {...form.register('precioVenta')}
                  />
                  {form.formState.errors.precioVenta && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.precioVenta.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-stock">Stock *</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  step="0.01"
                  placeholder="100"
                  {...form.register('stock')}
                />
                {form.formState.errors.stock && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.stock.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-categoriaId">Categoría *</Label>
                <Select 
                  value={form.watch('categoriaId')}
                  onValueChange={(value) => form.setValue('categoriaId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoriaId && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.categoriaId.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-descripcion">Descripción</Label>
                <Textarea
                  id="edit-descripcion"
                  placeholder="Descripción del producto"
                  {...form.register('descripcion')}
                />
              </div>

              <div>
                <Label htmlFor="edit-imagen">Imagen del Producto</Label>
                <div className="space-y-2">
                  <Input
                    id="edit-imagen"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                  />
                  {previewUrl && (
                    <div className="space-y-2">
                      <div className="mt-2">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (previewUrl) {
                            setTempImageUrl(previewUrl);
                            setIsCropperOpen(true);
                          }
                        }}
                      >
                        <Crop className="h-4 w-4 mr-2" />
                        Re-recortar imagen
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-permiteEncargo"
                  {...form.register('permiteEncargo')}
                />
                <Label htmlFor="edit-permiteEncargo">Permite encargo</Label>
              </div>

              <Button type="submit" className="w-full">
                Actualizar Producto
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Image Cropper */}
        {tempImageUrl && (
          <ImageCropper
            imageUrl={tempImageUrl}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            isOpen={isCropperOpen}
          />
        )}

        {/* Barcode Scanner */}
        <BarcodeScanner
          open={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={handleBarcodeScanned}
          title={
            scannerMode === 'stock' 
              ? 'Escanear para agregar stock'
              : 'Escanear código de barras'
          }
        />

        {/* Dialog de stock rápido (después de escanear) */}
        <Dialog open={isQuickStockOpen} onOpenChange={setIsQuickStockOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Stock - {selectedProducto?.nombre}</DialogTitle>
            </DialogHeader>
            <form onSubmit={stockForm.handleSubmit(onSubmitQuickStock)} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Producto:</p>
                  <p className="text-lg font-semibold">{selectedProducto?.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Código de barras:</p>
                  <p className="font-mono">{selectedProducto?.codigoBarras}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock actual:</p>
                  <p className="text-2xl font-bold">{Number(selectedProducto?.stock || 0)} {selectedProducto?.medida || ''}</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="quick-cantidad">Cantidad a agregar *</Label>
                <Input
                  id="quick-cantidad"
                  type="number"
                  step="0.01"
                  placeholder="10"
                  autoFocus
                  {...stockForm.register('cantidad')}
                />
                {stockForm.formState.errors.cantidad && (
                  <p className="text-sm text-red-500 mt-1">
                    {stockForm.formState.errors.cantidad.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Agregar Stock
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
