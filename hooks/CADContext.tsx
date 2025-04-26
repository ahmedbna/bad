'use client';

import React, {
  createContext,
  useContext,
  useState,
  useReducer,
  ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define types for points and shapes
export interface Point {
  x: number;
  y: number;
}

// Base entity interface
interface BaseEntity {
  id: string;
  type: string;
  layer: string;
  created?: number;
  properties: {
    strokeColor: string;
    strokeWidth: number;
    fillColor?: string;
  };
}

// Specific entity types
interface LineEntity extends BaseEntity {
  type: 'line';
  start: Point;
  end: Point;
}

interface CircleEntity extends BaseEntity {
  type: 'circle';
  center: Point;
  radius: number;
}

interface RectangleEntity extends BaseEntity {
  type: 'rectangle';
  topLeft: Point;
  width: number;
  height: number;
}

interface PolylineEntity extends BaseEntity {
  type: 'polyline';
  points: Point[];
}

interface TextEntity extends BaseEntity {
  type: 'text';
  position: Point;
  content: string;
  fontSize: number;
  fontFamily: string;
}

// Union type for all entity types
export type Entity =
  | LineEntity
  | CircleEntity
  | RectangleEntity
  | PolylineEntity
  | TextEntity;

// Layer interface
interface Layer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
}

// View state interface
export interface ViewState {
  zoom: number;
  panOffset: Point;
  grid: {
    enabled: boolean;
    size: number;
    snap: boolean;
  };
}

// Command history interface
interface CommandHistory {
  past: Entity[][];
  future: Entity[][];
}

// Entity reducer action types
type EntityAction =
  | { type: 'ADD_ENTITY'; payload: Omit<Entity, 'id'> }
  | { type: 'UPDATE_ENTITY'; payload: Partial<Entity> & { id: string } }
  | { type: 'DELETE_ENTITY'; payload: string[] }
  | { type: 'CLEAR_ENTITIES' }
  | { type: 'SET_ENTITIES'; payload: Entity[] };

// History reducer action types
type HistoryAction =
  | { type: 'ADD_COMMAND'; payload: { prevState: Entity[] } }
  | { type: 'UNDO'; payload: { currentState: Entity[] } }
  | { type: 'REDO'; payload: { currentState: Entity[] } }
  | { type: 'CLEAR_HISTORY' };

// Context type definition
interface CADContextType {
  // View state
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;

  // Entities
  entities: Entity[];
  addEntity: (entity: Omit<Entity, 'id'>) => void;
  updateEntity: (entity: Partial<Entity> & { id: string }) => void;
  deleteEntities: (ids: string[]) => void;

  // Selection
  selectedEntities: string[];
  setSelectedEntities: React.Dispatch<React.SetStateAction<string[]>>;

  // Tools
  currentTool: string | null;
  setCurrentTool: React.Dispatch<React.SetStateAction<string | null>>;

  // Command line
  commandLine: string;
  setCommandLine: React.Dispatch<React.SetStateAction<string>>;

  // Layers
  layers: Layer[];
  currentLayer: string;
  setCurrentLayer: React.Dispatch<React.SetStateAction<string>>;
  addLayer: (layer: Partial<Layer> & { name: string }) => string;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  deleteLayer: (layerId: string) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Utility functions
  screenToWorld: (screenPoint: Point) => Point;
  worldToScreen: (worldPoint: Point) => Point;
  snapToGrid: (point: Point) => Point;
}

// Create context with undefined default
const CADContext = createContext<CADContextType | undefined>(undefined);

// Initial state
const initialViewState: ViewState = {
  zoom: 1,
  panOffset: {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  },
  grid: {
    enabled: true,
    size: 20,
    snap: true,
  },
};

// Entity reducer
function entityReducer(state: Entity[], action: EntityAction): Entity[] {
  switch (action.type) {
    case 'ADD_ENTITY':
      return [...state, { ...action.payload, id: uuidv4() } as Entity];
    case 'UPDATE_ENTITY':
      return state.map((entity) =>
        entity.id === action.payload.id
          ? ({ ...entity, ...action.payload } as Entity)
          : entity
      );
    case 'DELETE_ENTITY':
      return state.filter((entity) => !action.payload.includes(entity.id));
    case 'CLEAR_ENTITIES':
      return [];
    case 'SET_ENTITIES':
      return action.payload;
    default:
      return state;
  }
}

// Command history reducer
function historyReducer(
  state: CommandHistory,
  action: HistoryAction
): CommandHistory {
  switch (action.type) {
    case 'ADD_COMMAND':
      return {
        past: [...state.past, action.payload.prevState],
        future: [],
      };
    case 'UNDO':
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);

      return {
        past: newPast,
        future: [action.payload.currentState, ...state.future],
      };
    case 'REDO':
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);

      return {
        past: [...state.past, action.payload.currentState],
        future: newFuture,
      };
    case 'CLEAR_HISTORY':
      return { past: [], future: [] };
    default:
      return state;
  }
}

// Props for the provider
interface CADProviderProps {
  children: ReactNode;
}

