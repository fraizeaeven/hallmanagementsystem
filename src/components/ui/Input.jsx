import React from 'react';
import '../../styles/_input.css';

export function Input({ id, label, error, className = '', ...props }) {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <input 
        id={id} 
        className={`input ${error ? 'input--error' : ''}`} 
        {...props} 
      />
      {error && <p className="input-error" role="alert">{error}</p>}
    </div>
  );
}

export function Textarea({ id, label, error, className = '', ...props }) {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <textarea 
        id={id} 
        className={`textarea ${error ? 'input--error' : ''}`} 
        {...props} 
      />
      {error && <p className="input-error" role="alert">{error}</p>}
    </div>
  );
}
