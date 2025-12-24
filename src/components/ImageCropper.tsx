'use client';

import { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function ImageCropper({ imageUrl, onCropComplete, onCancel, isOpen }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const getCroppedImg = async (): Promise<File> => {
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    
    if (!image || !completedCrop) {
      throw new Error('No image or crop');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    // Llenar con blanco primero para manejar transparencia
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropComplete = async () => {
    try {
      const croppedFile = await getCroppedImg();
      onCropComplete(croppedFile);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Recortar Imagen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Imagen a recortar"
                style={{ maxWidth: '100%', maxHeight: '60vh' }}
              />
            </ReactCrop>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleCropComplete}>
              Aplicar Recorte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
