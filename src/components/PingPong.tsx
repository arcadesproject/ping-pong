import { useCallback, useEffect, useRef } from 'react';
import { Sounds, initAudio } from '../lib/sounds';

const PingPong = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number | null>(null);
  const scoreRef = useRef({ player1: 0, player2: 0 });
  const gameStateRef = useRef<'idle' | 'playing' | 'gameover'>('idle');
  
  // Use refs instead of state for position updates to avoid re-renders
  const player1YRef = useRef(0);
  const player2YRef = useRef(0);
  const keysPressedRef = useRef<Set<string>>(new Set());
  
  const dimensionsRef = useRef({
    width: Math.min(window.innerWidth - 40, 700,),
    height: Math.min(window.innerHeight - 250, 400)
  });

  // Calculate proportional sizes
  const getGameConstants = () => {
    const dims = dimensionsRef.current;
    return {
      paddleWidth: Math.max(dims.width * 0.015, 8),    // Minimum 8px width
      paddleHeight: Math.max(dims.height * 0.18, 40),  // Minimum 40px height
      ballRadius: Math.max(dims.width * 0.012, 6),     // Minimum 6px radius
      leftPaddleX: dims.width * 0.05,
      rightPaddleX: dims.width * 0.935,
      moveSpeed: dims.height * 0.018,
      maxBallSpeed: Math.max(dims.width, dims.height) * 0.012,
    };
  };

  interface Ball {
    x: number;
    y: number;
    dx: number;
    dy: number;
  }
  
  const ballRef = useRef<Ball>({
    x: 0,
    y: 0,
    dx: 0,
    dy: 0
  });

  useEffect(() => {
    // Initialize audio on first user interaction
    const handleFirstInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  // Initialize the game
  const initGame = useCallback(() => {
    const dims = dimensionsRef.current;
    const constants = getGameConstants();
    
    // Reset paddles
    player1YRef.current = dims.height / 2 - constants.paddleHeight / 2;
    player2YRef.current = dims.height / 2 - constants.paddleHeight / 2;
    
    // Reset ball
    ballRef.current = {
      x: dims.width / 2,
      y: dims.height / 2,
      dx: dims.width * 0.004 * (Math.random() > 0.5 ? 1 : -1),
      dy: dims.height * 0.003 * (Math.random() > 0.5 ? 1 : -1)
    };
  }, []);

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressedRef.current.add(key);
      
      // Handle game state changes
      if (key === ' ') {
        if (gameStateRef.current === 'idle') {
          gameStateRef.current = 'playing';
          initGame();
        } else if (gameStateRef.current === 'playing') {
          gameStateRef.current = 'idle';
        } else if (gameStateRef.current === 'gameover') {
          gameStateRef.current = 'idle';
          scoreRef.current = { player1: 0, player2: 0 };
          initGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [initGame]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      dimensionsRef.current = {
        width: Math.min(window.innerWidth - 100, 700),
        height: Math.min(window.innerHeight - 250, 400)
      };
      
      if (canvasRef.current) {
        canvasRef.current.width = dimensionsRef.current.width;
        canvasRef.current.height = dimensionsRef.current.height;
      }
      
      initGame();
    };

    handleResize(); // Initialize on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initGame]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;

    // Game loop function
    const update = () => {
      const dims = dimensionsRef.current;
      const constants = getGameConstants();
      const { paddleWidth, paddleHeight, ballRadius, leftPaddleX, rightPaddleX, moveSpeed, maxBallSpeed } = constants;
      const maxY = dims.height - paddleHeight;
      
      // Clear canvas
      context.clearRect(0, 0, dims.width, dims.height);

      // Draw background
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, dims.width, dims.height);
      
      // Draw court lines
      context.strokeStyle = '#ccc';
      context.lineWidth = 2;
      
      // Center line
      context.setLineDash([10, 10]);
      context.beginPath();
      context.moveTo(dims.width / 2, 0);
      context.lineTo(dims.width / 2, dims.height);
      context.stroke();
      context.setLineDash([]);
      
      // Border
      context.strokeRect(2, 2, dims.width - 4, dims.height - 4);

      // Update paddle positions if game is playing
      if (gameStateRef.current === 'playing') {
        // Player 1 movement
        if (keysPressedRef.current.has('w') && player1YRef.current > 0) {
          player1YRef.current = Math.max(0, player1YRef.current - moveSpeed);
        }
        if (keysPressedRef.current.has('s') && player1YRef.current < maxY) {
          player1YRef.current = Math.min(maxY, player1YRef.current + moveSpeed);
        }
        
        // Player 2 movement
        if (keysPressedRef.current.has('arrowup') && player2YRef.current > 0) {
          player2YRef.current = Math.max(0, player2YRef.current - moveSpeed);
        }
        if (keysPressedRef.current.has('arrowdown') && player2YRef.current < maxY) {
          player2YRef.current = Math.min(maxY, player2YRef.current + moveSpeed);
        }
      }

      // Draw paddles
      context.fillStyle = '#ccc';
      context.fillRect(leftPaddleX, player1YRef.current, paddleWidth, paddleHeight);
      context.fillRect(rightPaddleX, player2YRef.current, paddleWidth, paddleHeight);

      // Draw and update ball
      if (gameStateRef.current === 'playing') {
        const ball = ballRef.current;
        
        // Draw ball
        context.beginPath();
        context.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        context.fillStyle = '#ccc';
        context.fill();
        
        // Update ball position
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // Wall collisions (top/bottom)
        if (ball.y - ballRadius <= 0 || ball.y + ballRadius >= dims.height) {
          ball.y = ball.y - ballRadius <= 0 ? ballRadius : dims.height - ballRadius;
          ball.dy *= -1;
        }
        
        // Paddle collisions
        const hitLeftPaddle = (
          ball.x - ballRadius <= leftPaddleX + paddleWidth &&
          ball.x + ballRadius >= leftPaddleX &&
          ball.y + ballRadius >= player1YRef.current &&
          ball.y - ballRadius <= player1YRef.current + paddleHeight
        );
        
        const hitRightPaddle = (
          ball.x + ballRadius >= rightPaddleX &&
          ball.x - ballRadius <= rightPaddleX + paddleWidth &&
          ball.y + ballRadius >= player2YRef.current &&
          ball.y - ballRadius <= player2YRef.current + paddleHeight
        );
        
        // Improved paddle physics
        if (hitLeftPaddle || hitRightPaddle) {
            Sounds.paddle();
          // Reverse x direction
          ball.dx *= -1.05; // Slight speed increase
          
          // Calculate hit position relative to paddle center (-1 to 1)
          const paddleY = hitLeftPaddle ? player1YRef.current : player2YRef.current;
          const paddleCenter = paddleY + paddleHeight / 2;
          const hitPosition = (ball.y - paddleCenter) / (paddleHeight / 2);
          
          // Add spin based on hit position
          ball.dy += hitPosition * 2;
          
          // Ensure ball doesn't get stuck in paddle
          if (hitLeftPaddle) {
            ball.x = leftPaddleX + paddleWidth + ballRadius;
          } else {
            ball.x = rightPaddleX - ballRadius;
          }
          
          // Cap ball speed
          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
          if (speed > maxBallSpeed) {
            const ratio = maxBallSpeed / speed;
            ball.dx *= ratio;
            ball.dy *= ratio;
          }
        }
        
        // Scoring and reset when ball goes out of bounds
        if (ball.x < 0) {
            Sounds.score();
          // Player 2 scores
          scoreRef.current.player2++;
          resetBall(false);
        } else if (ball.x > dims.width) {
            Sounds.score();
          // Player 1 scores
          scoreRef.current.player1++;
          resetBall(true);
        }
      }
      
      // Draw scores
      context.font = 'bold 24px monospace';
      context.fillStyle = '#ccc';
      context.textAlign = 'center';
      context.fillText(scoreRef.current.player1.toString(), dims.width * 0.25, 30);
      context.fillText(scoreRef.current.player2.toString(), dims.width * 0.75, 30);
      
      // Draw game state info
      if (gameStateRef.current === 'idle') {
        context.font = '20px monospace';
        context.fillStyle = '#ccc';
        context.textAlign = 'center';
        context.fillText('PRESS SPACE TO START', dims.width / 2, dims.height / 2);
        // context.fillText('W/S: PLAYER 1   ↑/↓: PLAYER 2', dims.width / 2, dims.height / 2 + 30);
      }
      
      requestIdRef.current = requestAnimationFrame(update);
    };
    
    // Helper to reset ball after scoring
    const resetBall = (player1Scored: boolean) => {
      const dims = dimensionsRef.current;
      ballRef.current = {
        x: dims.width / 2,
        y: dims.height / 2,
        dx: dims.width * 0.004 * (player1Scored ? -1 : 1),
        dy: dims.height * 0.003 * (Math.random() * 2 - 1)
      };
    };
    
    // Start the game loop
    requestIdRef.current = requestAnimationFrame(update);
    
    // Cleanup
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center overflow-hidden max-h-screen p-4 pt-12">
      <h1 className="-mt-10 text-2xl font-bold  text-gray-200 mb-4 uppercase tracking-widest">PONG</h1>
      
      <div 
        className="mt-20 border-4 border-white shadow-lg overflow-hidden"
        style={{
          width: `${dimensionsRef.current.width}px`,
          height: `${dimensionsRef.current.height}px`,
          maxWidth: '100%' // Ensure it doesn't overflow container
        }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
        />
      </div>
      
      <div className="mt-20 font-mono text-gray-400 text-sm">
        SPACE: START/PAUSE | W/S: PLAYER 1 | ↑/↓: PLAYER 2
      </div>
    </div>
  );
};

export default PingPong;