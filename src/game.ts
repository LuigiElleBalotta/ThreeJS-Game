import * as THREE from "three";
import { Player } from "./player";
import { Enemy } from "./enemy";
import { UI } from "./ui";
import { HealthBarAbove } from "./healthBarAbove";
import { ThirdPersonCamera } from "./camera";

export class Game {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  player!: Player;
  enemies: Enemy[] = [];
  hbAbove: HealthBarAbove[] = [];
  keys: Set<string> = new Set();
  ui!: UI;
  clock!: THREE.Clock;

  cameraControl!: ThirdPersonCamera;
  rightMouseDown: boolean = false;
  mouseLeftDown: boolean = false;
  healthBarsVisible: boolean = true;
  healthBarStatusDiv!: HTMLDivElement;
  sceneObstacles: THREE.Mesh[] = [];

  loaderDiv!: HTMLDivElement;
  fpsDiv!: HTMLDivElement;
  lastFpsUpdate: number = 0;
  frames: number = 0;
  fps: number = 0;

  audio: HTMLAudioElement;
  audioStarted: boolean = false;
  mousePos = { x: 0, y: 0 };
  selectedEnemy: Enemy | null = null;
  selectionCircle: THREE.Mesh | null = null;
  damageTexts: { div: HTMLDivElement, start: number, angle: number }[] = [];
  spellCooldown: number = 0;
  spellLastCast: number = 0;

  enemyBarDiv: HTMLDivElement | null = null;

