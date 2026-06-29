import React from 'react';

const sizes = {
  sm: 'max-w-[200px]',
  md: 'max-w-[260px]',
  lg: 'max-w-[300px] sm:max-w-[340px]',
};

const BrandLogo = ({
  size = 'lg',
  variant = 'wordmark',
  showWordmark = true,
  showTagline = false,
  className = '',
}) => {
  const widthClass = sizes[size] || sizes.lg;

  if (variant === 'icon') {
    return (
      <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
        <img
          src="/monargent-icon.png"
          alt=""
          className={`${size === 'sm' ? 'h-10' : 'h-14'} w-auto object-contain`}
          aria-hidden
        />
        {showWordmark && (
          <img
            src="/monargent-wordmark.png"
            alt="MonArgent"
            className={`w-full ${widthClass} h-auto object-contain`}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center w-full ${className}`}>
      {showWordmark && (
        <img
          src="/monargent-wordmark.png"
          alt="MonArgent"
          className={`block w-full ${widthClass} h-auto object-contain -mb-2`}
        />
      )}
      {showTagline && (
        <p className="text-tagline mt-1">Gestión financiera personal</p>
      )}
    </div>
  );
};

export default BrandLogo;
