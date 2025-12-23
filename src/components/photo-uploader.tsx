'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Upload, X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { toast } from 'sonner';

interface ImageCropperProps {
  onImageSaved: (croppedImage: string) => void;
  onCancel: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return canvas.toDataURL('image/jpeg', 0.8);
};

const ImageCropper: React.FC<ImageCropperProps> = ({
  onImageSaved,
  onCancel
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onImageSaved(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setImageSrc('');
    setCrop({ x: 0, y: 0 });
    setRotation(0);
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center justify-between'>
            <span>Edit Profile Image</span>
            {/* <Button
              variant='ghost'
              size='sm'
              onClick={onCancel}
              className='h-6 w-6 p-0'
            >
              <X className='h-4 w-4' />
            </Button> */}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* File Input - Always visible and functional */}
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleFileSelect}
            className='hidden'
          />

          {!imageSrc ? (
            // Upload Area
            <div className='flex flex-col items-center justify-center space-y-4 py-12'>
              <div
                onClick={handleUploadClick}
                className='flex cursor-pointer flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-gray-400 hover:bg-gray-50'
              >
                <Upload className='h-12 w-12 text-gray-400' />
                <div className='text-center'>
                  <p className='text-lg font-medium text-gray-700'>
                    Click to upload an image
                  </p>
                  <p className='text-sm text-gray-500'>
                    Support for JPG, PNG files up to 5MB
                  </p>
                </div>
              </div>

              <Button onClick={handleUploadClick} className='w-fit max-w-xs'>
                <Upload className='mr-2 h-4 w-4' />
                Choose Image
              </Button>
            </div>
          ) : (
            // Cropping Interface
            <>
              <div className='relative h-96 w-full overflow-hidden rounded-lg bg-gray-100'>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  rotation={rotation}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape='round'
                  showGrid={false}
                />
              </div>

              {/* Controls */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>Zoom</label>
                  <div className='flex items-center space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                    >
                      <ZoomOut className='h-4 w-4' />
                    </Button>
                    <input
                      type='range'
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className='w-20'
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    >
                      <ZoomIn className='h-4 w-4' />
                    </Button>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>Rotation</label>
                  <div className='flex items-center space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setRotation(rotation - 90)}
                    >
                      <RotateCw className='h-4 w-4 rotate-180' />
                    </Button>
                    <input
                      type='range'
                      value={rotation}
                      min={-180}
                      max={180}
                      step={1}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className='w-20'
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setRotation(rotation + 90)}
                    >
                      <RotateCw className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex justify-between space-x-2'>
                <div className='flex space-x-2'>
                  <Button variant='outline' onClick={handleReset}>
                    Choose Different Image
                  </Button>
                </div>
                <div className='flex space-x-2'>
                  <Button variant='outline' onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className='min-w-[100px]'
                  >
                    {isProcessing ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                        Processing...
                      </>
                    ) : (
                      'Save Image'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
