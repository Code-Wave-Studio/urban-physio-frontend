import { useEffect, useRef, useState, useMemo } from 'react';
import FaIcon from '../FaIcon';
import { parseMediaSource, buildYoutubeEmbedUrl } from '../../utils/mediaParser';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CustomExercisePlayer({
  exercise,
  mediaUrl,
  title = '',
  className = 'w-full aspect-video',
}) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const videoRef = useRef(null);

  const media = useMemo(() => parseMediaSource(exercise || mediaUrl), [exercise, mediaUrl]);
  const label = title || (exercise && exercise.name) || 'Exercise Media';

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // YouTube embed URL with clean params
  const cleanYoutubeEmbedUrl = useMemo(() => {
    if (media.type !== 'youtube' || !media.youtubeId) return null;
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      loop: '1',
      playlist: media.youtubeId,
      controls: '0',
      modestbranding: '1',
      rel: '0',
      showinfo: '0',
      iv_load_policy: '3',
      cc_load_policy: '0',
      disablekb: '1',
      fs: '0',
      playsinline: '1',
      enablejsapi: '1',
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    });
    return `https://www.youtube.com/embed/${media.youtubeId}?${params.toString()}`;
  }, [media]);

  // PostMessage command to YouTube iframe
  const sendYoutubeCommand = (func, args = []) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      const message = JSON.stringify({
        event: 'command',
        func,
        args,
      });
      iframeRef.current.contentWindow.postMessage(message, '*');
    } catch {
      /* ignore cross-origin postMessage errors */
    }
  };

  // Listen to YouTube postMessage events for playback state and time updates
  useEffect(() => {
    if (media.type !== 'youtube') return;

    const handleMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data) return;

        if (data.event === 'onStateChange') {
          // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
          if (data.info === 1) setIsPlaying(true);
          if (data.info === 2 || data.info === 0) setIsPlaying(false);
        }

        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setCurrentTime(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
          if (typeof data.info.volume === 'number') {
            setVolume(data.info.volume);
          }
          if (typeof data.info.muted === 'boolean') {
            setIsMuted(data.info.muted);
          }
        }
      } catch {
        /* ignore parse errors */
      }
    };

    window.addEventListener('message', handleMessage);

    // Request status update periodically
    const timer = setInterval(() => {
      sendYoutubeCommand('listening');
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(timer);
    };
  }, [media]);

  // Track HTML5 video progress
  useEffect(() => {
    if (media.type !== 'video' || !videoRef.current) return;
    const v = videoRef.current;

    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onLoadedMetadata = () => setDuration(v.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('loadedmetadata', onLoadedMetadata);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);

    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('loadedmetadata', onLoadedMetadata);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
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
    if (media.type === 'youtube') {
      if (isPlaying) {
        sendYoutubeCommand('pauseVideo');
        setIsPlaying(false);
      } else {
        sendYoutubeCommand('playVideo');
        setIsPlaying(true);
      }
    } else if (media.type === 'video' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (media.type === 'youtube') {
      sendYoutubeCommand('seekTo', [newTime, true]);
    } else if (media.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    if (media.type === 'youtube') {
      if (isMuted) {
        sendYoutubeCommand('unMute');
        setIsMuted(false);
        if (volume === 0) {
          sendYoutubeCommand('setVolume', [80]);
          setVolume(80);
        }
      } else {
        sendYoutubeCommand('mute');
        setIsMuted(true);
      }
    } else if (media.type === 'video' && videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    const muted = newVol === 0;
    setIsMuted(muted);

    if (media.type === 'youtube') {
      sendYoutubeCommand('setVolume', [newVol]);
      if (muted) sendYoutubeCommand('mute');
      else sendYoutubeCommand('unMute');
    } else if (media.type === 'video' && videoRef.current) {
      videoRef.current.volume = newVol / 100;
      videoRef.current.muted = muted;
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
      /* fullscreen fallback */
    }
  };

  if (!media.type) return null;

  if (media.type === 'image') {
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-md">
        <img src={media.url} alt={label} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group"
    >
      {/* Video Box Container — Clean video without obstructive overlays */}
      <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
        {media.type === 'youtube' && cleanYoutubeEmbedUrl && (
          <div className="absolute inset-0 w-full h-full scale-[1.12] overflow-hidden pointer-events-none select-none">
            <iframe
              ref={iframeRef}
              src={cleanYoutubeEmbedUrl}
              title={label}
              className="w-full h-full object-cover border-0 pointer-events-none"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen={false}
              loading="lazy"
              tabIndex={-1}
            />
          </div>
        )}

        {media.type === 'video' && (
          <video
            ref={videoRef}
            src={media.url}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            controls={false}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Custom Control Bar — Positioned BELOW the video */}
      <div className="w-full bg-slate-900 text-white p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shrink-0 border-t border-slate-800">
        {/* Left: Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-teal-500 hover:bg-teal-400 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          <FaIcon icon={isPlaying ? 'fa-pause' : 'fa-play'} className="text-sm ml-0.5" />
        </button>

        {/* Middle: Progress Bar & Duration Counter */}
        <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-[140px]">
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
            className="w-full h-1.5 rounded-lg bg-slate-700 accent-teal-400 cursor-pointer hover:bg-slate-600 transition"
            aria-label="Seek video progress"
          />
          <span className="text-[11px] font-mono text-slate-400 shrink-0 font-medium">
            {formatTime(duration)}
          </span>
        </div>

        {/* Right: Dedicated Volume Control + Fullscreen */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Volume Group */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
            <button
              type="button"
              onClick={toggleMute}
              className="text-slate-300 hover:text-white transition p-0.5"
              aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
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
              className="w-14 sm:w-20 h-1 rounded-lg bg-slate-600 accent-teal-400 cursor-pointer"
              aria-label="Volume slider"
            />
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700/60"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <FaIcon icon={isFullscreen ? 'fa-compress' : 'fa-expand'} className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}
