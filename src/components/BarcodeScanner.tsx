'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Keyboard, X, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export function BarcodeScanner({ open, onClose, onScan, title = 'Escanear código de barras' }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef('barcode-scanner-' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    return () => {
      // Limpiar el scanner al desmontar el componente
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {
          // Ignorar errores
        }
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    
    // Verificar si el navegador soporta acceso a la cámara
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Tu navegador no soporta acceso a la cámara. Usa el modo manual o un navegador más reciente.');
      return;
    }
    
    // Verificar si estamos en un contexto seguro (HTTPS o localhost)
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecureContext) {
      setError('La cámara solo funciona en conexiones seguras (HTTPS). Usa el modo manual.');
      return;
    }
    
    setScanning(true); // Marcar como scanning primero para que el div se renderice
    
    try {
      // Esperar un momento para que el elemento se renderice en el DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const scannerId = scannerIdRef.current;
      const element = document.getElementById(scannerId);
      
      if (!element) {
        throw new Error('No se pudo inicializar el scanner');
      }
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
          onClose();
        },
        () => {
          // Error callback - ignorar errores de escaneo
        }
      );
    } catch (err: any) {
      console.error('Error al iniciar scanner:', err);
      setScanning(false);
      
      // Mostrar mensajes específicos según el error
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        setError('Permisos de cámara denegados. Habilita el acceso a la cámara en la configuración de tu navegador e intenta de nuevo.');
      } else if (err.name === 'NotFoundError' || err.message?.includes('camera')) {
        setError('No se encontró ninguna cámara en tu dispositivo. Usa el modo manual.');
      } else if (err.message?.includes('not supported') || err.message?.includes('streaming')) {
        setError('Tu navegador no soporta el acceso a la cámara. Usa el modo manual o prueba con Chrome/Safari.');
      } else {
        setError('Error al iniciar la cámara. Intenta usar el modo manual.');
      }
    }
  };

  const stopScanning = async () => {
    setScanning(false);
    if (!scannerRef.current) return;
    
    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch (err) {
      // Ignorar completamente cualquier error al detener o limpiar
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      setManualMode(false);
      onClose();
    }
  };

  const handleClose = () => {
    stopScanning();
    setManualMode(false);
    setManualCode('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {!manualMode ? (
          <div className="space-y-4">
            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    <strong>Cómo habilitar permisos:</strong>
                    <br />
                    • Chrome/Edge: Click en el candado/ícono junto a la URL → Permisos del sitio → Cámara → Permitir
                    <br />
                    • Firefox: Click en el candado → Permisos → Cámara → Permitir
                    <br />
                    • Safari iOS: Ajustes → Safari → Cámara → Permitir
                  </p>
                </div>
              </div>
            )}

            {/* Scanner container */}
            {scanning ? (
              <div className="space-y-4">
                <div id={scannerIdRef.current} className="w-full rounded-lg overflow-hidden" />
                <Button onClick={stopScanning} variant="destructive" className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar escaneo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button onClick={startScanning} className="w-full" size="lg">
                  <Camera className="h-5 w-5 mr-2" />
                  Usar cámara
                </Button>
                <Button onClick={() => setManualMode(true)} variant="outline" className="w-full" size="lg">
                  <Keyboard className="h-5 w-5 mr-2" />
                  Ingresar manualmente
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <Label htmlFor="manual-code">Código de barras</Label>
              <Input
                id="manual-code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ingresa el código..."
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Aceptar
              </Button>
              <Button type="button" variant="outline" onClick={() => setManualMode(false)}>
                Volver
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
