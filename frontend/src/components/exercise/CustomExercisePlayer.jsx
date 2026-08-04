import { useEffect, useRef, useState, useMemo } from 'react';
import FaIcon from '../FaIcon';
import { parseMediaSource } from '../../utils/mediaParser';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function CustomExercisePlayer({
  exercise,
  mediaUrl,
  title = '',
  className = '',
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  const media = useMemo(() => parseMediaSource(exercise || mediaUrl), [exercise, mediaUrl]);
  const label = title || (exercise && (exercise.name || exercise.exercise_name)) || 'Exercise Video';

  // Custom HTML5 Player Controls State for Uploaded Videos
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Standard YouTube Embed URL with default controls
  const youtubeEmbedUrl = useMemo(() => {
    if (media.type !== 'youtube' || !media.videoId) return null;
    return `https://www.youtube.com/embed/${media.videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1`;
  }, [media]);

  // Track HTML5 video progress & state
  useEffect(() => {
    if (media.type !== 'video' || !videoRef.current) return;
    const v = videoRef.current;

    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onLoadedMetadata = () => setDuration(v.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('loadedmetadata', onLoadedMetadata);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);

    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('loadedmetadata', onLoadedMetadata);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
    };
  }, [media]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseInt(e.target.value, 10);
    setVolume(vol);
    const muted = vol === 0;
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.volume = vol / 100;
      videoRef.current.muted = muted;
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPip(true);
      }
    } catch {
      /* PiP fallback */
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      /* Fullscreen fallback */
    }
  };

  if (!media.type) return null;

  // Fallback for static image or GIF
  if (media.type === 'image') {
    return (
      <div className={`w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-md relative ${className}`}>
        <img src={media.url} alt={label} className="w-full h-full object-contain bg-slate-900" />
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-teal-300 flex items-center gap-1.5 border border-slate-700/50">
          <FaIcon icon="fa-image" />
          <span>Exercise Guide Image</span>
        </div>
      </div>
    );
  }

  // SOURCE 1: YouTube Embed with Standard Controls
  if (media.type === 'youtube') {
    return (
      <div className={`w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl relative ${className}`}>
        {youtubeEmbedUrl && !iframeError && (
          <iframe
            src={youtubeEmbedUrl}
            title={label}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; accelerometer; clipboard-write; gyroscope"
            allowFullScreen
            onError={() => setIframeError(true)}
          />
        )}
        {iframeError && media.thumbnailUrl && (
          <img src={media.thumbnailUrl} alt={label} className="w-full h-full object-cover" />
        )}
      </div>
    );
  }

  // SOURCE 2: Uploaded HTML5 Video with Custom Controls & Premium UI
  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl relative ${className}`}
    >
      {/* Video Box Container */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group">
        {/* Top Floating Badge */}
        <div className="absolute top-3 left-3 z-20 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-teal-300 flex items-center gap-1.5 border border-slate-700/60 shadow-md pointer-events-none">
          <FaIcon icon="fa-file-video" className="text-teal-400" />
          <span>Uploaded Video</span>
        </div>

        <video
          ref={videoRef}
          src={media.url}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          controls={false}
          controlsList="nodownload noplaybackrate"
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full object-contain bg-black cursor-pointer"
          onClick={togglePlay}
        />

        {/* Center Play Button Overlay on Click */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-teal-600/90 hover:bg-teal-500 text-white flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 active:scale-95"
            aria-label="Play Video"
          >
            <FaIcon icon="fa-play" className="text-xl ml-1" />
          </button>
        )}
      </div>

      {/* Premium Custom Control Bar for Uploaded Videos */}
      <div className="w-full bg-slate-900 text-white p-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shrink-0 border-t border-slate-800/80">
        {/* Left: Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white flex items-center justify-center shrink-0 transition active:scale-95 shadow-md shadow-teal-900/40"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <FaIcon icon={isPlaying ? 'fa-pause' : 'fa-play'} className="text-xs ml-0.5" />
        </button>

        {/* Middle: Seek Slider & Timestamps */}
        <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-[130px]">
          <span className="text-[11px] font-mono text-slate-300 shrink-0 font-medium">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 rounded-lg bg-slate-800 accent-teal-400 cursor-pointer hover:bg-slate-700 transition"
            aria-label="Seek progress"
          />
          <span className="text-[11px] font-mono text-slate-400 shrink-0 font-medium">
            {formatTime(duration)}
          </span>
        </div>

        {/* Right Controls: Speed, Volume, PiP & Fullscreen */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Playback Speed Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold border border-slate-700/60 transition"
              aria-label="Playback Speed"
            >
              {playbackSpeed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-24 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1 z-30 space-y-0.5">
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => handleSpeedChange(speed)}
                    className={`w-full text-left px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                      playbackSpeed === speed
                        ? 'bg-teal-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {speed}x {speed === 1 ? '(Normal)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-full border border-slate-700/60">
            <button
              type="button"
              onClick={toggleMute}
              className="text-slate-300 hover:text-white transition p-0.5"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <FaIcon
                icon={isMuted || volume === 0 ? 'fa-volume-xmark' : volume < 50 ? 'fa-volume-low' : 'fa-volume-high'}
                className="text-xs"
              />
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-12 sm:w-16 h-1 rounded-lg bg-slate-700 accent-teal-400 cursor-pointer"
              aria-label="Volume"
            />
          </div>

          {/* Picture in Picture */}
          {typeof document !== 'undefined' && document.pictureInPictureEnabled && (
            <button
              type="button"
              onClick={togglePip}
              className="w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700/60"
              aria-label="Picture in Picture"
            >
              <FaIcon icon="fa-window-restore" className="text-xs" />
            </button>
          )}

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700/60"
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <FaIcon icon={isFullscreen ? 'fa-compress' : 'fa-expand'} className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}
