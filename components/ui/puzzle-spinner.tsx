'use client'

import React from 'react'

interface PuzzleSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | number
  className?: string
}

export function PuzzleSpinner({ size = 'md', className = '' }: PuzzleSpinnerProps) {
  let dimension = 40
  if (typeof size === 'number') {
    dimension = size
  } else if (size === 'sm') {
    dimension = 22
  } else if (size === 'lg') {
    dimension = 56
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="puzzle-spinner-svg"
      >
        <style>{`
          .puzzle-spinner-svg {
            animation: puzzleRotate 4s linear infinite;
          }
          .puzzle-piece-1 {
            animation: puzzlePiece1 1.6s ease-in-out infinite alternate;
            transform-origin: 25px 25px;
          }
          .puzzle-piece-2 {
            animation: puzzlePiece2 1.6s ease-in-out infinite alternate;
            transform-origin: 75px 25px;
          }
          .puzzle-piece-3 {
            animation: puzzlePiece3 1.6s ease-in-out infinite alternate;
            transform-origin: 25px 75px;
          }
          .puzzle-piece-4 {
            animation: puzzlePiece4 1.6s ease-in-out infinite alternate;
            transform-origin: 75px 75px;
          }
          @keyframes puzzleRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes puzzlePiece1 {
            0% { transform: translate(-5px, -5px) scale(0.92); opacity: 0.75; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 1; }
          }
          @keyframes puzzlePiece2 {
            0% { transform: translate(5px, -5px) scale(0.92); opacity: 0.75; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 1; }
          }
          @keyframes puzzlePiece3 {
            0% { transform: translate(-5px, 5px) scale(0.92); opacity: 0.75; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 1; }
          }
          @keyframes puzzlePiece4 {
            0% { transform: translate(5px, 5px) scale(0.92); opacity: 0.75; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 1; }
          }
        `}</style>
        {/* Top-Left Piece */}
        <path
          className="puzzle-piece-1"
          d="M 12 12 H 36 C 36 22, 46 22, 46 12 H 48 V 26 C 38 26, 38 36, 48 36 V 48 H 12 V 12 Z"
          fill="var(--primary, #b7f36b)"
        />
        {/* Top-Right Piece */}
        <path
          className="puzzle-piece-2"
          d="M 52 12 H 88 V 48 H 74 C 74 38, 64 38, 64 48 H 52 V 36 C 62 36, 62 26, 52 26 V 12 Z"
          fill="#63d6c5"
        />
        {/* Bottom-Left Piece */}
        <path
          className="puzzle-piece-3"
          d="M 12 52 H 36 C 36 62, 46 62, 46 52 H 48 V 88 H 12 V 74 C 22 74, 22 64, 12 64 V 52 Z"
          fill="#8ce0ae"
        />
        {/* Bottom-Right Piece */}
        <path
          className="puzzle-piece-4"
          d="M 52 52 H 88 V 64 C 78 64, 78 74, 88 74 V 88 H 52 V 52 Z"
          fill="#f4c95d"
        />
      </svg>
    </div>
  )
}
