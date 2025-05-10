'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EditingState } from '../editing/constants';
import { Input } from '@/components/ui/input';

type Props = {
  editingState: EditingState;
  setEditingState: (state: EditingState) => void;
  commandBuffer: string;
  onParameterInput: (paramName: string, value: number) => void;
  onExecuteCommand: (command: string) => void;
};

export const CommandLine = ({
  editingState,
  setEditingState,
  commandBuffer,
  onParameterInput,
  onExecuteCommand,
}: Props) => {
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when editing state changes
  useEffect(() => {
    if (editingState.isActive && editingState.phase === 'parameter') {
      inputRef.current?.focus();
    }
  }, [editingState.isActive, editingState.phase]);

  // Add visual prompts based on editing state
  const getPrompt = () => {
    if (!editingState.isActive) return 'Command:';

    switch (editingState.tool) {
      case 'rotate':
        return editingState.phase === 'parameter'
          ? 'Specify rotation angle:'
          : editingState.phase === 'base'
            ? 'Specify base point:'
            : 'Specify target point:';
      case 'offset':
        return editingState.phase === 'parameter'
          ? 'Specify offset distance:'
          : editingState.phase === 'select'
            ? 'Select object to offset:'
            : 'Specify side to offset:';
      case 'move':
        return editingState.phase === 'select'
          ? 'Select objects to move:'
          : editingState.phase === 'base'
            ? 'Specify base point:'
            : 'Specify target point:';
      case 'copy':
        return editingState.phase === 'select'
          ? 'Select objects to copy:'
          : editingState.phase === 'base'
            ? 'Specify base point:'
            : 'Specify target point:';
      case 'mirror':
        return editingState.phase === 'select'
          ? 'Select objects to mirror:'
          : editingState.phase === 'base'
            ? 'Specify first point of mirror line:'
            : 'Specify second point of mirror line:';
      case 'trim':
        return editingState.phase === 'select'
          ? 'Select cutting edges:'
          : 'Select object to trim:';
      case 'extend':
        return editingState.phase === 'select'
          ? 'Select boundary edges:'
          : 'Select object to extend:';
        break;
    }
  };
};
