import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from './FaIcon';
import { SITE_LOGO_SRC } from '../constants/siteBrand';

export default function Logo({
  className = 'h-10 w-auto max-w-[180px] object-contain',
  showText = false,
  textClassName = '',
  linkToHome = true,
  lightText = false,
  /** Override image (e.g. clinic logo). Falls back to The Urban Physio logo. */
  src = null,
  alt = 'The Urban Physio',
}) {
  const preferred = src || SITE_LOGO_SRC;
  const [currentSrc, setCurrentSrc] = useState(preferred);

  useEffect(() => {
    setCurrentSrc(src || SITE_LOGO_SRC);
  }, [src]);

  const onError = () => {
    if (currentSrc !== SITE_LOGO_SRC) {
      setCurrentSrc(SITE_LOGO_SRC);
      return;
    }
    setCurrentSrc('');
  };

  const image = currentSrc ? (
    <img
      key={currentSrc}
      src={currentSrc}
      alt={alt}
      className={`${className} group-hover:scale-105 transition-transform`}
      onError={onError}
    />
  ) : (
    <div className="w-10 h-10 bg-primary-600/90 backdrop-blur rounded-xl flex items-center justify-center shadow-lg shrink-0">
      <FaIcon icon="fa-heart-pulse" className="text-white text-lg" />
    </div>
  );

  const text = showText && (
    <span
      className={`font-bold text-xl hidden sm:block ${
        lightText
          ? 'text-white'
          : 'bg-gradient-to-r from-primary-800 to-primary-600 bg-clip-text text-transparent'
      }`}
    >
      The Urban Physio
    </span>
  );

  const content = (
    <>
      {image}
      {text}
    </>
  );

  if (!linkToHome) {
    return <div className={`flex items-center gap-3 ${textClassName}`}>{content}</div>;
  }

  return (
    <Link to="/" className={`flex items-center gap-3 group ${textClassName}`}>
      {content}
    </Link>
  );
}
