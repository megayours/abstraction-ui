import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import * as megadataApi from '@/lib/api/megadata';
import type { Module } from '@/lib/api/megadata';
import { SPECIAL_MODULES } from '@/lib/constants';

interface CreateCollectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, numTokens: number, startingIndex: number, modules: string[], defaultData: Record<string, string>) => void;
  isCreating: boolean;
}

const STEPS = {
  NAME: 1,
  MODULES: 2,
  DETAILS: 3,
};

export default function CreateCollectionWizard({
  isOpen,
  onClose,
  onCreate,
  isCreating
}: CreateCollectionWizardProps) {
  const [currentStep, setCurrentStep] = useState(STEPS.NAME);
  const [name, setName] = useState('');
  const [numTokens, setNumTokens] = useState(1);
  const [startingIndex, setStartingIndex] = useState(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(STEPS.NAME);
      setName('');
      setNumTokens(1);
      setStartingIndex(0);
      setSelectedModules([]);
      loadModules();
    }
  }, [isOpen]);

  const loadModules = async () => {
    try {
      const fetchedModules = await megadataApi.getModules();
      // Filter out the special modules
      const filteredModules = fetchedModules
        .filter(module => module.id !== SPECIAL_MODULES.EXTENDING_METADATA)
        .filter(module => module.id !== SPECIAL_MODULES.EXTENDING_COLLECTION);
      setModules(filteredModules);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModules(prev => {
      const isSelected = prev.includes(moduleId);
      return isSelected ? prev.filter(id => id !== moduleId) : [...prev, moduleId];
    });
  };

  const handleNext = async () => {
    if (currentStep === STEPS.NAME && name.trim() === '') {
      alert('Please enter a collection name.');
      return;
    }
    if (currentStep === STEPS.MODULES && selectedModules.length === 0) {
      alert('Please select at least one module.');
      return;
    }

    if (currentStep < STEPS.DETAILS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > STEPS.NAME) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = () => {
    if (!name || selectedModules.length === 0 || numTokens <= 0) {
      alert('Please ensure all fields are filled correctly.');
      return;
    }

    const requiredFields = new Set<string>();
    const selectedModuleSchemas = modules
      .filter(mod => selectedModules.includes(mod.id))
      .forEach(mod => {
        if (mod.schema?.required && Array.isArray(mod.schema.required)) {
          mod.schema.required.forEach(field => requiredFields.add(field as string));
        }
      });

    const defaultData: Record<string, string> = {};
    requiredFields.forEach(field => {
      defaultData[field] = '';
    });

    onCreate(name, numTokens, startingIndex, selectedModules, defaultData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.NAME:
        return (
          <div className="space-y-4">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter collection name"
              autoFocus
            />
          </div>
        );
      case STEPS.MODULES:
        return (
          <div className="space-y-4">
            <Label>Select Modules</Label>
            <p className="text-sm text-muted-foreground">Choose the modules to include in this collection.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto p-1">
              {modules.length === 0 && <p>Loading modules...</p>}
              {modules.map((module) => (
                <Card
                  key={module.id}
                  onClick={() => handleModuleSelect(module.id)}
                  className={`cursor-pointer transition-colors ${selectedModules.includes(module.id) ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-muted-foreground/50'}`}
                >
                  <CardHeader>
                    <CardTitle>{module.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{module.description || 'No description available.'}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case STEPS.DETAILS:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numTokens">Number of Tokens</Label>
              <Input
                id="numTokens"
                type="number"
                min="1"
                value={numTokens}
                onChange={(e) => setNumTokens(Math.max(1, Number(e.target.value)))}
              />
              <p className="text-sm text-muted-foreground">Total number of tokens this collection will contain.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startingIndex">Starting Token ID</Label>
              <Input
                id="startingIndex"
                type="number"
                min="0"
                value={startingIndex}
                onChange={(e) => setStartingIndex(Math.max(0, Number(e.target.value)))}
              />
              <p className="text-sm text-muted-foreground">The ID of the first token (e.g., 0 or 1).</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>
            Create New Collection (Step {currentStep} of {STEPS.DETAILS})
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 min-h-[250px] flex flex-col justify-center">
          {renderStepContent()}
        </div>
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === STEPS.NAME || isCreating}
          >
            Previous
          </Button>

          {currentStep < STEPS.DETAILS && (
            <Button
              onClick={handleNext}
              disabled={
                isCreating ||
                (currentStep === STEPS.NAME && !name.trim()) ||
                (currentStep === STEPS.MODULES && selectedModules.length === 0)
              }
            >
              Next
            </Button>
          )}

          {currentStep === STEPS.DETAILS && (
            <Button
              onClick={handleCreate}
              disabled={isCreating || !name || selectedModules.length === 0 || numTokens <= 0}
            >
              {isCreating ? 'Creating...' : 'Create Collection'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 