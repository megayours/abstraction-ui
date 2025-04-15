import React, { useState, useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { ExternalLink, Search } from 'lucide-react';
import type { Module } from '@/lib/api/megadata';

export type ModuleSelectorMode = 'checkbox' | 'card';

interface ModuleSelectorProps {
  availableModules: Module[];
  selectedModuleIds: string[];
  onChange: (selected: string[]) => void;
  mode?: ModuleSelectorMode;
  label?: string;
  disabledModuleIds?: string[];
  className?: string;
  style?: React.CSSProperties;
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  availableModules,
  selectedModuleIds,
  onChange,
  mode = 'checkbox',
  label = 'Select Modules',
  disabledModuleIds = [],
  className,
  style,
}) => {
  const [search, setSearch] = useState('');

  const filteredModules = useMemo(() => {
    if (!search.trim()) return availableModules;
    const q = search.trim().toLowerCase();
    return availableModules.filter(
      m => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    );
  }, [availableModules, search]);

  const handleToggle = (id: string) => {
    if (selectedModuleIds.includes(id)) {
      onChange(selectedModuleIds.filter(mid => mid !== id));
    } else {
      onChange([...selectedModuleIds, id]);
    }
  };

  return (
    <div className={className} style={style}>
      {label && <Label className="mb-2 block text-foreground">{label}</Label>}
      <div className="mb-2 flex items-center gap-2">
        <div className="relative w-full">
          <Input
            type="text"
            placeholder="Search modules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm rounded-md border bg-background/80 focus:border-primary"
            aria-label="Search modules"
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <ScrollArea className="h-48 w-full rounded-md border bg-background/60">
        <div className="flex flex-col gap-2 p-2">
          {filteredModules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No modules found.</p>
          ) : (
            filteredModules.map(module => (
              <Card
                key={module.id}
                className="flex flex-row items-start gap-3 p-3 border border-border rounded-lg shadow-none bg-card/80 hover:border-primary/30 transition-all duration-100"
              >
                <Checkbox
                  id={`module-${module.id}`}
                  checked={selectedModuleIds.includes(module.id)}
                  onCheckedChange={() => handleToggle(module.id)}
                  disabled={disabledModuleIds.includes(module.id)}
                  className="mt-1 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-base text-foreground truncate">{module.name}</span>
                    <a
                      href={`https://code.megayours.com/repository/${module.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={0}
                      className="ml-1 text-primary/80 hover:text-primary flex items-center gap-1"
                      title="Read more about this module"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Read more</span>
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 leading-snug">{module.description}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}; 