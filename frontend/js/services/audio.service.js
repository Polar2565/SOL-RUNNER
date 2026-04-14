(function () {
  let ready = false;
  let currentMusicFloor = null;
  let musicVolume = null;
  let sfxVolume = null;
  let musicNodes = [];
  let musicLoops = [];

  const config = {
    masterDb: -4,
    musicDb: -16,
    sfxDb: -4,
  };

  function hasTone() {
    return typeof window.Tone !== "undefined";
  }

  async function unlockAudio() {
    if (!hasTone()) {
      console.warn("Tone.js no está cargado. Revisa el index.html.");
      return false;
    }

    await Tone.start();

    if (!ready) {
      Tone.Destination.volume.value = config.masterDb;
      musicVolume = new Tone.Volume(config.musicDb).toDestination();
      sfxVolume = new Tone.Volume(config.sfxDb).toDestination();
      ready = true;
    }

    return true;
  }

  function safe(fn) {
    try {
      if (!ready || !hasTone()) return;
      fn();
    } catch (error) {
      console.warn("Audio error:", error);
    }
  }

  function n() {
    return Tone.now();
  }

  function addNode(node) {
    musicNodes.push(node);
    return node;
  }

  function addLoop(loop) {
    musicLoops.push(loop);
    return loop;
  }

  function playButton() {
    safe(() => {
      const synth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.001, decay: 0.04, sustain: 0.03, release: 0.08 },
      }).connect(sfxVolume);

      synth.triggerAttackRelease("C6", "32n", n());
      synth.triggerAttackRelease("G6", "32n", n() + 0.035);

      setTimeout(() => synth.dispose(), 300);
    });
  }

  function playPurchase() {
    safe(() => {
      const fx = new Tone.FeedbackDelay("16n", 0.18).connect(sfxVolume);
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.004, decay: 0.12, sustain: 0.18, release: 0.28 },
      }).connect(fx);

      synth.triggerAttackRelease(["C5", "E5", "G5"], "16n", n());
      synth.triggerAttackRelease(["E5", "G5", "B5"], "16n", n() + 0.12);

      setTimeout(() => {
        synth.dispose();
        fx.dispose();
      }, 800);
    });
  }

  function playEquip() {
    safe(() => {
      const synth = new Tone.FMSynth({
        harmonicity: 2.2,
        modulationIndex: 3.5,
        envelope: { attack: 0.005, decay: 0.14, sustain: 0.2, release: 0.25 },
      }).connect(sfxVolume);

      synth.triggerAttackRelease("A4", "16n", n());
      synth.triggerAttackRelease("D5", "16n", n() + 0.1);

      setTimeout(() => synth.dispose(), 500);
    });
  }

  function playShoot() {
    safe(() => {
      const filter = new Tone.Filter(1900, "bandpass").connect(sfxVolume);

      const noise = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.055, sustain: 0, release: 0.02 },
      }).connect(filter);

      const gun = new Tone.MembraneSynth({
        pitchDecay: 0.025,
        octaves: 2.8,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.04 },
      }).connect(sfxVolume);

      noise.triggerAttackRelease("32n", n());
      gun.triggerAttackRelease("C2", "32n", n());

      setTimeout(() => {
        noise.dispose();
        filter.dispose();
        gun.dispose();
      }, 300);
    });
  }

  function playEnemyShoot() {
    safe(() => {
      const synth = new Tone.FMSynth({
        harmonicity: 1.4,
        modulationIndex: 8,
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.002, decay: 0.08, sustain: 0.05, release: 0.08 },
      }).connect(sfxVolume);

      synth.triggerAttackRelease("F3", "32n", n());
      synth.triggerAttackRelease("C3", "32n", n() + 0.045);

      setTimeout(() => synth.dispose(), 300);
    });
  }

  function playEnemyHit() {
    safe(() => {
      const hit = new Tone.MetalSynth({
        frequency: 130,
        envelope: { attack: 0.001, decay: 0.08, release: 0.03 },
        harmonicity: 4.2,
        modulationIndex: 14,
        resonance: 1800,
        octaves: 1.5,
      }).connect(sfxVolume);

      hit.triggerAttackRelease("32n", n());

      setTimeout(() => hit.dispose(), 250);
    });
  }

  function playEnemyDeath() {
    safe(() => {
      const distortion = new Tone.Distortion(0.45).connect(sfxVolume);

      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.07,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.12 },
      }).connect(distortion);

      const noise = new Tone.NoiseSynth({
        noise: { type: "brown" },
        envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.08 },
      }).connect(sfxVolume);

      synth.triggerAttackRelease("A1", "8n", n());
      noise.triggerAttackRelease("16n", n() + 0.03);

      setTimeout(() => {
        synth.dispose();
        noise.dispose();
        distortion.dispose();
      }, 600);
    });
  }

  function playPlayerHit() {
    safe(() => {
      const synth = new Tone.FMSynth({
        harmonicity: 0.7,
        modulationIndex: 12,
        envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.1 },
      }).connect(sfxVolume);

      synth.triggerAttackRelease("C2", "16n", n());

      setTimeout(() => synth.dispose(), 450);
    });
  }

  function playBossSpawn() {
    safe(() => {
      const reverb = new Tone.Reverb({ decay: 2.2, wet: 0.4 }).connect(sfxVolume);

      const synth = new Tone.MonoSynth({
        oscillator: { type: "sawtooth" },
        filter: { Q: 2, type: "lowpass", rolloff: -24 },
        envelope: { attack: 0.02, decay: 0.4, sustain: 0.25, release: 0.8 },
        filterEnvelope: {
          attack: 0.02,
          decay: 0.5,
          sustain: 0.2,
          release: 0.9,
          baseFrequency: 80,
          octaves: 3,
        },
      }).connect(reverb);

      synth.triggerAttackRelease("C2", "2n", n());
      synth.triggerAttackRelease("G1", "2n", n() + 0.18);

      setTimeout(() => {
        synth.dispose();
        reverb.dispose();
      }, 1700);
    });
  }

  function playBossDeath() {
    safe(() => {
      const reverb = new Tone.Reverb({ decay: 2.8, wet: 0.5 }).connect(sfxVolume);

      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.18, sustain: 0.12, release: 0.7 },
      }).connect(reverb);

      synth.triggerAttackRelease(["C4", "E4", "G4"], "8n", n());
      synth.triggerAttackRelease(["E4", "G4", "B4"], "8n", n() + 0.18);
      synth.triggerAttackRelease(["G4", "B4", "D5"], "4n", n() + 0.38);

      setTimeout(() => {
        synth.dispose();
        reverb.dispose();
      }, 1700);
    });
  }

  function playReward() {
    safe(() => {
      const delay = new Tone.FeedbackDelay("16n", 0.25).connect(sfxVolume);

      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.004, decay: 0.12, sustain: 0.18, release: 0.35 },
      }).connect(delay);

      synth.triggerAttackRelease(["C5", "E5", "G5"], "16n", n());
      synth.triggerAttackRelease(["D5", "F5", "A5"], "16n", n() + 0.14);
      synth.triggerAttackRelease(["E5", "G5", "B5"], "8n", n() + 0.28);

      setTimeout(() => {
        synth.dispose();
        delay.dispose();
      }, 1200);
    });
  }

  function playError() {
    safe(() => {
      const synth = new Tone.MonoSynth({
        oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0.05, release: 0.1 },
      }).connect(sfxVolume);

      synth.triggerAttackRelease("C3", "16n", n());
      synth.triggerAttackRelease("G2", "16n", n() + 0.09);

      setTimeout(() => synth.dispose(), 450);
    });
  }

  function playOracleSpin() {
    safe(() => {
      const delay = new Tone.FeedbackDelay("16n", 0.45).connect(sfxVolume);

      const synth = new Tone.FMSynth({
        harmonicity: 2.5,
        modulationIndex: 5,
        envelope: { attack: 0.005, decay: 0.08, sustain: 0.25, release: 0.25 },
      }).connect(delay);

      const notes = ["C5", "D5", "E5", "G5", "A5", "C6", "A5", "G5"];

      notes.forEach((note, index) => {
        synth.triggerAttackRelease(note, "32n", n() + index * 0.055);
      });

      setTimeout(() => {
        synth.dispose();
        delay.dispose();
      }, 900);
    });
  }

  function playOracleReward() {
    playReward();
  }

  function buildMusicTheme(floor) {
    const safeFloor = Math.max(1, Number(floor) || 1);
    const themeIndex = (safeFloor - 1) % 3;

    if (themeIndex === 1) {
      return {
        bpm: 104,
        pad: [
          ["D3", "F3", "A3"],
          ["Bb2", "D3", "F3"],
          ["F3", "A3", "C4"],
          ["C3", "E3", "G3"],
        ],
        bass: ["D2", "D2", "Bb1", "C2"],
        lead: ["F4", "A4", "G4", "E4", "D4", "F4", "A4", "C5"],
      };
    }

    if (themeIndex === 2) {
      return {
        bpm: 112,
        pad: [
          ["E3", "G3", "B3"],
          ["C3", "E3", "G3"],
          ["G3", "B3", "D4"],
          ["D3", "F#3", "A3"],
        ],
        bass: ["E2", "E2", "C2", "D2"],
        lead: ["G4", "B4", "A4", "F#4", "E4", "G4", "B4", "D5"],
      };
    }

    return {
      bpm: 108,
      pad: [
        ["C3", "Eb3", "G3"],
        ["Ab2", "C3", "Eb3"],
        ["Eb3", "G3", "Bb3"],
        ["Bb2", "D3", "F3"],
      ],
      bass: ["C2", "C2", "Ab1", "Bb1"],
      lead: ["Eb4", "G4", "F4", "D4", "C4", "Eb4", "G4", "Bb4"],
    };
  }

  async function startMusicForFloor(floor = 1) {
    await unlockAudio();

    const safeFloor = Math.max(1, Number(floor) || 1);

    if (currentMusicFloor === safeFloor && musicLoops.length) {
      resumeMusic();
      return;
    }

    stopMusic();

    const theme = buildMusicTheme(safeFloor);
    currentMusicFloor = safeFloor;

    Tone.Transport.bpm.value = theme.bpm;

    const reverb = addNode(new Tone.Reverb({ decay: 3.2, wet: 0.28 }).connect(musicVolume));
    const delay = addNode(new Tone.FeedbackDelay("8n", 0.22).connect(reverb));
    const filter = addNode(new Tone.Filter(1800, "lowpass").connect(delay));

    const pad = addNode(
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.6, decay: 0.4, sustain: 0.45, release: 1.6 },
      }).connect(reverb)
    );

    const bass = addNode(
      new Tone.MonoSynth({
        oscillator: { type: "triangle" },
        filter: { Q: 1, type: "lowpass", rolloff: -24 },
        envelope: { attack: 0.02, decay: 0.16, sustain: 0.25, release: 0.35 },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.18,
          sustain: 0.12,
          release: 0.22,
          baseFrequency: 70,
          octaves: 2,
        },
      }).connect(musicVolume)
    );

    const lead = addNode(
      new Tone.FMSynth({
        harmonicity: 1.8,
        modulationIndex: 3,
        envelope: { attack: 0.01, decay: 0.08, sustain: 0.16, release: 0.25 },
      }).connect(filter)
    );

    const kick = addNode(
      new Tone.MembraneSynth({
        pitchDecay: 0.04,
        octaves: 5,
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.04 },
      }).connect(musicVolume)
    );

    const snare = addNode(
      new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.03 },
      }).connect(musicVolume)
    );

    addLoop(
      new Tone.Sequence((time, chord) => {
        pad.triggerAttackRelease(chord, "1m", time);
      }, theme.pad, "1m").start(0)
    );

    addLoop(
      new Tone.Sequence((time, note) => {
        bass.triggerAttackRelease(note, "8n", time);
      }, theme.bass, "4n").start(0)
    );

    addLoop(
      new Tone.Sequence((time, note) => {
        if (note) lead.triggerAttackRelease(note, "16n", time);
      }, theme.lead, "8n").start(0)
    );

    addLoop(
      new Tone.Loop((time) => {
        kick.triggerAttackRelease("C1", "16n", time);
      }, "2n").start(0)
    );

    addLoop(
      new Tone.Loop((time) => {
        snare.triggerAttackRelease("32n", time);
      }, "2n").start("4n")
    );

    Tone.Transport.start();
    resumeMusic();
  }

  function stopMusic() {
    if (!hasTone()) return;

    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();

      musicLoops.forEach((loop) => loop.dispose());
      musicNodes.forEach((node) => node.dispose());

      musicLoops = [];
      musicNodes = [];
      currentMusicFloor = null;
    } catch (error) {
      console.warn("No se pudo detener la música:", error);
    }
  }

  function pauseMusic() {
    if (!ready || !musicVolume) return;
    musicVolume.volume.rampTo(-34, 0.18);
  }

  function resumeMusic() {
    if (!ready || !musicVolume) return;
    musicVolume.volume.rampTo(config.musicDb, 0.18);
  }

  function setMasterVolume(db) {
    config.masterDb = Number(db);
    if (hasTone()) Tone.Destination.volume.value = config.masterDb;
  }

  function setMusicVolume(db) {
    config.musicDb = Number(db);
    if (musicVolume) musicVolume.volume.value = config.musicDb;
  }

  function setSfxVolume(db) {
    config.sfxDb = Number(db);
    if (sfxVolume) sfxVolume.volume.value = config.sfxDb;
  }

  function bindButtonSounds() {
    document.addEventListener(
      "click",
      async (event) => {
        const button = event.target.closest("button");
        if (!button || button.disabled) return;

        await unlockAudio();

        const id = button.id || "";
        const text = (button.textContent || "").toLowerCase();

        if (id === "spinOracleBtn") {
          playOracleSpin();
          return;
        }

        if (id === "dailyRewardBtn" || id === "claimRewardBtn") {
          playOracleReward();
          return;
        }

        if (id.startsWith("buy") || button.classList.contains("shop-btn")) {
          if (
            text.includes("equip") ||
            text.includes("equipar") ||
            text.includes("equipado")
          ) {
            playEquip();
          } else {
            playPurchase();
          }
          return;
        }

        playButton();
      },
      true
    );
  }

  function initAudioService() {
    bindButtonSounds();

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
  }

  window.solRunnerAudio = {
    initAudioService,
    unlockAudio,

    playButton,
    playPurchase,
    playEquip,
    playShoot,
    playEnemyShoot,
    playEnemyHit,
    playEnemyDeath,
    playPlayerHit,
    playBossSpawn,
    playBossDeath,
    playReward,
    playError,
    playOracleSpin,
    playOracleReward,

    startMusicForFloor,
    stopMusic,
    pauseMusic,
    resumeMusic,

    setMasterVolume,
    setMusicVolume,
    setSfxVolume,
  };

  initAudioService();
})();