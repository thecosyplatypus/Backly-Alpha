import { useEffect, useRef, useState } from 'react';

interface ControllerConfig {
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onMenu?: () => void;
  onStart?: () => void;
  onSelect?: () => void;
}

export function useController(config: ControllerConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const gamepadIndexRef = useRef<number | null>(null);
  const lastButtonsRef = useRef<number[]>([]);
  const axisThreshold = 0.5;
  const lastAxisState = useRef({ x: 0, y: 0 });
  const axisCooldownRef = useRef(0);

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      if (pollInterval) return;
      pollInterval = setInterval(() => {
        if (gamepadIndexRef.current === null) {
          const gamepads = navigator.getGamepads();
          for (const gp of gamepads) {
            if (gp) {
              gamepadIndexRef.current = gp.index;
              break;
            }
          }
          if (gamepadIndexRef.current === null) return;
        }

        const gamepad = navigator.getGamepads()[gamepadIndexRef.current];
        if (!gamepad) {
          gamepadIndexRef.current = null;
          return;
        }

        const buttons = gamepad.buttons.map((b) => b.pressed ? 1 : 0);
        const now = Date.now();

        if (axisCooldownRef.current < now) {
          const x = Math.abs(gamepad.axes[0]) > axisThreshold ? Math.sign(gamepad.axes[0]) : 0;
          const y = Math.abs(gamepad.axes[1]) > axisThreshold ? Math.sign(gamepad.axes[1]) : 0;

          if (x !== lastAxisState.current.x || y !== lastAxisState.current.y) {
            if (x === 1) configRef.current.onNavigateRight?.();
            else if (x === -1) configRef.current.onNavigateLeft?.();
            if (y === 1) configRef.current.onNavigateDown?.();
            else if (y === -1) configRef.current.onNavigateUp?.();
            lastAxisState.current = { x, y };
            axisCooldownRef.current = now + 200;
          }
        }

        const BUTTON_MAP: Record<number, keyof ControllerConfig> = {
          0: 'onConfirm',
          1: 'onCancel',
          2: 'onMenu',
          3: 'onStart',
          8: 'onSelect',
          9: 'onStart',
          12: 'onNavigateUp',
          13: 'onNavigateDown',
          14: 'onNavigateLeft',
          15: 'onNavigateRight',
        };

        for (let i = 0; i < buttons.length; i++) {
          const prev = lastButtonsRef.current[i] || 0;
          if (buttons[i] === 1 && prev === 0) {
            const action = BUTTON_MAP[i];
            if (action) {
              configRef.current[action]?.();
            }
          }
        }
        lastButtonsRef.current = buttons;
      }, 50);
    }

    function stopPolling() {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }

    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('[Controller] Connected:', e.gamepad.id);
      gamepadIndexRef.current = e.gamepad.index;
      startPolling();
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('[Controller] Disconnected:', e.gamepad.id);
      if (gamepadIndexRef.current === e.gamepad.index) {
        gamepadIndexRef.current = null;
      }
      const gamepads = navigator.getGamepads();
      const stillConnected = Array.from(gamepads).some(gp => gp !== null);
      if (!stillConnected) {
        stopPolling();
      }
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    const gamepads = navigator.getGamepads();
    const hasConnected = Array.from(gamepads).some(gp => gp !== null);
    if (hasConnected) {
      startPolling();
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      stopPolling();
    };
  }, []);
}

export function useGamepadDetection() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkGamepads = () => {
      const gamepads = navigator.getGamepads();
      const connected = Array.from(gamepads).some(gp => gp !== null);
      setIsConnected(connected);
    };

    window.addEventListener('gamepadconnected', () => setIsConnected(true));
    window.addEventListener('gamepaddisconnected', () => {
      const gamepads = navigator.getGamepads();
      const connected = Array.from(gamepads).some(gp => gp !== null);
      setIsConnected(connected);
    });

    const interval = setInterval(checkGamepads, 2000);
    checkGamepads();

    return () => {
      window.removeEventListener('gamepadconnected', () => setIsConnected(true));
      window.removeEventListener('gamepaddisconnected', checkGamepads);
      clearInterval(interval);
    };
  }, []);

  return isConnected;
}


