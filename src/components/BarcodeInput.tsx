'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onBarcodeScanned?: (barcode: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Input que detecta automáticamente cuando un lector de código de barras 
 * (que funciona como teclado) ingresa datos rápidamente
 */
export function BarcodeInput({ 
  value, 
  onChange, 
  onBarcodeScanned,
  placeholder = 'Código de barras',
  className 
}: BarcodeInputProps) {
  const [buffer, setBuffer] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Solo capturar si el input está enfocado
      if (document.activeElement !== inputRef.current) return;

      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Si es Enter, procesar el código escaneado
      if (e.key === 'Enter' && buffer.length > 0) {
        e.preventDefault();
        const scannedCode = buffer;
        setBuffer('');
        onChange(scannedCode);
        
        if (onBarcodeScanned) {
          onBarcodeScanned(scannedCode);
        }
        return;
      }

      // Agregar al buffer
      if (e.key.length === 1) {
        const newBuffer = buffer + e.key;
        setBuffer(newBuffer);

        // Si después de 100ms no hay más caracteres, resetear buffer
        // (los scanners suelen enviar todos los caracteres en < 50ms)
        timeoutRef.current = setTimeout(() => {
          setBuffer('');
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [buffer, onChange, onBarcodeScanned]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      title="Escanea con lector de código de barras o ingresa manualmente"
    />
  );
}
