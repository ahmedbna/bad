'use client';

import React from 'react';
import { useCADContext } from '@/hooks/CADContext';
import {
  MousePointer,
  Slash,
  Circle,
  Square,
  Type,
  Pencil,
  Move,
  RotateCcw,
  Copy,
  Trash,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Save,
  FolderOpen,
  FileText,
  Undo,
  Redo,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define TypeScript interfaces
interface Tool {
  id: string;
  name: string;
  icon: LucideIcon | null;
}

interface FileOption {
  id: string;
  name: string;
  icon: LucideIcon;
}

// SVG components for custom icons
const LineIcon: React.FC = () => (
  <svg
    className='h-4 w-4'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <line x1='12' y1='2' x2='12' y2='22' />
    <line x1='2' y1='12' x2='22' y2='12' />
  </svg>
);

const SnapIcon: React.FC = () => (
  <svg
    className='h-4 w-4'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <rect x='6' y='6' width='4' height='4' />
    <rect x='14' y='6' width='4' height='4' />
    <rect x='6' y='14' width='4' height='4' />
    <rect x='14' y='14' width='4' height='4' />
  </svg>
);

// Tool definitions
const tools: Tool[] = [
  { id: 'pointer', name: 'Selection', icon: MousePointer },
  { id: 'line', name: 'Line', icon: Slash },
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'polyline', name: 'Polyline', icon: Pencil },
  { id: 'text', name: 'Text', icon: Type },
  { id: 'move', name: 'Move', icon: Move },
  { id: 'rotate', name: 'Rotate', icon: RotateCcw },
  { id: 'copy', name: 'Copy', icon: Copy },
  { id: 'delete', name: 'Delete', icon: Trash },
];

// File menu options
const fileOptions: FileOption[] = [
  { id: 'new', name: 'New', icon: FileText },
  { id: 'open', name: 'Open', icon: FolderOpen },
  { id: 'save', name: 'Save', icon: Save },
  { id: 'export', name: 'Export', icon: FileText },
];

export const Toolbar = () => {
  const {
    currentTool,
    setCurrentTool,
    viewState,
    setViewState,
    undo,
    redo,
    setCommandLine,
  } = useCADContext();

  const handleToolClick = (toolId: string): void => {
    setCurrentTool(toolId);
    // Update command line when tool is selected
    setCommandLine(`Tool: ${toolId}`);
  };

  const handleFileAction = (actionId: string): void => {
    switch (actionId) {
      case 'new':
        if (
          window.confirm('Create new drawing? Unsaved changes will be lost.')
        ) {
          // Clear current drawing and reset view
          // This would be handled by the context
          setCommandLine('New drawing created');
        }
        break;
      case 'open':
        // Open file dialog and load drawing
        setCommandLine('Open file dialog');
        // Implement file loading logic
        break;
      case 'save':
        // Save current drawing
        setCommandLine('Saving drawing...');
        // Implement file saving logic
        break;
      case 'export':
        // Export drawing to different formats
        setCommandLine('Export options');
        // Implement export logic
        break;
      default:
        console.warn(`Unknown file action: ${actionId}`);
    }
  };

  const toggleGrid = (): void => {
    setViewState((prev) => ({
      ...prev,
      grid: {
        ...prev.grid,
        enabled: !prev.grid.enabled,
      },
    }));

    setCommandLine(`Grid ${viewState.grid.enabled ? 'disabled' : 'enabled'}`);
  };

  const toggleSnap = (): void => {
    setViewState((prev) => ({
      ...prev,
      grid: {
        ...prev.grid,
        snap: !prev.grid.snap,
      },
    }));

    setCommandLine(`Grid snap ${viewState.grid.snap ? 'disabled' : 'enabled'}`);
  };

  const zoomIn = (): void => {
    setViewState((prev) => ({
      ...prev,
      zoom: prev.zoom * 1.2,
    }));

    setCommandLine(`Zoom: ${Math.round(viewState.zoom * 120)}%`);
  };

  const zoomOut = (): void => {
    setViewState((prev) => ({
      ...prev,
      zoom: prev.zoom / 1.2,
    }));

    setCommandLine(`Zoom: ${Math.round((viewState.zoom / 1.2) * 100)}%`);
  };

  return (
    <div className='bg-slate-800 text-white p-1 flex items-center space-x-2'>
      {/* File Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 text-white hover:bg-slate-700'>
            File
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>File Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {fileOptions.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => handleFileAction(option.id)}
              className='flex items-center gap-2'
            >
              <option.icon className='h-4 w-4' />
              {option.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Separator */}
      <div className='h-8 w-px bg-slate-600' />

      {/* Undo/Redo Buttons */}
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 text-white hover:bg-slate-700'
        onClick={undo}
        title='Undo'
      >
        <Undo className='h-4 w-4' />
      </Button>

      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 text-white hover:bg-slate-700'
        onClick={redo}
        title='Redo'
      >
        <Redo className='h-4 w-4' />
      </Button>

      {/* Separator */}
      <div className='h-8 w-px bg-slate-600' />

      {/* Drawing Tools */}
      <div className='flex space-x-1'>
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={currentTool === tool.id ? 'secondary' : 'ghost'}
            size='icon'
            className='h-8 w-8 text-white hover:bg-slate-700'
            onClick={() => handleToolClick(tool.id)}
            title={tool.name}
          >
            {tool.icon ? <tool.icon className='h-4 w-4' /> : <LineIcon />}
          </Button>
        ))}
      </div>

      {/* Separator */}
      <div className='h-8 w-px bg-slate-600' />

      {/* Grid & View Controls */}
      <Button
        variant={viewState.grid.enabled ? 'secondary' : 'ghost'}
        size='icon'
        className='h-8 w-8 text-white hover:bg-slate-700'
        onClick={toggleGrid}
        title='Toggle Grid'
      >
        <Grid className='h-4 w-4' />
      </Button>

      <Button
        variant={viewState.grid.snap ? 'secondary' : 'ghost'}
        size='icon'
        className='h-8 w-8 text-white hover:bg-slate-700'
        onClick={toggleSnap}
        title='Toggle Grid Snap'
      >
        <SnapIcon />
      </Button>

      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 text-white hover:bg-slate-700'
        onClick={zoomIn}
        title='Zoom In'
      >
        <ZoomIn className='h-4 w-4' />
      </Button>

      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 text-white hover:bg-slate-700'
        onClick={zoomOut}
        title='Zoom Out'
      >
        <ZoomOut className='h-4 w-4' />
      </Button>

      {/* Separator */}
      <div className='h-8 w-px bg-slate-600' />

      {/* Layers Control */}
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 text-white hover:bg-slate-700'
        title='Layers'
        onClick={() => setCommandLine('Layer management')}
      >
        <Layers className='h-4 w-4' />
      </Button>
    </div>
  );
};
