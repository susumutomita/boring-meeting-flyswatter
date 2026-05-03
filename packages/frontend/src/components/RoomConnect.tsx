import type { ChangeEvent, FormEvent } from 'react';
import { sanitizeDisplayName, sanitizeRoomCode } from '../lib/scoreShare';

type RoomConnectProps = {
  roomCode: string;
  displayName: string;
  isJoined: boolean;
  onRoomCodeChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onJoin: () => void;
  onLeave: () => void;
};

export const RoomConnect = ({
  roomCode,
  displayName,
  isJoined,
  onRoomCodeChange,
  onDisplayNameChange,
  onJoin,
  onLeave,
}: RoomConnectProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isJoined) {
      onLeave();
      return;
    }
    if (sanitizeRoomCode(roomCode).length === 0) {
      return;
    }
    onJoin();
  };

  const handleRoomChange = (event: ChangeEvent<HTMLInputElement>) => {
    onRoomCodeChange(event.target.value);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onDisplayNameChange(event.target.value);
  };

  const sanitizedRoom = sanitizeRoomCode(roomCode);
  const sanitizedName = sanitizeDisplayName(displayName);
  const canJoin = sanitizedRoom.length > 0;

  return (
    <form
      className="room-connect"
      data-no-activity-capture="true"
      onSubmit={handleSubmit}
    >
      <div className="room-connect-fields">
        <label className="room-connect-field">
          <span>ルーム</span>
          <input
            disabled={isJoined}
            onChange={handleRoomChange}
            placeholder="design-meeting-2026"
            type="text"
            value={roomCode}
          />
          <small>{sanitizedRoom || '半角英数とハイフンのみ'}</small>
        </label>

        <label className="room-connect-field">
          <span>名前</span>
          <input
            disabled={isJoined}
            onChange={handleNameChange}
            placeholder="ゲスト"
            type="text"
            value={displayName}
          />
          <small>{sanitizedName}</small>
        </label>
      </div>

      <button
        className={`action ${isJoined ? '' : 'action-primary'}`}
        disabled={!isJoined && !canJoin}
        type="submit"
      >
        {isJoined ? '退出' : '参加'}
      </button>
    </form>
  );
};
