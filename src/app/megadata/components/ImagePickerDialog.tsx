import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { saveLocalItem } from '@/lib/api/localStorage';
import { ExtendedMegaDataItem } from '@/lib/api/localStorage';
import { uploadFile } from '@/lib/api/megaforwarder';
import { config } from '@/lib/config';
import { useWallet } from '@/contexts/WalletContext';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

interface ImagePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: (imageUrl: string) => void;
  item: ExtendedMegaDataItem;
}

export function ImagePickerDialog({
  isOpen,
  onClose,
  onImageUploaded,
  item
}: ImagePickerDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { account, signMessage, accountType } = useWallet();

  const createMessage = (account: string, timestamp: number) => {
    return `MegaYours File Upload: ${account} at ${timestamp}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setUploadError('Only JPEG and PNG images are supported');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    if (!account) {
      setUploadError('Please connect your wallet to upload images');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create signature
      const timestamp = Date.now();
      const message = createMessage(account, timestamp);
      const signature = await signMessage(message);

      // Upload to blockchain
      const uploadResult = await uploadFile({
        auth: {
          type: accountType || "evm",
          timestamp,
          account,
          signature,
        },
        data: buffer,
        contentType: file.type,
      });

      if ('error' in uploadResult) {
        throw new Error(uploadResult.error);
      }

      if (!uploadResult.hash) {
        throw new Error('Failed to get image hash from upload');
      }

      // Construct the router URI
      const imageUrl = `${config.megaRouterUri}/megahub/${uploadResult.hash}`;

      // Update the item with the new image URL
      const updatedItem: ExtendedMegaDataItem = {
        ...item,
        properties: {
          ...item.properties,
          erc721: {
            ...item.properties.erc721,
            image: imageUrl,
          }
        }
      };

      // Save the updated item
      saveLocalItem(updatedItem);

      onImageUploaded(imageUrl);
      onClose();
    } catch (error) {
      console.error('Failed to upload image:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
          <DialogDescription>
            Upload a JPEG or PNG image to use for this token. Maximum file size is 10MB.
          </DialogDescription>
        </DialogHeader>
        <div
          className={`mt-4 p-8 border-2 border-dashed rounded-lg text-center ${
            isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Drag and drop an image here, or click to select
            </div>
            <div className="relative mt-2">
              <Input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
                disabled={isUploading}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Select Image'}
              </Button>
            </div>
          </div>
        </div>
        {uploadError && (
          <div className="mt-2 text-sm text-destructive">
            {uploadError}
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 