import React from 'react';
import '../../styles/_skeleton.css';

export default function Skeleton({ type = 'text', width = '100%', height, className = '' }) {
  const style = { width };
  if (height) style.height = height;
  
  return (
    <div 
      className={`skeleton skeleton--${type} ${className}`} 
      style={style}
    />
  );
}
