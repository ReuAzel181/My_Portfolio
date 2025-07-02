import { useState, useEffect, MouseEvent } from 'react';

interface RippleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

const RippleButton = ({ children, className = '', onClick }: RippleButtonProps) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    return () => {
      ripples.forEach((ripple) => {
        const element = document.getElementById(`ripple-${ripple.id}`);
        if (element) {
          element.remove();
        }
      });
    };
  }, [ripples]);

  const createRipple = (event: MouseEvent<HTMLDivElement>) => {
    const button = event.currentTarget;
    const rippleContainer = button.querySelector('.ripple-container') as HTMLElement;
    
    if (!rippleContainer) return;
    
    const rect = rippleContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rippleSize = Math.max(rect.width, rect.height);
    const rippleId = Date.now();

    const newRipple = {
      x,
      y,
      id: rippleId,
    };

    setRipples((prevRipples) => [...prevRipples, newRipple]);

    setTimeout(() => {
      setRipples((prevRipples) => 
        prevRipples.filter((ripple) => ripple.id !== rippleId)
      );
    }, 1000);
  };

  return (
    <div
      className={`relative cursor-pointer ${className}`}
      onMouseDown={createRipple}
      onClick={onClick}
    >
      <div className="ripple-container absolute inset-0 overflow-hidden">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-[var(--mint-ripple)] animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: '10px',
              height: '10px',
              transform: 'translate(-50%, -50%) scale(0)',
            }}
          />
        ))}
      </div>
      <div className="relative z-10">
        {children}
      </div>
      <style jsx>{`
        @keyframes ripple {
          to {
            transform: translate(-50%, -50%) scale(40);
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 1s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default RippleButton; 