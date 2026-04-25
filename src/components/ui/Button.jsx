import React from 'react';
import '../../styles/_button.css';

export default function Button({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  size = '',
  block = false,
  ...rest
}) {
  const baseClass = `button button--${variant}`;
  const sizeClass = size ? `button--${size}` : '';
  const blockClass = block ? `button--block` : '';
  
  return (
    <button
      type={type}
      className={`${baseClass} ${sizeClass} ${blockClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
