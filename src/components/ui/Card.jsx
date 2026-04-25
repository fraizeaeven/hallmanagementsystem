import React from 'react';
import '../../styles/_card.css';

export default function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}
