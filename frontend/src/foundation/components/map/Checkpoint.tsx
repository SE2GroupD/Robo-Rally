import React from 'react';
import flagImage from '../../../assets/flag.png';

interface CheckpointProps {
  num: number;
}

export function Checkpoint({ num }: CheckpointProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img src={flagImage} alt={`Checkpoint ${num}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      <span
        style={{
          position: 'absolute',
          fontWeight: '900',
          color: '#000',
          fontSize: '14px',
          top: '27%',
          left: '65%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {num}
      </span>
    </div>
  );
}
