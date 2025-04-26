'use client';

import Canvas from '@/components/cad/canvas';
import { Toolbar } from '@/components/cad/toolbar';
import StatusBar from '@/components/cad/status-bar';
import CommandLine from '@/components/cad/command-line';
import { PropertiesPanel } from '@/components/cad/proprties-panel';

export default function Home() {
  return (
    <main className='min-h-screen'>
      <div className='flex flex-col h-screen bg-slate-100'>
        <Toolbar />

        <div className='flex flex-1 flex-row overflow-hidden'>
          <div className='flex-1'>
            <Canvas />
          </div>

          {/* <PropertiesPanel /> */}
        </div>
        <CommandLine />

        <StatusBar />
      </div>
    </main>
  );
}
