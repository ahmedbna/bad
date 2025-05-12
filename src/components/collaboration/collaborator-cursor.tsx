'use client';

type CursorProps = {
  x: number;
  y: number;
  name: string;
  color: string;
  tool?: string;
};

export const CollaboratorCursor: React.FC<CursorProps> = ({
  x,
  y,
  name,
  color,
  tool,
}) => {
  return (
    <div
      className='absolute pointer-events-none'
      style={{
        transform: `translate(${x}px, ${y}px)`,
        zIndex: 9999,
      }}
    >
      {/* Cursor icon */}
      <svg
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='none'
        style={{
          transform: 'translate(-4px, -4px)',
          filter: `drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.5))`,
        }}
      >
        <path
          d='M1 1L11 11L5 17L1 1Z'
          fill={color}
          stroke='white'
          strokeWidth='1'
        />
      </svg>

      {/* Tool indicator */}
      {tool && (
        <div
          className='rounded-full w-4 h-4 ml-4 border border-white'
          style={{
            backgroundColor: color,
            transform: 'translate(12px, -16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
          }}
        >
          {tool.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Name tag */}
      <div
        className='px-2 py-1 text-xs rounded whitespace-nowrap'
        style={{
          backgroundColor: color,
          color: 'white',
          transform: 'translateY(8px)',
        }}
      >
        {name}
      </div>
    </div>
  );
};
