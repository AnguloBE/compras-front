'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const loginPhoneSchema = z.object({
  telefono: z.string().min(8, 'Teléfono debe tener al menos 8 dígitos'),
});

const registerPhoneSchema = z.object({
  telefono: z.string().min(8, 'Teléfono debe tener al menos 8 dígitos'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
});

const codeSchema = z.object({
  codigo: z.string().length(6, 'Código debe tener 6 dígitos'),
});

type LoginPhoneForm = z.infer<typeof loginPhoneSchema>;
type RegisterPhoneForm = z.infer<typeof registerPhoneSchema>;
type CodeForm = z.infer<typeof codeSchema>;

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [telefono, setTelefono] = useState('');
  const [esNuevoUsuario, setEsNuevoUsuario] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const loginPhoneForm = useForm<LoginPhoneForm>({
    resolver: zodResolver(loginPhoneSchema),
  });

  const registerPhoneForm = useForm<RegisterPhoneForm>({
    resolver: zodResolver(registerPhoneSchema),
  });

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
  });

  const onSubmitLoginPhone = async (data: LoginPhoneForm) => {
    try {
      const response = await api.post('/auth/solicitar-codigo', {
        telefono: data.telefono,
      });
      setTelefono(data.telefono);
      setEsNuevoUsuario(response.data.esNuevoUsuario);
      codeForm.reset();
      setStep('code');
      toast.success('Código enviado a WhatsApp');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al solicitar código');
    }
  };

  const onSubmitRegisterPhone = async (data: RegisterPhoneForm) => {
    try {
      const response = await api.post('/auth/solicitar-codigo', {
        telefono: data.telefono,
        nombre: data.nombre,
      });
      setTelefono(data.telefono);
      setEsNuevoUsuario(response.data.esNuevoUsuario);
      codeForm.reset();
      setStep('code');
      toast.success('Código enviado a WhatsApp');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al solicitar código');
    }
  };

  const onSubmitCode = async (data: CodeForm) => {
    try {
      const response = await api.post('/auth/verificar-codigo', {
        telefono,
        codigo: data.codigo,
      });
      
      console.log('Respuesta de verificación:', response.data);
      
      // El backend devuelve { accessToken, usuario }
      const { accessToken, usuario } = response.data;
      
      if (!accessToken) {
        toast.error('No se recibió token del servidor');
        return;
      }
      
      console.log('Token recibido:', accessToken.substring(0, 20) + '...');
      console.log('Usuario recibido:', usuario);
      
      // Hacer login con token y usuario
      await login(accessToken, usuario);
      
      // Verificar que se guardó
      const savedToken = localStorage.getItem('token');
      console.log('Token guardado en localStorage:', savedToken?.substring(0, 20) + '...');
      
      toast.success('Inicio de sesión exitoso');
      router.push('/');
    } catch (error: any) {
      console.error('Error en login:', error);
      toast.error(error.response?.data?.message || 'Código inválido');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Compras Angostura</CardTitle>
          <CardDescription>
            {step === 'phone'
              ? (mode === 'login'
                ? 'Ingresa tu teléfono para iniciar sesión'
                : 'Completa el formulario para registrarte')
              : 'Ingresa el código enviado a tu WhatsApp'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <>
              {/* Tabs para Login/Register */}
              <div className="flex gap-2 mb-6">
                <Button
                  type="button"
                  variant={mode === 'login' ? 'default' : 'outline'}
                  onClick={() => setMode('login')}
                  className="flex-1"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  type="button"
                  variant={mode === 'register' ? 'default' : 'outline'}
                  onClick={() => setMode('register')}
                  className="flex-1"
                >
                  Registrarse
                </Button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={loginPhoneForm.handleSubmit(onSubmitLoginPhone)} className="space-y-4">
                  <div>
                    <Label htmlFor="login-telefono">Teléfono</Label>
                    <Input
                      id="login-telefono"
                      placeholder="12345678"
                      {...loginPhoneForm.register('telefono')}
                    />
                    {loginPhoneForm.formState.errors.telefono && (
                      <p className="text-sm text-red-500 mt-1">
                        {loginPhoneForm.formState.errors.telefono.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    Enviar código
                  </Button>
                </form>
              ) : (
                <form onSubmit={registerPhoneForm.handleSubmit(onSubmitRegisterPhone)} className="space-y-4">
                  <div>
                    <Label htmlFor="register-nombre">Nombre *</Label>
                    <Input
                      id="register-nombre"
                      placeholder="Tu nombre"
                      {...registerPhoneForm.register('nombre')}
                    />
                    {registerPhoneForm.formState.errors.nombre && (
                      <p className="text-sm text-red-500 mt-1">
                        {registerPhoneForm.formState.errors.nombre.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="register-telefono">Teléfono *</Label>
                    <Input
                      id="register-telefono"
                      placeholder="12345678"
                      {...registerPhoneForm.register('telefono')}
                    />
                    {registerPhoneForm.formState.errors.telefono && (
                      <p className="text-sm text-red-500 mt-1">
                        {registerPhoneForm.formState.errors.telefono.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    Registrarse
                  </Button>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className="space-y-4">
              <div>
                <Label>Teléfono</Label>
                <p className="text-sm font-medium text-gray-700 mb-3">{telefono}</p>
              </div>
              <div>
                <Label htmlFor="codigo">Código de verificación</Label>
                <Input
                  id="codigo"
                  placeholder="123456"
                  maxLength={6}
                  autoFocus
                  {...codeForm.register('codigo')}
                />
                {codeForm.formState.errors.codigo && (
                  <p className="text-sm text-red-500 mt-1">
                    {codeForm.formState.errors.codigo.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Verificar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('phone');
                  loginPhoneForm.reset();
                  registerPhoneForm.reset();
                }}
              >
                Cambiar teléfono
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
