import React, { useState } from 'react';

export function ImageWithFallback({ src, alt, className, ...props }) {
  const [error, setError] = useState(false);
  const fallbackImage = "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=1000";

  return (
    <img 
      src={error ? fallbackImage : src} 
      alt={alt} 
      className={className} 
      onError={() => setError(true)}
      {...props}
    />
  );
}
