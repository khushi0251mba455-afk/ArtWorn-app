import React, { useState } from 'react';
import { Palette } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
  ...rest
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackLabel || 'ArtWorn studio piece'}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F3ECE2] via-[#FAF6F0] to-[#E6DDD0] dark:from-[#25211D] dark:via-[#1E1B18] dark:to-[#141210] text-[#5C554E] dark:text-[#B5ADA4] p-4 text-center ${className}`}
      >
        <Palette className="w-7 h-7 text-[#C65D3B] mb-2 opacity-80" />
        <span className="text-xs font-medium line-clamp-2">{fallbackLabel || alt || 'ArtWorn Studio'}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
};
