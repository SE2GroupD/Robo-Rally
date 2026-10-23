import { useState } from 'react';
import { Button } from '../../../../../foundation/components/button/Button';

export function RoomCode({ roomCode }: { roomCode: string }) {
  const [copyMessage, setCopyMessage] = useState('');
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopyMessage('Room code copied.');
    } catch {
      setCopyMessage('Could not copy. Select and copy the code manually.');
    }
  }

  return (
    <section className="rounded border border-metal-light p-4">
      <div>
        <h2 className="m-0 text-lg font-bold">Room code</h2>
        <p className="mb-0 mt-1 text-sm text-text-muted">Share with friends to invite them.</p>
      </div>

      <div className="mt-3 flex flex-col items-start gap-1">
        <div className="flex items-center gap-3 rounded border border-dotted border-metal px-3 py-2">
          <span className="select-text text-2xl font-bold tracking-widest">{roomCode}</span>
          <Button onClick={copyCode} size="small" variant="secondary">
            Copy Code
          </Button>
        </div>
        <output className="min-h-5 text-xs text-text-muted">{copyMessage}</output>
      </div>
    </section>
  );
}
