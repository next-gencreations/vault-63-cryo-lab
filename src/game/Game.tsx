import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Scene } from './Scene';
import { PipBoy } from './PipBoy';
import { TerminalModal } from './TerminalModal';
import { Crosshair } from './Crosshair';
import { MobileControls } from './MobileControls';
import { DayCounter } from './DayCounter';
import { RadiationScanner } from './RadiationScanner';
import { CinematicIntro } from './CinematicIntro';
import { VaultGirl } from './VaultGirl';
import { PipBoyScreen } from './types';
import { checkWebGL } from './WebGLCheck';
import { useTradingData } from './useTradingData';
import { VaultDoomInvaders } from './VaultDoomInvaders';

const isMobile = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

function NoWebGL() {
  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#010801',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier New', monospace", color: '#00ff44', gap: 14,
    }}>
      <div style={{ fontSize: 24, letterSpacing: 6, textShadow: '0 0 20px #00ff44' }}>VAULT 63</div>
      <div style={{ color: '#ff4444', fontSize: 11, letterSpacing: 3 }}>DISPLAY SYSTEM FAILURE</div>
      <div style={{ color: '#008822', fontSize: 10, letterSpacing: 1, textAlign: 'center', maxWidth: 360, lineHeight: 1.8 }}>
        WebGL is required for the 3D vault experience.<br />
        Please open in a WebGL-capable browser tab.
      </div>
    </div>
  );
}

