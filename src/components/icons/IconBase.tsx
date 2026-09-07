import React from 'react';
import type { IconProps } from './types';

export interface IconBaseProps extends IconProps {
  children?: React.ReactNode;
}

export const IconBase: React.FC<IconBaseProps> = ({
  size = 24,
  className = '',
  color = 'currentColor',
  strokeWidth = 2,
  children,
  ...rest
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`.trim()}
      {...rest}
    >
      {children}
    </svg>
  );
};
