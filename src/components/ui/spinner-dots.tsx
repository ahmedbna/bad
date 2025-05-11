'use client';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
};

export const SpinnerDots = ({
  size = 'sm',
  color = 'bg-purple-500',
}: Props) => {
  const radius =
    size === 'sm' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className='flex items-center justify-center gap-0.5'>
      <div
        className={`${radius} animate-bounce rounded-full ${color} [animation-delay:-0.3s]`}
      />
      <div
        className={`${radius} animate-bounce rounded-full ${color} [animation-delay:-0.15s]`}
      />
      <div className={`${radius} animate-bounce rounded-full ${color}`} />
    </div>
  );
};
