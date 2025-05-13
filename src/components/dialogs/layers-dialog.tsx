import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PlusCircle,
  Trash2,
  Eye,
  EyeOff,
  Check,
  CheckCheck,
  Lock,
} from 'lucide-react';

interface Propss {
  showLayersDialog: boolean;
  setShowLayersDialog: (show: boolean) => void;
  projectId: Id<'projects'>;
  currentLayerId?: Id<'layers'>;
  onLayerSelect?: (layerId: Id<'layers'>) => void;
}

export const LayersDialog: React.FC<Propss> = ({
  showLayersDialog,
  setShowLayersDialog,
  projectId,
  currentLayerId,
  onLayerSelect,
}) => {
  const layers = useQuery(api.layers.getLayersByProject, { projectId });
  const createLayer = useMutation(api.layers.createLayer);
  const updateLayer = useMutation(api.layers.updateLayer);
  const deleteLayer = useMutation(api.layers.deleteLayer);

  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerColor, setNewLayerColor] = useState('#000000');
  const [editingLayer, setEditingLayer] = useState<{
    id: Id<'layers'>;
    field: 'name' | 'color' | 'lineType' | 'lineWidth';
  } | null>(null);

  const handleCreateLayer = async () => {
    if (!newLayerName) return;

    await createLayer({
      projectId,
      name: newLayerName,
      color: newLayerColor,
      lineWidth: 1,
      lineType: 'solid',
      isVisible: true,
      isLocked: false,
    });

    // Reset form
    setNewLayerName('');
    setNewLayerColor('#000000');
  };

  const handleUpdateLayer = async (
    layerId: Id<'layers'>,
    updates: {
      name?: string;
      color?: string;
      lineWidth?: number;
      lineType?: string;
      isVisible?: boolean;
      isLocked?: boolean;
    }
  ) => {
    await updateLayer({
      layerId,
      ...updates,
    });
    setEditingLayer(null);
  };

  const handleDeleteLayer = async (layerId: Id<'layers'>) => {
    // Prevent deleting the last layer
    if (layers && layers.length <= 1) {
      alert('Cannot delete the last layer');
      return;
    }

    await deleteLayer({ layerId });
  };

  if (!layers) return null;

  return (
    <Dialog open={showLayersDialog} onOpenChange={setShowLayersDialog}>
      <DialogContent className='sm:max-w-[800px] max-h-[600px] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Layer Management</DialogTitle>
        </DialogHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[50px]'>Active</TableHead>
              <TableHead className='w-[50px]'>Visible</TableHead>
              <TableHead className='w-[100px]'>Color</TableHead>
              <TableHead className='w-[200px]'>Name</TableHead>
              <TableHead className='w-[150px]'>Line Type</TableHead>
              <TableHead className='w-[100px]'>Line Width</TableHead>
              <TableHead className='w-[100px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {layers.map((layer) => (
              <TableRow
                key={layer._id}
                className={currentLayerId === layer._id ? 'bg-primary/10' : ''}
              >
                {/* Visibility Toggle */}
                <TableCell>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => onLayerSelect && onLayerSelect(layer._id)}
                  >
                    {layer._id === currentLayerId ? (
                      <Check color='green' className='w-6 h-6' />
                    ) : (
                      <span className='w-6 h-6' />
                    )}
                  </Button>
                </TableCell>

                {/* Visibility Toggle */}
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() =>
                          handleUpdateLayer(layer._id, {
                            isVisible: !layer.isVisible,
                          })
                        }
                      >
                        {layer.isVisible ? <Eye /> : <EyeOff />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {layer.isVisible ? 'Hide Layer' : 'Show Layer'}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>

                {/* Color Picker */}
                <TableCell>
                  <Input
                    type='color'
                    defaultValue={layer.color}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpdateLayer(layer._id, { color: e.target.value });
                    }}
                    onBlur={() => setEditingLayer(null)}
                    autoFocus
                    // className='p-0 w-7 h-7 rounded-full border border-primary'
                    // style={{ backgroundColor: layer.color }}
                  />
                </TableCell>

                {/* Layer Name */}
                <TableCell>
                  {editingLayer?.id === layer._id &&
                  editingLayer.field === 'name' ? (
                    <Input
                      defaultValue={layer.name}
                      onBlur={(e) =>
                        handleUpdateLayer(layer._id, {
                          name: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateLayer(layer._id, {
                            name: (e.target as HTMLInputElement).value,
                          });
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className='cursor-pointer hover:underline'
                      onClick={() => {
                        onLayerSelect && onLayerSelect(layer._id);
                        setEditingLayer({
                          id: layer._id,
                          field: 'name',
                        });
                      }}
                    >
                      {layer.name}
                    </span>
                  )}
                </TableCell>

                {/* Line Type */}
                <TableCell>
                  {editingLayer?.id === layer._id &&
                  editingLayer.field === 'lineType' ? (
                    <Select
                      defaultValue={layer.lineType}
                      onValueChange={(value) =>
                        handleUpdateLayer(layer._id, {
                          lineType: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Line Type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='solid'>Solid</SelectItem>
                        <SelectItem value='dashed'>Dashed</SelectItem>
                        <SelectItem value='dotted'>Dotted</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button
                      variant='ghost'
                      onClick={() =>
                        setEditingLayer({
                          id: layer._id,
                          field: 'lineType',
                        })
                      }
                    >
                      {layer.lineType.charAt(0).toUpperCase() +
                        layer.lineType.slice(1)}
                    </Button>
                  )}
                </TableCell>

                {/* Line Width */}
                <TableCell>
                  {editingLayer?.id === layer._id &&
                  editingLayer.field === 'lineWidth' ? (
                    <Input
                      type='number'
                      defaultValue={layer.lineWidth}
                      onChange={(e) =>
                        handleUpdateLayer(layer._id, {
                          lineWidth: Number(e.target.value),
                        })
                      }
                      min='1'
                      max='10'
                      className='w-20'
                      autoFocus
                    />
                  ) : (
                    <Button
                      variant='ghost'
                      onClick={() =>
                        setEditingLayer({
                          id: layer._id,
                          field: 'lineWidth',
                        })
                      }
                    >
                      {layer.lineWidth}
                    </Button>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className='flex space-x-2'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            disabled={layer.isDefault}
                            onClick={() => handleDeleteLayer(layer._id)}
                          >
                            {layer.isDefault ? (
                              <Lock className='w-4 h-4 text-muted-foreground' />
                            ) : (
                              <Trash2 className='w-4 h-4 text-destructive' />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Layer</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Create New Layer */}
        <div className='flex space-x-2 mt-4'>
          <div className='flex flex-1 items-center space-x-2'>
            <Input
              type='color'
              value={newLayerColor}
              className='w-20'
              onChange={(e) => setNewLayerColor(e.target.value)}
            />
            <Input
              placeholder='New Layer Name'
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateLayer} disabled={!newLayerName}>
            <PlusCircle className='mr-2 w-4 h-4' /> Add Layer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