  lastCombatTime: number = 0;
  lastLogTime: number = 0;
  lastHpRegenTime: number = 0;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({antialias:true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // FPS overlay
    this.fpsDiv = document.createElement("div");
    this.fpsDiv.style.position = "fixed";
    this.fpsDiv.style.bottom = "10px";
    this.fpsDiv.style.right = "20px";
    this.fpsDiv.style.background = "rgba(0,0,0,0.7)";
    this.fpsDiv.style.color = "#0f0";
    this.fpsDiv.style.fontFamily = "monospace";
    this.fpsDiv.style.fontSize = "1.2rem";
    this.fpsDiv.style.padding = "6px 16px";
    this.fpsDiv.style.borderRadius = "8px";
    this.fpsDiv.style.zIndex = "99999";
    this.fpsDiv.innerText = "FPS: ...";
    document.body.appendChild(this.fpsDiv);
    this.fpsDiv.style.display = "block";

    // Loader overlay
    this.loaderDiv = document.createElement("div");
    this.loaderDiv.style.position = "fixed";
    this.loaderDiv.style.top = "0";
    this.loaderDiv.style.left = "0";
    this.loaderDiv.style.width = "100vw";
    this.loaderDiv.style.height = "100vh";
    this.loaderDiv.style.background = "#222";
    this.loaderDiv.style.color = "#fff";
    this.loaderDiv.style.fontSize = "3rem";
    this.loaderDiv.style.display = "flex";
    this.loaderDiv.style.alignItems = "center";
    this.loaderDiv.style.justifyContent = "center";
    this.loaderDiv.style.zIndex = "999999";
    this.loaderDiv.innerText = "Caricamento...";
    document.body.appendChild(this.loaderDiv);

    // Crea e aggiungi il div per il messaggio stato healthbar
    this.healthBarStatusDiv = document.createElement("div");
    this.healthBarStatusDiv.style.position = "fixed";
    this.healthBarStatusDiv.style.top = "40px";
    this.healthBarStatusDiv.style.left = "50%";
    this.healthBarStatusDiv.style.transform = "translateX(-50%)";
    this.healthBarStatusDiv.style.display = "none";
    document.body.appendChild(this.healthBarStatusDiv);

    // Mobile overlay
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|Mobile/i.test(navigator.userAgent) || window.innerWidth < 800;
    if (isMobile) {
      const mobileOverlay = document.createElement("div");
      mobileOverlay.id = "mobile-rotate-overlay";
      mobileOverlay.style.position = "fixed";
      mobileOverlay.style.top = "0";
      mobileOverlay.style.left = "0";
      mobileOverlay.style.width = "100vw";
      mobileOverlay.style.height = "100vh";
      mobileOverlay.style.background = "rgba(0,0,0,0.85)";
      mobileOverlay.style.display = "flex";
      mobileOverlay.style.alignItems = "center";
      mobileOverlay.style.justifyContent = "center";
      mobileOverlay.style.zIndex = "9999999";
      mobileOverlay.style.color = "#fff";
      mobileOverlay.style.fontSize = "2.5rem";
      mobileOverlay.style.fontWeight = "bold";
      mobileOverlay.innerText = "Rotate your phone to play";
      document.body.appendChild(mobileOverlay);
      setTimeout(() => {
        mobileOverlay.remove();
      }, 5000);
    }

    // Responsive resize (canvas e camera)
    const resizeCanvas = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);

    // Fullscreen button (mobile)
    if (isMobile) {
      const fsBtn = document.createElement("button");
      fsBtn.innerText = "⛶";
      fsBtn.style.position = "fixed";
      fsBtn.style.bottom = "2vh";
      fsBtn.style.right = "2vw";
      fsBtn.style.width = "56px";
      fsBtn.style.height = "56px";
      fsBtn.style.fontSize = "2.2rem";
      fsBtn.style.background = "#222";
      fsBtn.style.color = "#fff";
      fsBtn.style.border = "2px solid #fff";
      fsBtn.style.borderRadius = "50%";
      fsBtn.style.opacity = "0.85";
      fsBtn.style.zIndex = "999999";
      fsBtn.style.userSelect = "none";
      fsBtn.style.touchAction = "none";
      fsBtn.addEventListener("touchstart", e => {
        e.preventDefault();
        // Prefer fullscreen on canvas for Safari/iOS
        const el = this.renderer.domElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
        else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
      });
      document.body.appendChild(fsBtn);
    }

    // Musica di sottofondo
    this.audio = new Audio("/music/background.mp3");
    this.audio.loop = true;
    this.audio.volume = 0.2;

    // Avvia la musica al primo input utente
    const startAudio = () => {
      if (!this.audioStarted) {
        this.audio.play();
        this.audioStarted = true;
      }
    };
    window.addEventListener("keydown", startAudio, { once: true });
    window.addEventListener("mousedown", startAudio, { once: true });
    window.addEventListener("touchstart", startAudio, { once: true });

    this.initWorld();

    // Gestione hotkey spellbar (1-0,-,click)
    window.addEventListener("keydown", (e) => {
      const key = e.key;
      if (key === "1") this.castSpell(0);
      if (key === "2") this.castSpell(1);
      if (key === "3") this.castSpell(2);
      if (key === "4") this.castSpell(3);
      if (key === "5") this.castSpell(4);
      if (key === "6") this.castSpell(5);
      if (key === "7") this.castSpell(6);
      if (key === "8") this.castSpell(7);
      if (key === "9") this.castSpell(8);
      if (key === "0") this.castSpell(9);
      if (key === "-") this.castSpell(10);
      if (key === "Escape" && this.selectedEnemy) {
        this.selectedEnemy = null;
      }
    });

    // Barra vita nemico selezionato in alto a destra
    this.enemyBarDiv = document.createElement("div");
    this.enemyBarDiv.style.position = "fixed";
    this.enemyBarDiv.style.top = "32px";
    this.enemyBarDiv.style.right = "32px";
    this.enemyBarDiv.style.width = "320px";
    this.enemyBarDiv.style.height = "48px";
    this.enemyBarDiv.style.background = "rgba(30,30,30,0.92)";
    this.enemyBarDiv.style.border = "2px solid #fff";
    this.enemyBarDiv.style.borderRadius = "12px";
    this.enemyBarDiv.style.display = "none";
    this.enemyBarDiv.style.zIndex = "10002";
    this.enemyBarDiv.style.boxShadow = "0 2px 12px #000";
    this.enemyBarDiv.innerHTML = `
      <div id="enemy-bar-name" style="color:#fff;font-weight:bold;font-size:1.1rem;padding:4px 0 0 16px;"></div>
      <div style="width:90%;height:18px;background:#333;border-radius:8px;margin:4px auto 0 auto;position:relative;">
        <div id="enemy-bar-hp" style="height:100%;background:#ff0060;border-radius:8px;width:100%;transition:width 0.2s;"></div>
        <div id="enemy-bar-hp-text" style="position:absolute;left:50%;top:0;transform:translateX(-50%);color:#fff;font-size:1rem;font-weight:bold;text-shadow:0 0 4px #000;">HP</div>
      </div>
    `;
    document.body.appendChild(this.enemyBarDiv);

    // Click manuale sull'ultimo slot
    setTimeout(() => {
      const spellbar = document.getElementById("spellbar");
      if (spellbar) {
        const slots = spellbar.getElementsByClassName("spell-slot");
        if (slots.length >= 12) {
          slots[11].addEventListener("click", () => this.castSpell(11));
        }
      }
    }, 500);

    // Mostra testo danno subito
    window.addEventListener("playerDamage", (e: any) => {
      const amount = e.detail.amount;
      // Combat timer: resetta ogni danno subito
      this.lastCombatTime = performance.now();
      // Se chi ha inflitto il danno è noto e non è già selezionato, selezionalo
      if (e.detail && e.detail.sourceEnemy && (!this.selectedEnemy || this.selectedEnemy !== e.detail.sourceEnemy)) {
        this.selectedEnemy = e.detail.sourceEnemy;
      }
      const div = document.createElement("div");
      div.innerText = `-${amount}`;
      div.style.position = "fixed";
      div.style.color = "#ff2222";
      div.style.fontWeight = "bold";
      div.style.fontSize = "28px";
      div.style.pointerEvents = "none";
      div.style.textShadow = "0 0 8px #000, 0 0 2px #fff";
      div.style.zIndex = "99999";
      div.style.padding = "2px 10px";
      div.style.borderRadius = "8px";
      div.style.background = "rgba(0,0,0,0.15)";
      document.body.appendChild(div);
      // Angolo random per effetto circolare
      const angle = Math.random() * Math.PI * 2;
      this.damageTexts.push({ div, start: performance.now(), angle });
    });

    // Selezione nemico con click
    window.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return; // solo click sinistro
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(this.mousePos, this.camera);
      let found: Enemy | null = null;
      for (const enemy of this.enemies) {
        if (!enemy.isAlive()) continue;
        const intersects = raycaster.intersectObject(enemy.mesh, true);
        if (intersects.length > 0) {
          found = enemy;
          break;
        }
      }
      this.selectedEnemy = found;
    });

    // Mobile controller
    if (isMobile) {
      const controller = document.createElement("div");
      controller.id = "mobile-controller";
      controller.style.position = "fixed";
      controller.style.right = "2vw";
      controller.style.bottom = "10vh";
      controller.style.zIndex = "99999";
      controller.style.display = "flex";
      controller.style.flexDirection = "column";
      controller.style.alignItems = "center";
      controller.style.gap = "2vw";

      // Joystick (up, left, right, down)
      const directions = [
        { key: "w", label: "▲" },
        { key: "a", label: "◀" },
        { key: "s", label: "▼" },
        { key: "d", label: "▶" }
      ];
      const joystick = document.createElement("div");
      joystick.style.display = "grid";
      joystick.style.gridTemplateColumns = "40px 40px 40px";
      joystick.style.gridTemplateRows = "40px 40px 40px";
      joystick.style.gap = "5px";
      joystick.style.marginBottom = "10px";

      // Empty cells for grid
      for (let i = 0; i < 9; i++) {
        const btn = document.createElement("button");
        btn.style.width = "40px";
        btn.style.height = "40px";
        btn.style.fontSize = "1.5rem";
        btn.style.opacity = "0.8";
        btn.style.background = "#222";
        btn.style.color = "#fff";
        btn.style.border = "2px solid #fff";
        btn.style.borderRadius = "8px";
        btn.style.touchAction = "none";
        btn.style.userSelect = "none";
        btn.style.webkitUserSelect = "none";
        btn.style.outline = "none";
        btn.style.transition = "background 0.2s";
        btn.style.margin = "0";
        btn.style.padding = "0";
        btn.disabled = true;
        btn.addEventListener("touchstart", e => e.preventDefault());
        joystick.appendChild(btn);
      }
      // Up
      joystick.children[1].innerHTML = "▲";
      joystick.children[1].disabled = false;
      joystick.children[1].addEventListener("touchstart", () => this.keys.add("w"));
      joystick.children[1].addEventListener("touchend", () => this.keys.delete("w"));
      // Left
      joystick.children[3].innerHTML = "◀";
      joystick.children[3].disabled = false;
      joystick.children[3].addEventListener("touchstart", () => this.keys.add("a"));
      joystick.children[3].addEventListener("touchend", () => this.keys.delete("a"));
      // Down
      joystick.children[7].innerHTML = "▼";
      joystick.children[7].disabled = false;
      joystick.children[7].addEventListener("touchstart", () => this.keys.add("s"));
      joystick.children[7].addEventListener("touchend", () => this.keys.delete("s"));
      // Right
      joystick.children[5].innerHTML = "▶";
      joystick.children[5].disabled = false;
      joystick.children[5].addEventListener("touchstart", () => this.keys.add("d"));
      joystick.children[5].addEventListener("touchend", () => this.keys.delete("d"));

      controller.appendChild(joystick);

      // Jump button
      const jumpBtn = document.createElement("button");
      jumpBtn.innerText = "⤒";
      jumpBtn.style.width = "60px";
      jumpBtn.style.height = "60px";
      jumpBtn.style.fontSize = "2rem";
      jumpBtn.style.opacity = "0.9";
      jumpBtn.style.background = "#ff0060";
      jumpBtn.style.color = "#fff";
      jumpBtn.style.border = "2px solid #fff";
      jumpBtn.style.borderRadius = "50%";
      jumpBtn.style.touchAction = "none";
      jumpBtn.style.userSelect = "none";
      jumpBtn.style.outline = "none";
      jumpBtn.style.marginTop = "10px";
      jumpBtn.addEventListener("touchstart", e => {
        e.preventDefault();
        this.keys.add(" ");
        this.player && this.player.jump();
      });
      jumpBtn.addEventListener("touchend", () => this.keys.delete(" "));

      controller.appendChild(jumpBtn);

      document.body.appendChild(controller);

      // Camera swipe (mobile)
      let lastTouchX: number | null = null;
      let isSwiping = false;
      const swipeArea = this.renderer.domElement;
      swipeArea.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
          lastTouchX = e.touches[0].clientX;
          isSwiping = true;
        }
      });
      swipeArea.addEventListener("touchmove", (e) => {
        if (isSwiping && e.touches.length === 1 && lastTouchX !== null) {
          e.preventDefault();
          const dx = e.touches[0].clientX - lastTouchX;
          lastTouchX = e.touches[0].clientX;
          // Sensibilità swipe (più basso = più sensibile)
          this.cameraControl.rotation.y -= dx * 0.008;
        }
      }, { passive: false });
      swipeArea.addEventListener("touchend", () => {
        isSwiping = false;
        lastTouchX = null;
      });
    }
  }

  castSpell(slot: number) {
    // Solo slot 0 (tasto 1) attivo per ora
    if (slot !== 0) return;
    const now = performance.now();
    if (now - this.spellLastCast < 1000) return;

    // Spellbar slot 0
    const spellbar = document.getElementById("spellbar");
    let slots: HTMLCollectionOf<Element> | null = null;
    if (spellbar) slots = spellbar.getElementsByClassName("spell-slot");

    // Funzione overlay cooldown SVG
    function showCooldownOverlay(slotElem: Element) {
      let svg = slotElem.querySelector("svg.cooldown-svg") as SVGSVGElement;
      if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add("cooldown-svg");
        svg.setAttribute("width", "56");
        svg.setAttribute("height", "56");
        svg.style.position = "absolute";
        svg.style.left = "0";
        svg.style.top = "0";
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.pointerEvents = "none";
        svg.style.zIndex = "3";
        slotElem.appendChild(svg);
        slotElem.setAttribute("style", (slotElem.getAttribute("style") || "") + ";position:relative;");
      }
      svg.innerHTML = "";
      // Cerchio scuro di base
      let bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      bg.setAttribute("cx", "28");
      bg.setAttribute("cy", "28");
      bg.setAttribute("r", "26");
      bg.setAttribute("fill", "rgba(0,0,0,0.55)");
      svg.appendChild(bg);

      // Cerchio animato (cooldown)
      let arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
      arc.setAttribute("fill", "#222");
      arc.setAttribute("opacity", "0.85");
      svg.appendChild(arc);

      let start = performance.now();
      function animate() {
        let t = (performance.now() - start) / 1000;
        if (t > 1) t = 1;
        // Angolo da 0 a 2PI*(1-t)
        const angle = 2 * Math.PI * (1 - t);
        const x = 28 + 26 * Math.sin(angle);
        const y = 28 - 26 * Math.cos(angle);
        const largeArc = angle < Math.PI ? 0 : 1;
        const d = `
          M 28 2
          A 26 26 0 ${largeArc} 1 ${x} ${y}
          L 28 28 Z
        `;
        arc.setAttribute("d", d);
        arc.setAttribute("opacity", `${0.85 * (1 - t)}`);
        if (t < 1) requestAnimationFrame(animate);
        else svg.remove();
      }
      animate();
    }

    // Messaggio sopra spellbar
    function showSpellMsg(msg: string) {
      let el = document.getElementById("spellbar-msg");
      if (!el) {
        el = document.createElement("div");
        el.id = "spellbar-msg";
        el.style.position = "fixed";
        el.style.left = "50%";
        el.style.bottom = "90px";
        el.style.transform = "translateX(-50%)";
        el.style.background = "#222";
        el.style.color = "#fff";
        el.style.fontWeight = "bold";
        el.style.fontSize = "1.2rem";
        el.style.padding = "8px 24px";
        el.style.borderRadius = "10px";
        el.style.zIndex = "10001";
        el.style.boxShadow = "0 2px 12px #000";
        document.body.appendChild(el);
      }
      el.innerText = msg;
      el.style.opacity = "1";
      el.style.display = "block";
      setTimeout(() => {
        el.style.opacity = "0";
        setTimeout(() => { el.style.display = "none"; }, 400);
      }, 1000);
    }

    // Validazione nemico selezionato e distanza
    if (!this.selectedEnemy || !this.selectedEnemy.isAlive()) {
      showSpellMsg("No enemy selected");
      return;
    }
    if (this.player.mesh.position.distanceTo(this.selectedEnemy.mesh.position) >= 3.5) {
      showSpellMsg("Too far away");
      return;
    }

    // Mostra overlay cooldown SVG SOLO se la spell parte
    if (slots && slots.length > 0) showCooldownOverlay(slots[0]);
    this.spellLastCast = now;
    // Combat timer: resetta ogni attacco
    this.lastCombatTime = performance.now();

    // Calcolo critico: 10% chance
    let isCrit = Math.random() < 0.1;
    let dmg = this.player.attackDamage * (isCrit ? 2 : 1);

    // Mostra danno inflitto in bianco sopra il nemico
    const div = document.createElement("div");
    div.innerText = isCrit ? `CRIT -${dmg}` : `-${dmg}`;
    div.style.position = "fixed";
    div.style.color = "#fff";
    div.style.fontWeight = "bold";
    div.style.fontSize = isCrit ? "44px" : "28px";
    div.style.pointerEvents = "none";
    div.style.textShadow = "0 0 12px #000, 0 0 2px #fff";
    div.style.zIndex = "99999";
    div.style.padding = "2px 14px";
    div.style.borderRadius = "10px";
    div.style.background = "rgba(0,0,0,0.15)";
    if (isCrit) div.style.letterSpacing = "2px";
    document.body.appendChild(div);
    // Angolo random per effetto circolare
    const angle = Math.random() * Math.PI * 2;
    const enemy = this.selectedEnemy;
    let alive = true;
    const updateDmg = () => {
      if (!enemy.mesh.parent || !alive) { div.remove(); return; }
      const pos = enemy.mesh.position.clone();
      pos.y += 2.2;
      const vector = pos.project(this.camera);
      const t = (performance.now() - now) / 1000;
      const radius = 60;
      const theta = angle + t * Math.PI;
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth + Math.cos(theta) * radius;
      const y = (-vector.y * 0.5 + 0.5) * window.innerHeight + Math.sin(theta) * radius;
      div.style.left = `${x}px`;
      div.style.top = `${y}px`;
      div.style.opacity = `${1 - t}`;
      if (t < 1) requestAnimationFrame(updateDmg);
      else div.remove();
    };
    const now2 = performance.now();
    updateDmg();

    this.selectedEnemy.takeDamage(dmg);
    // Se muore, rimuovi dalla scena e deseleziona e rimuovi subito il danno
    if (!this.selectedEnemy.isAlive()) {
      this.scene.remove(this.selectedEnemy.mesh);
      this.selectedEnemy = null;
      alive = false;
      div.remove();
    }
  }

  async initWorld() {
    // Luce
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10,10,10);
    this.scene.add(light);

    // Terreno con texture prato
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load("https://threejs.org/examples/textures/terrain/grasslight-big.jpg");
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(160, 160);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshStandardMaterial({ map: grassTexture })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Alberi semplici (più numerosi)
    for (let i = 0; i < 200; i++) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.5, 3),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
      );
      trunk.position.set(
        Math.random() * 980 - 490,
        1.5,
        Math.random() * 980 - 490
      );
      this.scene.add(trunk);
      this.sceneObstacles.push(trunk);

      const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x228b22 })
      );
      leaves.position.set(trunk.position.x, trunk.position.y + 2, trunk.position.z);
      this.scene.add(leaves);
      if (i % 20 === 0) await new Promise(r => setTimeout(r, 0));
    }

    // Rocce semplici (più numerose)
    for (let i = 0; i < 120; i++) {
      const rock = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
      );
      rock.position.set(
        Math.random() * 980 - 490,
        1,
        Math.random() * 980 - 490
      );
      rock.scale.setScalar(0.6 + Math.random() * 1.2);
      this.scene.add(rock);
      this.sceneObstacles.push(rock);
      if (i % 20 === 0) await new Promise(r => setTimeout(r, 0));
    }

    // Posiziona il player lontano dal nemico e rivolto verso di lui
    this.player = new Player();
    this.player.mesh.position.set(5, 1, -15); // x=5, y=1, z=-15

    // Calcola direzione verso il nemico (5, 1, 5)
    const toEnemy = new THREE.Vector3(5, 1, 5).sub(this.player.mesh.position);
    const angle = Math.atan2(toEnemy.x, toEnemy.z);
    this.player.mesh.rotation.y = angle;

    this.cameraControl = new ThirdPersonCamera(this.camera, this.player);
    this.scene.add(this.player.mesh);

    // Carica prefab zombie
    // Usa GLTFLoader importato
    const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader");
    const gltfLoader = new GLTFLoader();
    const zombiePrefab = await new Promise<any>((resolve) => {
      gltfLoader.load(
        "/characters/zombie/scene.gltf",
        (gltf) => {
          // DEBUG: log struttura prefab
          // @ts-ignore
          window.zombiePrefabDebug = gltf;
          // gltf.scene.scale.set(0.01, 0.01, 0.01); // Spostato nella classe Enemy per evitare zombie gigante
          gltf.scene.position.y = -1;
          resolve(gltf);
        }
      );
    });

    // Spawna molti nemici sparsi per la mappa usando il prefab
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 980 - 490;
      const z = Math.random() * 980 - 490;
      const enemy = new Enemy(x, z, zombiePrefab);
      this.enemies.push(enemy);
      this.scene.add(enemy.mesh);
      const hb = new HealthBarAbove(enemy, this.camera);
      hb.update();
      this.hbAbove.push(hb);
      if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }

    this.ui = new UI();
    this.clock = new THREE.Clock();

    window.addEventListener("keydown", (e)=>{
      this.keys.add(e.key.toLowerCase());
      if (e.key === " ") {
        this.player.jump();
      }
      if (e.key.toLowerCase() === "v") {
        this.healthBarsVisible = !this.healthBarsVisible;
        this.hbAbove.forEach(h => {
          h.domElement.style.display = this.healthBarsVisible ? "block" : "none";
        });

        // Mostra messaggio stato healthbar per 3 secondi
        this.healthBarStatusDiv.textContent = this.healthBarsVisible ? "healthbar attivate" : "healthbar disattivate";
        this.healthBarStatusDiv.style.display = "block";
        this.healthBarStatusDiv.style.background = "#ff0060";
        this.healthBarStatusDiv.style.color = "#fff";
        this.healthBarStatusDiv.style.fontWeight = "bold";
        this.healthBarStatusDiv.style.fontSize = "2rem";
        this.healthBarStatusDiv.style.border = "4px solid #fff";
        this.healthBarStatusDiv.style.boxShadow = "0 0 24px #000";
        this.healthBarStatusDiv.style.zIndex = "99999";
        setTimeout(() => {
          this.healthBarStatusDiv.style.display = "none";
        }, 3000);
      }
    });
    window.addEventListener("keyup", (e)=>this.keys.delete(e.key.toLowerCase()));

    window.addEventListener("mousedown", (e) => {
      if (e.button === 2) this.rightMouseDown = true;
      if (e.button === 0) this.mouseLeftDown = true;
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 2) this.rightMouseDown = false;
      if (e.button === 0) this.mouseLeftDown = false;
    });

    window.addEventListener("playerAttack", ()=>this.handleAttack());

    // Disabilita context menu browser su tasto destro
    window.addEventListener("contextmenu", e => e.preventDefault());

    this.loaderDiv.style.display = "none";
    this.animate();

    // Gestione cursore custom: aggiorna anche se la camera si muove
    window.addEventListener("mousemove", (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mousePos.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mousePos.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    });

    // Imposta cursore di default all'avvio
    document.body.style.cursor = "url('/cursors/Pointer_gauntlet_on_32x32.cur'), auto";
  }

  handleAttack() {
    const ray = this.player.getAttackRay();
    const enemyMeshes = this.enemies.filter(e=>e.isAlive()).map(e=>e.mesh);
    const intersects = ray.intersectObjects(enemyMeshes);
    if(intersects.length>0){
      const hitEnemy = this.enemies.find(e=>e.mesh===intersects[0].object);
      if(hitEnemy) hitEnemy.takeDamage(this.player.attackDamage);
    }
  }

  reset() {
    this.scene.remove(this.player.mesh);
    this.enemies.forEach(e=>this.scene.remove(e.mesh));
    this.hbAbove.forEach(h=>h.destroy());

    this.player = new Player();
    this.scene.add(this.player.mesh);

    this.enemies = [];
    this.hbAbove = [];
    for(let i=0;i<5;i++){
      const enemy = new Enemy(5*i,5*i);
      this.enemies.push(enemy);
      this.scene.add(enemy.mesh);
      this.hbAbove.push(new HealthBarAbove(enemy,this.camera));
    }

    this.ui.updatePlayerHealth(this.player.hp, this.player.mana ?? 100, this.player.maxHp ?? 100, this.player.maxMana ?? 100);
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    if(!this.player.isAlive()){
      this.ui.showGameOver(()=>this.reset());
      // DEBUG: player morto, interrompo animate
      return;
    }

    // FPS
    if (this.fpsDiv) {
      this.frames++;
      const now = performance.now();
      if (now - this.lastFpsUpdate > 500) {
        this.fps = Math.round((this.frames * 1000) / (now - this.lastFpsUpdate));
        this.fpsDiv.innerText = `FPS: ${this.fps}`;
        this.lastFpsUpdate = now;
        this.frames = 0;
      }
    }

    // Aggiorna posizione e animazione dei testi danno
    const now = performance.now();

    // Logga ANIMATE FRAME e now ogni ciclo
    // console.log("ANIMATE FRAME", now);

    this.damageTexts = this.damageTexts.filter(({ div, start, angle }) => {
      const t = (now - start) / 1000;
      if (t > 1) {
        div.remove();
        return false;
      }
      // Movimento circolare attorno al player (più lento)
      const radius = 60;
      const theta = angle + t * Math.PI;
      // Proietta posizione player su schermo
      const pos = this.player.mesh.position.clone();
      pos.y += 2.2;
      const vector = pos.project(this.camera);
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth + Math.cos(theta) * radius;
      const y = (-vector.y * 0.5 + 0.5) * window.innerHeight + Math.sin(theta) * radius;
      div.style.left = `${x}px`;
      div.style.top = `${y}px`;
      div.style.opacity = `${1 - t}`;
      return true;
    });

    // --- Spostato fuori dal filter ---
    // Rigenerazione hp/mana (al secondo, non per tick)
    const maxHp = this.player.maxHp ?? 100;
    const maxMana = this.player.maxMana ?? 100;
    const isOutOfCombat = (now - this.lastCombatTime > 5000);

    // Logga isOutOfCombat ogni 2 secondi
    if (!this.lastLogTime) this.lastLogTime = now;
    if (now - this.lastLogTime > 2000) {
      this.lastLogTime = now;
    }

    // HP: solo fuori combattimento, recupero ogni 3 secondi
    if (isOutOfCombat && this.player.hp < maxHp) {
      if (!this.lastHpRegenTime) this.lastHpRegenTime = now;
      if (now - this.lastHpRegenTime > 3000) {
        const hpRegen = Math.ceil(maxHp * 0.03);
        this.player.hp = Math.min(this.player.hp + hpRegen, maxHp);
        this.lastHpRegenTime = now;
      }
    } else {
      this.lastHpRegenTime = now;
    }
    // Mana: 10% fuori combattimento, 2% in combattimento (al secondo)
    const manaRegenRate = isOutOfCombat ? 0.10 : 0.02;
    if (this.player.mana < maxMana) {
      const manaRegen = Math.ceil(maxMana * manaRegenRate * delta);
      this.player.mana = Math.min(this.player.mana + manaRegen, maxMana);
    }

    // Aggiorna barra vita nemico selezionato
    if (this.enemyBarDiv) {
      if (this.selectedEnemy && this.selectedEnemy.isAlive()) {
        this.enemyBarDiv.style.display = "block";
        const nameDiv = this.enemyBarDiv.querySelector("#enemy-bar-name") as HTMLDivElement;
        const hpDiv = this.enemyBarDiv.querySelector("#enemy-bar-hp") as HTMLDivElement;
        const hpText = this.enemyBarDiv.querySelector("#enemy-bar-hp-text") as HTMLDivElement;
        if (nameDiv) nameDiv.innerText = "Enemy";
        if (hpDiv && hpText) {
          const hp = Math.max(0, this.selectedEnemy.hp);
          const maxHp = this.selectedEnemy.maxHp || 100;
          hpDiv.style.width = `${(hp / maxHp) * 100}%`;
          hpText.innerText = `${hp} / ${maxHp}`;
        }
      } else {
        this.enemyBarDiv.style.display = "none";
      }
    }

    // Aggiorna cursore anche se la camera si muove
    {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(this.mousePos, this.camera);

      let foundEnemy: Enemy | null = null;
      for (const enemy of this.enemies) {
        if (!enemy.isAlive()) continue;
        const intersects = raycaster.intersectObject(enemy.mesh, true);
        if (intersects.length > 0) {
          foundEnemy = enemy;
          break;
        }
      }
      if (foundEnemy) {
        document.body.style.cursor = "url('/cursors/Pointer_sword_on_32x32.cur'), auto";
      } else {
        document.body.style.cursor = "url('/cursors/Pointer_gauntlet_on_32x32.cur'), auto";
      }

      // Cerchio di selezione
      if (this.selectedEnemy && this.selectedEnemy.isAlive()) {
        if (!this.selectionCircle) {
          const geometry = new THREE.RingGeometry(1.5, 2, 48);
          const material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
          this.selectionCircle = new THREE.Mesh(geometry, material);
          this.selectionCircle.rotation.x = -Math.PI / 2;
          this.selectionCircle.renderOrder = 999;
          this.selectionCircle.material.depthTest = false;
          this.scene.add(this.selectionCircle);
        }
        // Aggiorna posizione sotto il nemico selezionato
        // Calcola bounding box reale su tutti i discendenti mesh
        const box = new THREE.Box3().setFromObject(this.selectedEnemy.mesh, true);
        const center = new THREE.Vector3();
        box.getCenter(center);
        this.selectionCircle.position.set(
          center.x,
          box.min.y + 0.01,
          center.z
        );
        this.selectionCircle.rotation.set(-Math.PI / 2, 0, 0);
        this.selectionCircle.visible = true;
        // Debug: colore/materiale ben visibile
        if (this.selectionCircle.material instanceof THREE.MeshBasicMaterial) {
          this.selectionCircle.material.color.set(0xff0000);
          this.selectionCircle.material.opacity = 0.5;
        }
      } else if (this.selectionCircle) {
        this.selectionCircle.visible = false;
      }
    }

    // Movimento WoW: w/s avanti/indietro, a/d ruotano la camera
    let cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);
    cameraDir.y = 0;
    cameraDir.normalize();

    // Ruota la camera con A/D
    const rotateSpeed = 0.03;
    if (this.keys.has("a")) {
      this.cameraControl.rotation.y += rotateSpeed;
    }
    if (this.keys.has("d")) {
      this.cameraControl.rotation.y -= rotateSpeed;
    }

    // Movimento avanti/indietro
    // Collisione player con ostacoli
    const tryMovePlayer = (dir: THREE.Vector3) => {
      const nextPos = this.player.mesh.position.clone().add(dir);

      // Limiti terreno
      if (
        nextPos.x < -499.5 || nextPos.x > 499.5 ||
        nextPos.z < -499.5 || nextPos.z > 499.5
      ) {
        return;
      }

      // Bounding box player reale
      const playerBox = this.player.getBoundingBox(nextPos);

      // Collisione con ostacoli
      let collision = false;
      for (const obs of this.sceneObstacles) {
        const obsBox = new THREE.Box3().setFromObject(obs);
        if (playerBox.intersectsBox(obsBox)) {
          collision = true;
          break;
        }
      }
      if (!collision) {
        this.player.mesh.position.copy(nextPos);
      }
    };

    // Movimento diagonale (w+q, w+e, s+q, s+e)
    let moveDir = new THREE.Vector3();
    let moving = false;

    if (this.keys.has("w")) {
      moveDir.add(cameraDir);
      moving = true;
    }
    if (this.keys.has("s")) {
      moveDir.add(cameraDir.clone().negate());
      moving = true;
    }
    // Calcola vettore laterale rispetto alla camera (sinistra)
    const leftDir = new THREE.Vector3(cameraDir.z, 0, -cameraDir.x).normalize();
    if (this.keys.has("q")) {
      moveDir.add(leftDir);
      moving = true;
    }
    if (this.keys.has("e")) {
      moveDir.add(leftDir.clone().negate());
      moving = true;
    }

    // Mouse sinistro+destro: cammina dritto seguendo la camera
    if (this.mouseLeftDown && this.rightMouseDown) {
      let cameraDirCopy = cameraDir.clone().normalize().multiplyScalar(this.player.speed);
      tryMovePlayer(cameraDirCopy);
      this.player.mesh.rotation.y = Math.atan2(cameraDirCopy.x, cameraDirCopy.z);
    } else if (moving && moveDir.lengthSq() > 0) {
      moveDir.normalize().multiplyScalar(this.player.speed);
      tryMovePlayer(moveDir);
      // Ruota il player verso la direzione di movimento
      this.player.mesh.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    } else {
      this.player.move(this.keys);
    }
    this.player.update(delta);

    this.enemies.forEach(e=>e.update(this.player));
    this.hbAbove.forEach(h=>h.update());

    this.ui.updatePlayerHealth(this.player.hp, this.player.mana, this.player.maxHp, this.player.maxMana);

    this.cameraControl.update();
    this.camera.lookAt(this.player.mesh.position);

    this.renderer.render(this.scene, this.camera);

    // Aggiorna healthbar DOPO il render per proiezione corretta
    this.hbAbove.forEach(h=>h.update());
  }
}
