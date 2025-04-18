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
import { Upload } from 'lucide-react';
import { config } from '@/lib/config';
import { useWeb3Auth } from '@/providers/web3auth-provider';
import { uploadFile } from '@/lib/api/megadata';

interface FilePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded: (fileUrl: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
  description?: string;
}

export function FilePickerDialog({
  isOpen,
  onClose,
  onFileUploaded,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024, // Default 10MB
  description = 'Upload a file',
}: FilePickerDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { walletAddress } = useWeb3Auth();

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
    if (accept && accept !== '*/*' && !file.type.match(accept.replace(/,/g, '|').replace(/\*/g, '.*'))) {
      setUploadError('Selected file type is not allowed');
      return;
    }
    if (file.size > maxSize) {
      setUploadError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }
    if (!walletAddress) {
      setUploadError('Please connect your wallet to upload files');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploadResult = await uploadFile(file);
      if (!uploadResult.hash) {
        throw new Error('Failed to get file hash from upload');
      }
      const fileUrl = `${config.megaRouterUri}/megahub/${uploadResult.hash}`;
      onFileUploaded(fileUrl);
      onClose();
    } catch (error) {
      console.error('Failed to upload file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            {description} Maximum file size is {Math.round(maxSize / 1024 / 1024)}MB.<br />
            The file will be associated with your connected account ({walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : 'No account connected'}).
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
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Drag and drop a file here, or click to select
            </div>
            <div className="relative mt-2">
              <Input
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isUploading || !walletAddress}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isUploading || !walletAddress}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Select File'}
              </Button>
            </div>
            {!walletAddress && <p className="text-xs text-destructive mt-2">Connect wallet to enable upload</p>}
          </div>
        </div>
        {uploadError && (
          <div className="mt-2 text-sm text-destructive">
            {uploadError}
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 