// Provider component
export function CADProvider({ children }: CADProviderProps) {
  // View state
  const [viewState, setViewState] = useState<ViewState>(initialViewState);

  // Entities state using reducer
  const [entities, dispatchEntities] = useReducer(
    entityReducer,
    [] as Entity[]
  );

  // Command history using reducer
  const [commandHistory, dispatchHistory] = useReducer(historyReducer, {
    past: [],
    future: [],
  } as CommandHistory);

  // Current tool state
  const [currentTool, setCurrentTool] = useState<string | null>(null);

  // Selection state
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

  // Command line state
  const [commandLine, setCommandLine] = useState<string>('');

  // Layer state
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'default',
      name: 'Default',
      color: '#000000',
      visible: true,
      locked: false,
    },
  ]);
  const [currentLayer, setCurrentLayer] = useState<string>('default');

  // Entity operations
  const addEntity = (entity: Omit<Entity, 'id'>): void => {
    // Save current state for undo
    dispatchHistory({
      type: 'ADD_COMMAND',
      payload: {
        prevState: entities,
      },
    });

    // Add the entity
    dispatchEntities({
      type: 'ADD_ENTITY',
      payload: {
        ...entity,
        layer: currentLayer,
        created: Date.now(),
      },
    });
  };

  const updateEntity = (entity: Partial<Entity> & { id: string }): void => {
    dispatchHistory({
      type: 'ADD_COMMAND',
      payload: {
        prevState: entities,
      },
    });

    dispatchEntities({
      type: 'UPDATE_ENTITY',
      payload: entity,
    });
  };

  const deleteEntities = (ids: string[]): void => {
    dispatchHistory({
      type: 'ADD_COMMAND',
      payload: {
        prevState: entities,
      },
    });

    dispatchEntities({
      type: 'DELETE_ENTITY',
      payload: ids,
    });

    // Clear selection if deleting selected entities
    setSelectedEntities((prevSelected) =>
      prevSelected.filter((id) => !ids.includes(id))
    );
  };

  // Undo / Redo operations
  const undo = (): void => {
    if (commandHistory.past.length === 0) return;

    dispatchHistory({
      type: 'UNDO',
      payload: {
        currentState: entities,
      },
    });

    // Get previous state
    const previousState = commandHistory.past[commandHistory.past.length - 1];

    // Set entities to the previous state
    dispatchEntities({
      type: 'SET_ENTITIES',
      payload: previousState,
    });

    // Clear selection
    setSelectedEntities([]);
  };

  const redo = (): void => {
    if (commandHistory.future.length === 0) return;

    dispatchHistory({
      type: 'REDO',
      payload: {
        currentState: entities,
      },
    });

    // Get next state
    const nextState = commandHistory.future[0];

    // Set entities to the next state
    dispatchEntities({
      type: 'SET_ENTITIES',
      payload: nextState,
    });

    // Clear selection
    setSelectedEntities([]);
  };

  // Layer operations
  const addLayer = (layer: Partial<Layer> & { name: string }): string => {
    const newLayer: Layer = {
      id: uuidv4(),
      name: layer.name,
      color: layer.color || '#000000',
      visible: true,
      locked: false,
    };

    setLayers((prev) => [...prev, newLayer]);
    return newLayer.id;
  };

  const updateLayer = (layerId: string, updates: Partial<Layer>): void => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      )
    );
  };

  const deleteLayer = (layerId: string): void => {
    // Don't delete the default layer
    if (layerId === 'default') return;

    // Move entities from this layer to default
    entities.forEach((entity) => {
      if (entity.layer === layerId) {
        updateEntity({ ...entity, layer: 'default' });
      }
    });

    // Remove the layer
    setLayers((prev) => prev.filter((layer) => layer.id !== layerId));

    // Set current layer to default if deleting current layer
    if (currentLayer === layerId) {
      setCurrentLayer('default');
    }
  };

  // Convert between screen and world coordinates
  const screenToWorld = (screenPoint: Point): Point => {
    return {
      x: (screenPoint.x - viewState.panOffset.x) / viewState.zoom,
      y: (screenPoint.y - viewState.panOffset.y) / viewState.zoom,
    };
  };

  const worldToScreen = (worldPoint: Point): Point => {
    return {
      x: worldPoint.x * viewState.zoom + viewState.panOffset.x,
      y: worldPoint.y * viewState.zoom + viewState.panOffset.y,
    };
  };

  // Snap point to grid if enabled
  const snapToGrid = (point: Point): Point => {
    if (!viewState.grid.snap) return point;

    const gridSize = viewState.grid.size;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  };

  // Export the context value
  const contextValue: CADContextType = {
    // View state
    viewState,
    setViewState,

    // Entities
    entities,
    addEntity,
    updateEntity,
    deleteEntities,

    // Selection
    selectedEntities,
    setSelectedEntities,

    // Tools
    currentTool,
    setCurrentTool,

    // Command line
    commandLine,
    setCommandLine,

    // Layers
    layers,
    currentLayer,
    setCurrentLayer,
    addLayer,
    updateLayer,
    deleteLayer,

    // History
    undo,
    redo,

    // Utility functions
    screenToWorld,
    worldToScreen,
    snapToGrid,
  };

  return (
    <CADContext.Provider value={contextValue}>{children}</CADContext.Provider>
  );
}

// Custom hook to use the CAD context
export function useCADContext(): CADContextType {
  const context = useContext(CADContext);
  if (context === undefined) {
    throw new Error('useCADContext must be used within a CADProvider');
  }
  return context;
}
