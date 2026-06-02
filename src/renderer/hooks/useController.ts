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
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startPolling() {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(() => {
      if (gamepadIndexRef.current === null) return;

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
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      gamepadIndexRef.current = e.gamepad.index;
      startPolling();
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
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
    const handleConnected = () => setIsConnected(true);

    const handleDisconnected = () => {
      const gamepads = navigator.getGamepads();
      setIsConnected(Array.from(gamepads).some(gp => gp !== null));
    };

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    const gamepads = navigator.getGamepads();
    setIsConnected(Array.from(gamepads).some(gp => gp !== null));

    return () => {
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
    };
  }, []);

  return isConnected;
}


