import React, { useState, useRef, useEffect } from 'react';
import QuestionModal from './QuestionModal';
import { toast } from 'react-hot-toast';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

interface InteractiveQuestion {
  id: string;
  timestamp: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface VideoPlayerProps {
  youtubeLink: string;
  questions?: InteractiveQuestion[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ youtubeLink, questions = [] }) => {
  const [player, setPlayer] = useState<any>(null);
  const [activeQuestion, setActiveQuestion] = useState<InteractiveQuestion | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();
  const playerRef = useRef<HTMLIFrameElement>(null);

  // Extract video ID and create custom embed URL
  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getVideoId(youtubeLink);
  const customEmbedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&autohide=1&color=white&playsinline=1&origin=${window.location.origin}&enablejsapi=1&widget_referrer=${window.location.origin}` : youtubeLink;

  useEffect(() => {
    if (player && isPlaying) {
      intervalRef.current = setInterval(() => {
        const currentTime = Math.floor(player.getCurrentTime());
        
        const questionToShow = questions.find(q => 
          q.timestamp === currentTime && !answeredQuestions.includes(q.id)
        );

        if (questionToShow) {
          setIsPlaying(false);
          setActiveQuestion(questionToShow);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [player, questions, answeredQuestions, isPlaying]);

  const handleAnswer = (isCorrect: boolean) => {
    if (!activeQuestion) return;

    if (isCorrect) {
      toast.success('Doğru cevap! +15 XP kazandınız! 🎉');
      setAnsweredQuestions(prev => [...prev, activeQuestion.id]);
      setActiveQuestion(null);
      setIsPlaying(true);
    } else {
      toast.error('Yanlış cevap! Video başa sarılıyor.');
      setAnsweredQuestions([]); // Reset all answers on failure
      setActiveQuestion(null);
      if (playerRef.current) {
        playerRef.current.src = customEmbedUrl;
      }
      setIsPlaying(true);
    }
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    setProgress(state.played);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    if (playerRef.current) {
      playerRef.current.src = customEmbedUrl;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setMuted(true);
    } else {
      setMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (playerRef.current) {
      const wrapper = playerRef.current.parentElement;
      if (wrapper) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          wrapper.requestFullscreen();
        }
      }
    }
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden video-player-container">
      {/* Video Player */}
      <div className="relative aspect-video">
        {videoId ? (
          <iframe
            ref={playerRef}
            src={`https://www.youtube.com/embed/${videoId}?controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&autohide=1&color=white&playsinline=1&enablejsapi=1&origin=${window.location.origin}&widget_referrer=${window.location.origin}`}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              pointerEvents: 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            Geçersiz YouTube linki
          </div>
        )}
        
        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 video-controls">
          {/* Progress Bar */}
          <div 
            className="w-full h-1 bg-gray-600 rounded cursor-pointer mb-2"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-red-500 rounded transition-all duration-200"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              
              <span className="text-sm font-mono">
                {formatTime(progress * duration)} / {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Play Button Overlay (when paused) */}
        {!isPlaying && !activeQuestion && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="p-4 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <Play size={40} className="text-white ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Question Modal */}
      {activeQuestion && (
        <QuestionModal 
          question={activeQuestion}
          onAnswer={handleAnswer}
          onClose={() => setActiveQuestion(null)}
        />
      )}
    </div>
  );
};

export default VideoPlayer; 