function VaultGame() {
  const [showCinematic, setShowCinematic] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const [nearbyTerminal, setNearbyTerminal] = useState<string | null>(null);
  const [activeTerminal, setActiveTerminal] = useState<string | null>(null);
  const [pipBoyOpen, setPipBoyOpen] = useState(false);
  const [pipBoyScreen, setPipBoyScreen] = useState<PipBoyScreen>('STAT');
  const [doomOpen, setDoomOpen] = useState(false);

  // Live trading data — drives Pip-Boy TRADE screen, terminal, and vault girl mood
  const trading = useTradingData(8_000);

  // Shared refs that cross the Canvas/HTML boundary
  const cameraRotRef = useRef({ yaw: 0, pitch: 0 });
  const moveInputRef = useRef({ x: 0, z: 0 });
  const playerPosRef = useRef({ x: 0, z: 9 });

  const isModalOpen = pipBoyOpen || !!activeTerminal || doomOpen;

  // Intro sequence
  useEffect(() => {
    const t1 = setTimeout(() => setIntroStep(1), 1800);
    const t2 = setTimeout(() => setIntroStep(2), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        if (!activeTerminal) setPipBoyOpen(o => !o);
      }
      if (e.code === 'KeyE' && nearbyTerminal && isActive && !isModalOpen) {
        setActiveTerminal(nearbyTerminal);
      }
      if (e.code === 'KeyK' && isActive && !activeTerminal && !pipBoyOpen) {
        setDoomOpen(o => !o);
      }
      if (e.code === 'Escape') {
        if (doomOpen) { setDoomOpen(false); return; }
        if (activeTerminal) { setActiveTerminal(null); return; }
        if (pipBoyOpen) { setPipBoyOpen(false); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nearbyTerminal, isActive, isModalOpen, activeTerminal, pipBoyOpen, doomOpen]);

  const handleLock = useCallback(() => { setIsActive(true); setHasStarted(true); }, []);
  const handleUnlock = useCallback(() => setIsActive(false), []);
  const handleNearTerminal = useCallback((id: string | null) => setNearbyTerminal(id), []);

  const handleMobileStart = () => {
    setIsActive(true);
    setHasStarted(true);
  };

  const handleInteract = useCallback(() => {
    if (nearbyTerminal) setActiveTerminal(nearbyTerminal);
  }, [nearbyTerminal]);

  const handlePipBoy = useCallback(() => {
    if (!activeTerminal) setPipBoyOpen(o => !o);
  }, [activeTerminal]);

  const showHUD = isActive && !isModalOpen;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#010801',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
      fontFamily: "'Courier New', monospace",
      touchAction: 'none',
    }}>
      {/* ── Cinematic intro (shown before game starts) ── */}
      {showCinematic && (
        <CinematicIntro onComplete={() => setShowCinematic(false)} />
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ fov: isMobile ? 80 : 75, near: 0.1, far: 100 }}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 0.9 }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Suspense fallback={null}>
          <Scene
            introStep={introStep}
            nearbyTerminal={nearbyTerminal}
            onNearTerminal={handleNearTerminal}
            onLock={handleLock}
            onUnlock={handleUnlock}
            paused={isModalOpen}
            isMobile={isMobile}
            cameraRotRef={cameraRotRef}
            moveInputRef={moveInputRef}
            playerPosRef={playerPosRef}
          />
        </Suspense>
      </Canvas>

      {/* ---- MOBILE UI ---- */}
      {isMobile && (
        <>
          {/* Tap-to-start overlay */}
          {!isActive && !isModalOpen && (
            <div
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,5,0,0.92)',
                zIndex: 200,
              }}
              onTouchStart={handleMobileStart}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, #c8a000, #ffd040, #c8a000)' }} />
              <div style={{ color: '#c8a000', fontSize: 10, letterSpacing: 5, marginBottom: 18, opacity: 0.75 }}>VAULT-TEC CORPORATION</div>
              <div style={{
                color: '#ffd040', fontSize: 40, fontWeight: 'bold',
                letterSpacing: 10, marginBottom: 4,
                textShadow: '0 0 40px #ffd040, 0 0 80px #c8a00066',
              }}>VAULT 63</div>
              <div style={{ color: '#88aacc', fontSize: 11, letterSpacing: 6, marginBottom: 6 }}>CRYOGENIC LABORATORY</div>
              <div style={{ color: '#445566', fontSize: 9, letterSpacing: 3, marginBottom: 50 }}>SANCTUARY HILLS · MASSACHUSETTS</div>
              <div style={{
                color: '#ffd040', fontSize: 14, letterSpacing: 4,
                border: '2px solid #c8a000', padding: '14px 44px',
                borderRadius: 2, background: 'rgba(200,160,0,0.08)',
                boxShadow: '0 0 24px #c8a00033',
                animation: 'pulseBtn 2s ease-in-out infinite',
              }}>
                TAP TO ENTER VAULT
              </div>
              <div style={{ color: '#445566', fontSize: 9, letterSpacing: 1, marginTop: 30, textAlign: 'center', lineHeight: 2.2 }}>
                LEFT JOYSTICK — MOVE<br />
                SWIPE RIGHT — LOOK<br />
                TAP BUTTONS — INTERACT / PIP-BOY
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #c8a000, #ffd040, #c8a000)' }} />
            </div>
          )}

          {/* Mobile touch controls */}
          {isActive && (
            <MobileControls
              cameraRotRef={cameraRotRef}
              moveInputRef={moveInputRef}
              nearbyTerminal={nearbyTerminal}
              onInteract={handleInteract}
              onPipBoy={handlePipBoy}
              isModalOpen={isModalOpen}
            />
          )}

          {showHUD && (
            <button
              onClick={() => setDoomOpen(true)}
              style={{
                position: 'fixed', top: 96, right: 8, zIndex: 140,
                background: trading.pnlToday > 0 ? 'rgba(60,20,0,0.95)' : 'rgba(0,20,0,0.85)',
                border: '1px solid #ffcc44', color: '#ffcc44', borderRadius: 5,
                padding: '9px 10px', fontFamily: 'Courier New, monospace',
                fontSize: 10, letterSpacing: 1, boxShadow: '0 0 14px #ffcc4433',
              }}
            >DOOM<br/>DEFENCE</button>
          )}

          {showHUD && (
            <div style={{
              position: 'fixed', bottom: 88, right: 8, width: 92, zIndex: 130,
              pointerEvents: 'none', background: 'rgba(0,16,0,0.72)',
              border: '1px solid #00aa44', borderRadius: 8, padding: 6,
              textAlign: 'center',
            }}>
              <VaultGirl
                direction="down"
                walking={false}
                introStep={3}
                mood={trading.mood}
                vaultState={trading.vaultState}
                vaultLine={trading.vaultLine}
              />
              <div style={{ color: '#00ff88', fontSize: 7, letterSpacing: 1, marginTop: 3 }}>
                {trading.status} · {trading.connected ? trading.secondsAgo + 's' : 'SYNC'}<br/>
                HP {trading.lossStreak >= 3 ? 'LOW' : 'OK'} · {trading.pnlToday >= 0 ? '+' : ''}${trading.pnlToday.toFixed(2)}
              </div>
            </div>
          )}

          {/* Mobile vault badge (top center) */}
          {showHUD && (
            <div style={{
              position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,10,0,0.75)', border: '1px solid #1a4a1a',
              borderRadius: 3, padding: '4px 16px', textAlign: 'center', zIndex: 100, pointerEvents: 'none',
            }}>
              <div style={{ color: '#00ff44', fontSize: 11, fontWeight: 'bold', letterSpacing: 4 }}>VAULT 63</div>
              <div style={{ color: '#00aa33', fontSize: 7, letterSpacing: 2 }}>CRYO LEVEL</div>
            </div>
          )}
        </>
      )}

      {/* ---- DESKTOP UI ---- */}
      {!isMobile && (
        <>
          {/* Click-to-start overlay */}
          {!isActive && !isModalOpen && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: hasStarted ? 'rgba(0,8,0,0.55)' : 'rgba(0,5,0,0.90)',
              zIndex: 200, cursor: 'pointer',
              transition: 'background 0.4s',
            }}>
              {!hasStarted ? (
                <>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, #c8a000, #ffd040, #c8a000)' }} />
                  <div style={{ color: '#c8a000', fontSize: 11, letterSpacing: 5, marginBottom: 18, opacity: 0.75 }}>VAULT-TEC CORPORATION</div>
                  <div style={{
                    color: '#ffd040', fontSize: 48, fontWeight: 'bold',
                    letterSpacing: 12, marginBottom: 4,
                    textShadow: '0 0 40px #ffd040, 0 0 90px #c8a00055',
                  }}>VAULT 63</div>
                  <div style={{ color: '#88aacc', fontSize: 13, letterSpacing: 7, marginBottom: 6 }}>CRYOGENIC LABORATORY — LEVEL 1</div>
                  <div style={{ color: '#445566', fontSize: 10, letterSpacing: 3, marginBottom: 52 }}>SANCTUARY HILLS · MASSACHUSETTS · ESTABLISHED 2077</div>
                  <div style={{
                    color: '#ffd040', fontSize: 13, letterSpacing: 4,
                    border: '2px solid #c8a000', padding: '12px 40px', borderRadius: 2,
                    background: 'rgba(200,160,0,0.08)',
                    boxShadow: '0 0 24px #c8a00033',
                    animation: 'pulseBtn 2s ease-in-out infinite',
                  }}>CLICK TO ENTER VAULT</div>
                  <div style={{ color: '#445566', fontSize: 9, letterSpacing: 2, marginTop: 26, lineHeight: 2 }}>
                    WASD — MOVE &nbsp;·&nbsp; MOUSE — LOOK &nbsp;·&nbsp; E — INTERACT &nbsp;·&nbsp; TAB — PIP-BOY
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #c8a000, #ffd040, #c8a000)' }} />
                </>
              ) : (
                <>
                  <div style={{ color: '#c8a000', fontSize: 13, letterSpacing: 4, marginBottom: 14 }}>
                    POINTER LOCK RELEASED
                  </div>
                  <div style={{
                    color: '#ffd040', fontSize: 12, letterSpacing: 3,
                    border: '2px solid #c8a000', padding: '10px 30px', borderRadius: 2,
                    background: 'rgba(200,160,0,0.08)',
                  }}>CLICK TO RESUME</div>
                </>
              )}
            </div>
          )}

          {/* Desktop crosshair */}
          {showHUD && <Crosshair nearbyTerminal={nearbyTerminal} />}

          {/* Desktop — [E] prompt */}
          {showHUD && nearbyTerminal && (
            <div style={{
              position: 'fixed', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,12,0,0.9)', border: '1px solid #00aa33',
              borderRadius: 3, padding: '7px 22px',
              color: '#00ff44', fontSize: 12, letterSpacing: 3,
              zIndex: 100, pointerEvents: 'none',
            }}>[E] ACCESS TERMINAL</div>
          )}

          {/* Desktop controls hint */}
          {showHUD && (
            <div style={{
              position: 'fixed', bottom: 16, left: 16,
              background: 'rgba(0,10,0,0.75)', border: '1px solid #1a3a1a',
              borderRadius: 3, padding: '7px 12px',
              color: '#00aa33', fontSize: 9, lineHeight: 1.9, letterSpacing: 1, zIndex: 100,
            }}>
              <div style={{ color: '#00ff44', marginBottom: 2, letterSpacing: 2 }}>CONTROLS</div>
              WASD / ARROWS — MOVE<br />
              MOUSE — LOOK AROUND<br />
              E — INTERACT WITH TERMINAL<br />
              TAB — OPEN PIP-BOY<br />
              K — DOOM DEFENCE<br />
              ESC — RELEASE MOUSE
            </div>
          )}

          {/* Desktop Vault 63 badge */}
          {showHUD && (
            <div style={{
              position: 'fixed', top: 16, right: 16,
              background: 'rgba(0,10,0,0.8)', border: '1px solid #1a4a1a',
              borderRadius: 3, padding: '5px 14px', textAlign: 'center', zIndex: 100,
            }}>
              <div style={{ color: '#00ff44', fontSize: 12, fontWeight: 'bold', letterSpacing: 4 }}>VAULT 63</div>
              <div style={{ color: '#00aa33', fontSize: 8, letterSpacing: 2 }}>CRYO LEVEL</div>
            </div>
          )}

          {/* Desktop Vault Girl companion widget */}
          {showHUD && (
            <div style={{
              position: 'fixed', bottom: 0, right: 0,
              width: 140,
              background: 'linear-gradient(135deg, transparent 0%, rgba(0,16,0,0.80) 50%)',
              borderTop: '1px solid #1a3a1a', borderLeft: '1px solid #1a3a1a',
              borderRadius: '12px 0 0 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 4, zIndex: 50,
              padding: '10px 8px 8px',
            }}>
              <VaultGirl
                direction="down"
                walking={false}
                introStep={3}
                mood={trading.mood}
                vaultState={trading.vaultState}
                vaultLine={trading.vaultLine}
              />
              <div style={{ color: '#00aa33', fontSize: 7, letterSpacing: 2, textAlign: 'center' }}>
                TAB — PIP-BOY
              </div>
            </div>
          )}

          {showHUD && (
            <button
              onClick={() => setDoomOpen(true)}
              style={{
                position: 'fixed', bottom: 16, right: 160, zIndex: 110,
                background: 'rgba(20,6,0,0.9)', border: '1px solid #ffcc44',
                color: '#ffcc44', borderRadius: 5, padding: '10px 14px',
                fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: 2,
                boxShadow: '0 0 16px #ffcc4433', cursor: 'pointer',
              }}
            >DOOM DEFENCE</button>
          )}

        </>
      )}

      {/* ---- SHARED HUD (both mobile & desktop) ---- */}

      {/* Day counter — top left */}
      <DayCounter visible={showHUD} />

      {/* Radiation scanner — bottom right (desktop) / top right (mobile) */}
      <div style={isMobile ? {
        position: 'fixed', top: 52, right: 8,
      } : {}}>
        <RadiationScanner playerPosRef={playerPosRef} visible={showHUD} />
      </div>

      {/* Intro cinematic text */}
      {introStep < 2 && (
        <div style={{
          position: 'fixed', top: '28%', left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center', pointerEvents: 'none', zIndex: 300,
        }}>
          {introStep === 0 && (
            <div style={{ color: '#1a4a8a', fontSize: isMobile ? 11 : 14, letterSpacing: 4 }}>
              CRYOGENIC STASIS SYSTEM — VAULT 63
            </div>
          )}
          {introStep === 1 && (
            <div style={{ color: '#00aaff', fontSize: isMobile ? 11 : 14, letterSpacing: 3, textShadow: '0 0 15px #00aaff' }}>
              EMERGENCY OVERRIDE — THAWING SUBJECT...
            </div>
          )}
        </div>
      )}

      {/* PipBoy modal */}
      <PipBoy
        open={pipBoyOpen}
        screen={pipBoyScreen}
        onChangeScreen={setPipBoyScreen}
        onClose={() => setPipBoyOpen(false)}
        tradingData={trading}
        apiUrl={trading.apiUrl}
        setApiUrl={trading.setApiUrl}
      />

      {/* Terminal modal */}
      <TerminalModal
        terminalId={activeTerminal}
        onClose={() => setActiveTerminal(null)}
        tradingData={trading}
      />

      <VaultDoomInvaders
        open={doomOpen}
        onClose={() => setDoomOpen(false)}
        tradingData={trading}
      />

      <style>{`
        @keyframes pulseBtn {
          0%, 100% { box-shadow: 0 0 20px #00ff4422; }
          50% { box-shadow: 0 0 30px #00ff4466, 0 0 50px #00ff4422; }
        }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}

export function Game() {
  if (!checkWebGL()) return <NoWebGL />;
  return <VaultGame />;
}
