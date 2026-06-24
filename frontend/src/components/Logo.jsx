import { useState } from 'react';
import { Link } from 'react-router-dom';
import FaIcon from './FaIcon';
import { SITE_LOGO_SRC } from '../constants/siteBrand';

export default function Logo({
  className = 'h-10 w-auto max-w-[180px] object-contain',
  showText = false,
  textClassName = '',
  linkToHome = true,
  lightText = false,
}) {
  const [failed, setFailed] = useState(false);

  const image = !failed ? (
    <img
      src={SITE_LOGO_SRC}
      alt="The Urban Physio"
      className={`${className} group-hover:scale-105 transition-transform`}
      onError={() => setFailed(true)}
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
