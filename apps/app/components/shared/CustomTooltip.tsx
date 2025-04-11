import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
  hideOnCopy?: boolean;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  content,
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 5,
  className = '',
  hideOnCopy = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle positioning of the tooltip
  useEffect(() => {
    if (isOpen && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = 0;
      let y = 0;
      
      // Handle vertical positioning based on side
      if (side === 'bottom') {
        y = triggerRect.bottom + window.scrollY + sideOffset;
      } else if (side === 'top') {
        y = triggerRect.top + window.scrollY - tooltipRect.height - sideOffset;
      } else if (side === 'right') {
        y = triggerRect.top + window.scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        x = triggerRect.right + window.scrollX + sideOffset;
      } else if (side === 'left') {
        y = triggerRect.top + window.scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        x = triggerRect.left + window.scrollX - tooltipRect.width - sideOffset;
      }
      
      // Handle horizontal alignment for top and bottom
      if (side === 'top' || side === 'bottom') {
        if (align === 'center') {
          // Precise centering calculation
          const triggerCenter = triggerRect.left + (triggerRect.width / 2);
          x = triggerCenter + window.scrollX - (tooltipRect.width / 2);
        } else if (align === 'start') {
          x = triggerRect.left + window.scrollX;
        } else if (align === 'end') {
          x = triggerRect.right + window.scrollX - tooltipRect.width;
        }
      }
      
      setPosition({ x, y });
    }
  }, [isOpen, side, align, sideOffset]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a timer to show the tooltip after 1 second
    timerRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 1000);
  };

  const handleMouseLeave = () => {
    // Clear the timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Close the tooltip
    setIsOpen(false);
  };

  // Clone the children to add event handlers
  const childrenWithProps = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleMouseEnter,
    onBlur: handleMouseLeave,
    onClick: () => {
      // If hideOnCopy is true, close the tooltip on click
      if (hideOnCopy) {
        setIsOpen(false);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
      
      // Call the original onClick if it exists
      if (children.props.onClick) {
        children.props.onClick();
      }
    },
  });

  return (
    <>
      {childrenWithProps}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
              style={{
                position: 'absolute',
                top: position.y,
                left: position.x,
                zIndex: 1000,
                pointerEvents: 'none',
              }}
              className="tooltip-container"
            >
              <div 
                className={`rounded-md py-1.5 px-3 text-xs font-medium bg-background border border-border/40 text-foreground relative ${className}`}
                style={{ transform: 'translateX(0)' }} // Ensure no transform offset
              >
                {content}
                
                {/* Tooltip arrow */}
                <div 
                  className="absolute"
                  style={{
                    ...(side === 'bottom' && { 
                      top: '-5px', 
                      left: '50%', 
                      width: '8px',
                      height: '8px',
                      transform: 'translateX(-50%) rotate(45deg)',
                      backgroundColor: 'var(--background, #ffffff)',
                      borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                      borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRight: 'none',
                      borderBottom: 'none'
                    }),
                    ...(side === 'top' && { 
                      bottom: '-5px', 
                      left: '50%', 
                      width: '8px',
                      height: '8px',
                      transform: 'translateX(-50%) rotate(45deg)',
                      backgroundColor: 'var(--background, #ffffff)',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                      borderTop: 'none',
                      borderLeft: 'none'
                    }),
                    ...(side === 'left' && { 
                      right: '-5px', 
                      top: '50%', 
                      width: '8px',
                      height: '8px',
                      transform: 'translateY(-50%) rotate(45deg)',
                      backgroundColor: 'var(--background, #ffffff)',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                    }),
                    ...(side === 'right' && { 
                      left: '-5px', 
                      top: '50%', 
                      width: '8px',
                      height: '8px',
                      transform: 'translateY(-50%) rotate(45deg)',
                      backgroundColor: 'var(--background, #ffffff)',
                      borderBottom: 'none',
                      borderRight: 'none',
                      borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                      borderLeft: '1px solid rgba(0, 0, 0, 0.1)'
                    }),
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}; 