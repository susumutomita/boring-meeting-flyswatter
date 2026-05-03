import type { ScoreShareStatus } from '../hooks/useScoreShare';
import { type ScoreSnapshot, rankPeers } from '../lib/scoreShare';

type ScoreLeaderboardProps = {
  peers: ScoreSnapshot[];
  selfPeerId: string;
  status: ScoreShareStatus;
  roomCode: string;
  participantCount: number;
};

const phaseDot: Record<ScoreSnapshot['phase'], string> = {
  idle: '待機',
  monitoring: '進行中',
  swatting: 'ハエ叩き中',
  completed: '終了',
};

const statusLabel: Record<ScoreShareStatus, string> = {
  idle: '未接続',
  connecting: '接続中',
  host: 'ホスト',
  client: '参加中',
  error: 'エラー',
};

export const ScoreLeaderboard = ({
  peers,
  selfPeerId,
  status,
  roomCode,
  participantCount,
}: ScoreLeaderboardProps) => {
  const ranked = rankPeers(peers);

  return (
    <article className="panel score-board" aria-label="ルーム参加者のスコア">
      <header className="score-board-head">
        <div className="score-board-title">
          <span className="score-board-eyebrow">ルーム</span>
          <strong>{roomCode || '未設定'}</strong>
        </div>
        <div className="score-board-status">
          <span className={`score-board-pill score-board-pill-${status}`}>
            {statusLabel[status]}
          </span>
          <span className="score-board-count">{participantCount} 人</span>
        </div>
      </header>

      <ol className="score-board-list">
        {ranked.length === 0 ? (
          <li className="score-board-empty">参加者はまだいません</li>
        ) : (
          ranked.map((snapshot, index) => {
            const isSelf = snapshot.peerId === selfPeerId;
            return (
              <li
                className={`score-board-row ${isSelf ? 'is-self' : ''}`}
                key={snapshot.peerId}
              >
                <div className="score-board-row-head">
                  <span className="score-board-rank">{index + 1}</span>
                  <span className="score-board-name">
                    {snapshot.displayName}
                    {isSelf ? <small>あなた</small> : null}
                  </span>
                  <span className="score-board-phase">
                    {phaseDot[snapshot.phase]}
                  </span>
                </div>

                <div className="score-board-row-score">
                  <span className="score-board-best">
                    <small>BEST</small>
                    {snapshot.bestScore}
                  </span>
                  <span className="score-board-current">
                    <small>NOW</small>
                    {snapshot.score}
                  </span>
                </div>

                {snapshot.swattingStartedAt ? (
                  <div className="score-board-bored-at">
                    <small>退屈時刻</small>
                    <span>
                      {new Date(snapshot.swattingStartedAt).toLocaleTimeString(
                        'ja-JP',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                        }
                      )}
                    </span>
                  </div>
                ) : null}

                {snapshot.reasons.length > 0 ? (
                  <ul className="score-board-reasons">
                    {snapshot.reasons.map((preset) => (
                      <li className="score-board-reason" key={preset}>
                        {preset}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })
        )}
      </ol>
    </article>
  );
};
