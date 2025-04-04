import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import * as megadataApi from '@/lib/api/megadata';
import type { Module } from '@/lib/api/megadata';

interface CreateCollectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, numTokens: number, startingIndex: number, modules: string[]) => void;
  isCreating: boolean;
}

export default function CreateCollectionWizard({ isOpen, onClose, onCreate, isCreating }: CreateCollectionWizardProps) {
  const [name, setName] = useState('');
  const [numTokens, setNumTokens] = useState(1);
  const [startingIndex, setStartingIndex] = useState(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [moduleSettings, setModuleSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isOpen) {
      loadModules();
    }
  }, [isOpen]);

  const loadModules = async () => {
    try {
      const modules = await megadataApi.getModules();
      setModules(modules);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  const handleCreate = () => {
    if (!name || selectedModules.length === 0) {
      alert('Please enter a collection name and select at least one module.');
      return;
    }
    onCreate(name, numTokens, startingIndex, selectedModules);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter collection name"
            />
          </div>

          <div className="space-y-2">
            <Label>Select Modules</Label>
            <div className="space-y-2">
              {modules.map((module) => (
                <div key={module.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={module.id}
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={() => handleModuleToggle(module.id)}
                  />
                  <Label htmlFor={module.id} className="font-normal">
                    {module.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numTokens">Number of Tokens</Label>
            <Input
              id="numTokens"
              type="number"
              min="1"
              value={numTokens}
              onChange={(e) => setNumTokens(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startingIndex">Starting Token ID</Label>
            <Input
              id="startingIndex"
              type="number"
              min="0"
              value={startingIndex}
              onChange={(e) => setStartingIndex(Number(e.target.value))}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={isCreating || !name || selectedModules.length === 0}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create Collection'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 