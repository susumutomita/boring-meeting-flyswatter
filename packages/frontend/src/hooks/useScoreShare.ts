import { type DataConnection, Peer } from 'peerjs';
import { useEffect, useRef, useState } from 'react';
import {
  type ScoreSnapshot,
  buildHostPeerId,
  mergePeerScores,
  removePeerScore,
} from '../lib/scoreShare';

export type ScoreShareStatus =
  | 'idle'
  | 'connecting'
  | 'host'
  | 'client'
  | 'error';

type Role = 'host' | 'client';

type UseScoreShareArgs = {
  enabled: boolean;
  roomCode: string;
  localSnapshot: ScoreSnapshot;
};

type UseScoreShareReturn = {
  status: ScoreShareStatus;
  role: Role | null;
  peers: ScoreSnapshot[];
  participantCount: number;
  error: Error | null;
};

type AnnounceMessage = {
  kind: 'announce';
  snapshot: ScoreSnapshot;
};

type LeaveMessage = {
  kind: 'leave';
  peerId: string;
};

type RosterMessage = {
  kind: 'roster';
  snapshots: ScoreSnapshot[];
};

type ShareMessage = AnnounceMessage | LeaveMessage | RosterMessage;

const isShareMessage = (value: unknown): value is ShareMessage => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as { kind?: unknown };
  return (
    candidate.kind === 'announce' ||
    candidate.kind === 'leave' ||
    candidate.kind === 'roster'
  );
};

const sendIfOpen = (connection: DataConnection, message: ShareMessage) => {
  if (connection.open) {
    try {
      connection.send(message);
    } catch {
      // ignore send-after-close races
    }
  }
};

export const useScoreShare = ({
  enabled,
  roomCode,
  localSnapshot,
}: UseScoreShareArgs): UseScoreShareReturn => {
  const [status, setStatus] = useState<ScoreShareStatus>('idle');
  const [role, setRole] = useState<Role | null>(null);
  const [peers, setPeers] = useState<ScoreSnapshot[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const peersRef = useRef<ScoreSnapshot[]>([]);
  const localSnapshotRef = useRef<ScoreSnapshot>(localSnapshot);
  const roleRef = useRef<Role | null>(null);

  useEffect(() => {
    localSnapshotRef.current = localSnapshot;
  }, [localSnapshot]);

  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    if (!enabled || roomCode.length === 0) {
      return undefined;
    }

    let cancelled = false;
    const hostPeerId = buildHostPeerId(roomCode);

    const teardown = () => {
      for (const [peerId, connection] of connectionsRef.current) {
        sendIfOpen(connection, {
          kind: 'leave',
          peerId: localSnapshotRef.current.peerId,
        });
        connection.close();
        connectionsRef.current.delete(peerId);
      }
      if (peerRef.current && !peerRef.current.destroyed) {
        peerRef.current.destroy();
      }
      peerRef.current = null;
      setPeers([]);
      setRole(null);
      roleRef.current = null;
    };

    const broadcast = (message: ShareMessage, exceptPeerId?: string) => {
      for (const [peerId, connection] of connectionsRef.current) {
        if (peerId === exceptPeerId) {
          continue;
        }
        sendIfOpen(connection, message);
      }
    };

    const upsertPeer = (snapshot: ScoreSnapshot) => {
      setPeers((current) => mergePeerScores(current, snapshot));
    };

    const dropPeer = (peerId: string) => {
      setPeers((current) => removePeerScore(current, peerId));
    };

    const wireConnection = (connection: DataConnection) => {
      const onOpen = () => {
        connectionsRef.current.set(connection.peer, connection);
        if (roleRef.current === 'host') {
          sendIfOpen(connection, {
            kind: 'roster',
            snapshots: peersRef.current,
          });
        }
        sendIfOpen(connection, {
          kind: 'announce',
          snapshot: localSnapshotRef.current,
        });
      };

      const onData = (raw: unknown) => {
        if (!isShareMessage(raw)) {
          return;
        }
        if (raw.kind === 'announce') {
          upsertPeer(raw.snapshot);
          if (roleRef.current === 'host') {
            broadcast(raw, connection.peer);
          }
        } else if (raw.kind === 'leave') {
          dropPeer(raw.peerId);
          if (roleRef.current === 'host') {
            broadcast(raw, connection.peer);
          }
        } else if (raw.kind === 'roster') {
          for (const snapshot of raw.snapshots) {
            upsertPeer(snapshot);
          }
        }
      };

      const onClose = () => {
        connectionsRef.current.delete(connection.peer);
        dropPeer(connection.peer);
        if (roleRef.current === 'host') {
          broadcast({ kind: 'leave', peerId: connection.peer });
        }
      };

      connection.on('open', onOpen);
      connection.on('data', onData);
      connection.on('close', onClose);
      connection.on('error', () => {
        onClose();
      });
    };

    const becomeHost = () => {
      const peer = new Peer(hostPeerId);
      peerRef.current = peer;

      peer.on('open', () => {
        if (cancelled) {
          peer.destroy();
          return;
        }
        setRole('host');
        roleRef.current = 'host';
        setStatus('host');
        setPeers([localSnapshotRef.current]);
      });

      peer.on('connection', (connection) => {
        wireConnection(connection);
      });

      peer.on('error', (caught) => {
        if (cancelled) {
          return;
        }
        if (caught.type === 'unavailable-id') {
          peer.destroy();
          if (peerRef.current === peer) {
            peerRef.current = null;
          }
          becomeClient();
          return;
        }
        setError(caught);
        setStatus('error');
      });

      peer.on('disconnected', () => {
        if (cancelled) {
          return;
        }
        peer.reconnect();
      });
    };

    const becomeClient = () => {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        if (cancelled) {
          peer.destroy();
          return;
        }
        const connection = peer.connect(hostPeerId, { reliable: true });
        wireConnection(connection);
        setRole('client');
        roleRef.current = 'client';
        setStatus('client');
        setPeers([localSnapshotRef.current]);
      });

      peer.on('error', (caught) => {
        if (cancelled) {
          return;
        }
        if (caught.type === 'peer-unavailable') {
          peer.destroy();
          if (peerRef.current === peer) {
            peerRef.current = null;
          }
          becomeHost();
          return;
        }
        setError(caught);
        setStatus('error');
      });

      peer.on('disconnected', () => {
        if (cancelled) {
          return;
        }
        peer.reconnect();
      });
    };

    setError(null);
    setStatus('connecting');
    becomeHost();

    return () => {
      cancelled = true;
      teardown();
      setStatus('idle');
    };
  }, [enabled, roomCode]);

  useEffect(() => {
    if (!enabled || roomCode.length === 0) {
      return;
    }
    setPeers((current) => mergePeerScores(current, localSnapshot));
    const message: AnnounceMessage = {
      kind: 'announce',
      snapshot: localSnapshot,
    };
    for (const connection of connectionsRef.current.values()) {
      sendIfOpen(connection, message);
    }
  }, [enabled, roomCode, localSnapshot]);

  return {
    status,
    role,
    peers,
    participantCount: peers.length,
    error,
  };
};
