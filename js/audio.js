/**
 * Photobooth Pro - Web Audio Synthesizer (Zero External Dependencies, 100% Offline)
 */
window.AudioManager = (function(){
  let audioCtx = null;

  function getAudioContext(){
    if(!audioCtx){
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if(AudioContextClass){
        audioCtx = new AudioContextClass();
      }
    }
    if(audioCtx && audioCtx.state === 'suspended'){
      audioCtx.resume();
    }
    return audioCtx;
  }

  /**
   * Play simple synthesized beep
   * @param {number} freq - frequency in Hz
   * @param {number} duration - duration in seconds
   * @param {string} type - oscillator type ('sine' | 'triangle' | 'square')
   */
  function playBeep(freq = 880, duration = 0.12, type = 'sine'){
    const ctx = getAudioContext();
    if(!ctx) return;

    try{
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    }catch(e){
      // Non-blocking on audio failure
    }
  }

  /**
   * Countdown beep for 3, 2, 1
   * Higher pitch on 1 for excitement
   */
  function playCountdown(number){
    if(number === 1){
      playBeep(1200, 0.18, 'sine'); // High pitch alert
    } else {
      playBeep(850, 0.12, 'sine');  // Normal countdown
    }
  }

  /**
   * Synthesized Camera Shutter Click sound (White noise burst + low thud)
   */
  function playShutterSound(){
    const ctx = getAudioContext();
    if(!ctx) return;

    try{
      // 1. White noise burst (mechanical shutter click)
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for(let i = 0; i < bufferSize; i++){
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();

      // 2. Low frequency thud (mirror slap)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.09);

      oscGain.gain.setValueAtTime(0.4, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    }catch(e){
      // Fallback
      playBeep(600, 0.08, 'triangle');
    }
  }

  return {
    playCountdown,
    playShutterSound,
    init: getAudioContext
  };
})();
