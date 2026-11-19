import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const blueLow = new THREE.Color("#deebf7");
const blueHigh = new THREE.Color("#08306b");
const orange = new THREE.Color("#f28e2b");
const floorColour = new THREE.Color("#f4f8fb");
const flatCameraAt = (week) => new THREE.Vector3(week - 1, 195, 49.501);
const tiltedCameraAt = (week) => new THREE.Vector3(week - 1 + 72, 135, 165);

export default function TerrainView({ rows, sampledIds, condition, focusWeek, active, onExitComplete, onUnavailable }) {
  const hostRef = useRef(null);
  const sceneRef = useRef(null);
  const sampledRef = useRef(sampledIds);
  const callbacksRef = useRef({ onExitComplete, onUnavailable });
  const [hover, setHover] = useState(null);

  useEffect(() => { callbacksRef.current = { onExitComplete, onUnavailable }; }, [onExitComplete, onUnavailable]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer;
    try {
      const canvas = document.createElement("canvas");
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      host.appendChild(canvas);
    } catch {
      renderer?.dispose();
      callbacksRef.current.onUnavailable();
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xf4f8fb);
    const scene = new THREE.Scene();
    const target = new THREE.Vector3(focusWeek - 1, 30, 49.5);
    const camera = new THREE.PerspectiveCamera(47, 1, 0.1, 500);
    camera.position.copy(flatCameraAt(focusWeek));
    camera.lookAt(target);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 135;
    controls.maxDistance = 310;
    controls.minPolarAngle = 0.22;
    controls.maxPolarAngle = 1.35;
    controls.enabled = false;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9bb0c1, 2.1));
    const sunlight = new THREE.DirectionalLight(0xffffff, 1.1);
    sunlight.position.set(65, 140, 35);
    scene.add(sunlight);
    const geometry = new THREE.BoxGeometry(0.83, 1, 0.83);
    const material = new THREE.MeshLambertMaterial();
    const columns = new THREE.InstancedMesh(geometry, material, rows.length);
    columns.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const dummy = new THREE.Object3D();
    const heights = new Float32Array(rows.length);
    const positions = new Float32Array(rows.length * 2);
    const focusMix = new Float32Array(100);
    focusMix[focusWeek - 1] = 1;
    let selectedWeek = focusWeek;
    let currentSample = sampledIds;
    rows.forEach((row, index) => {
      const height = Math.min(60, Math.max(0, Number(row.wait_time)));
      const dayIndex = weekdays.indexOf(row.weekday);
      const position = condition === "Baseline" ? row.slot : row.sorted_position;
      heights[index] = height;
      positions[index * 2] = row.week - 1;
      positions[index * 2 + 1] = dayIndex * 20 + position - 1;
    });
    const color = new THREE.Color();
    const updateColours = () => {
      rows.forEach((row, index) => {
        const weekMix = focusMix[row.week - 1];
        color.copy(currentSample.has(row.visit_id) ? orange : blueLow).lerp(currentSample.has(row.visit_id) ? orange : blueHigh, currentSample.has(row.visit_id) ? 0 : heights[index] / 60);
        color.lerp(floorColour, (1 - weekMix) * 0.82);
        columns.setColorAt(index, color);
      });
      columns.instanceColor.needsUpdate = true;
    };
    updateColours();
    const setColumns = (progress) => {
      for (let index = 0; index < rows.length; index += 1) {
        const week = rows[index].week - 1;
        const height = Math.max(0.04, heights[index] * (0.035 + 0.965 * focusMix[week]) * progress);
        dummy.position.set(positions[index * 2], height / 2, positions[index * 2 + 1]);
        dummy.scale.set(1, height, 1);
        dummy.updateMatrix();
        columns.setMatrixAt(index, dummy.matrix);
      }
      columns.instanceMatrix.needsUpdate = true;
      columns.computeBoundingSphere();
    };
    setColumns(0);
    scene.add(columns);
    const floorGrid = new THREE.GridHelper(100, 10, 0xb8c9d7, 0xdce6ee);
    floorGrid.position.set(49.5, -0.03, 49.5);
    scene.add(floorGrid);

    const worldLabels = [];
    const addLabel = (text, point, priority) => {
      const element = document.createElement("span");
      element.className = "terrain-world-label";
      element.textContent = text;
      host.appendChild(element);
      worldLabels.push({ element, point, priority });
      return element;
    };
    for (const week of [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) addLabel(`${week}`, () => new THREE.Vector3(week - 1, 0, -4), 4);
    const activeWeekLabel = addLabel(`Week ${selectedWeek}`, () => new THREE.Vector3(selectedWeek - 1, 0, -9), 0);
    weekdays.forEach((day, index) => addLabel(day, () => new THREE.Vector3(selectedWeek - 4, 0, index * 20 + 9.5), 1));
    for (const slot of [1, 5, 10, 15, 20]) addLabel(`${slot}`, () => new THREE.Vector3(selectedWeek + 2, 0, slot - 1), 3);
    for (const height of [0, 20, 40, 60]) addLabel(height === 60 ? "60+" : `${height}`, () => new THREE.Vector3(selectedWeek - 5, height, -5), 2);
    const updateLabels = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      const occupied = [];
      for (const label of [...worldLabels].sort((a, b) => a.priority - b.priority)) {
        const point = label.point().project(camera);
        const x = (point.x + 1) * width / 2;
        const y = (-point.y + 1) * height / 2;
        label.element.style.display = "block";
        const halfWidth = label.element.offsetWidth / 2 + 4;
        const halfHeight = label.element.offsetHeight / 2 + 3;
        const box = { left: x - halfWidth, right: x + halfWidth, top: y - halfHeight, bottom: y + halfHeight };
        const inView = point.z > -1 && point.z < 1 && box.left >= 4 && box.right <= width - 4 && box.top >= 4 && box.bottom <= height - 4;
        const collides = occupied.some((other) => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top);
        label.element.style.display = inView && !collides ? "block" : "none";
        if (inView && !collides) {
          label.element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
          occupied.push(box);
        }
      }
    };

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerMove = (event) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(columns, false)[0];
      if (!hit || hit.instanceId === undefined) { setHover(null); return; }
      const row = rows[hit.instanceId];
      const label = `Original visit ID ${row.visit_id}; week ${row.week}, ${row.weekday}, original slot ${row.slot}; ${row.visit_type}; wait ${row.wait_time} minutes${condition === "Baseline" ? "" : `; new position within day ${row.sorted_position}`}${sampledRef.current.has(row.visit_id) ? "; sampled" : ""}`;
      setHover({ label, x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    };
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    const onPointerLeave = () => setHover(null);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    let frame;
    let lastTime;
    let progress = 0;
    let wanted = true;
    let exitNotified = false;
    const cameraStart = flatCameraAt(focusWeek);
    const cameraEnd = tiltedCameraAt(focusWeek);
    let cameraElapsed = 0;
    const animate = (time) => {
      try {
      const delta = Math.min(50, lastTime === undefined ? 16 : time - lastTime);
      lastTime = time;
      const next = reducedMotion.matches ? Number(wanted) : Math.max(0, Math.min(1, progress + (wanted ? 1 : -1) * delta / 650));
      const progressChanged = next !== progress;
      progress = next;
      let focusChanged = false;
      for (let week = 0; week < 100; week += 1) {
        const goal = week === selectedWeek - 1 ? 1 : 0;
        const newMix = reducedMotion.matches ? goal : Math.max(0, Math.min(1, focusMix[week] + (goal ? 1 : -1) * delta / 500));
        if (newMix !== focusMix[week]) { focusMix[week] = newMix; focusChanged = true; }
      }
      if (progressChanged || focusChanged) { setColumns(progress); if (focusChanged) updateColours(); }
      if (cameraElapsed < 650) {
        cameraElapsed = reducedMotion.matches ? 650 : Math.min(650, cameraElapsed + delta);
        const fraction = cameraElapsed / 650;
        camera.position.lerpVectors(cameraStart, cameraEnd, fraction * fraction * (3 - 2 * fraction));
        camera.lookAt(target);
      }
      const focusDx = (selectedWeek - 1 - target.x) * (reducedMotion.matches ? 1 : 1 - Math.exp(-delta / 260));
      if (Math.abs(focusDx) > 0.0001) {
        target.x += focusDx;
        controls.target.x += focusDx;
        camera.position.x += focusDx;
        cameraStart.x += focusDx;
        cameraEnd.x += focusDx;
      }
      controls.enabled = wanted && progress === 1 && cameraElapsed === 650;
      if (controls.enabled) controls.update();
      renderer.render(scene, camera);
      updateLabels();
      if (!wanted && progress === 0 && !exitNotified) {
        exitNotified = true;
        callbacksRef.current.onExitComplete();
      }
      frame = requestAnimationFrame(animate);
      } catch {
        callbacksRef.current.onUnavailable();
      }
    };
    frame = requestAnimationFrame(animate);
    sceneRef.current = {
      setActive(value) {
        if (wanted !== value) {
          cameraStart.copy(camera.position);
          cameraEnd.copy(value ? tiltedCameraAt(selectedWeek) : flatCameraAt(selectedWeek));
          cameraElapsed = 0;
        }
        wanted = value;
        if (!value) { controls.enabled = false; setHover(null); }
      },
      setSample(sample) {
        sampledRef.current = sample;
        currentSample = sample;
        updateColours();
      },
      setFocus(week) { selectedWeek = week; activeWeekLabel.textContent = `Week ${week}`; },
    };

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      geometry.dispose();
      material.dispose();
      floorGrid.geometry.dispose();
      floorGrid.material.dispose();
      worldLabels.forEach(({ element }) => element.remove());
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
    };
  }, [rows, condition]);

  useEffect(() => { sceneRef.current?.setActive(active); }, [active]);
  useEffect(() => { sceneRef.current?.setSample(sampledIds); }, [sampledIds]);
  useEffect(() => { sceneRef.current?.setFocus(focusWeek); }, [focusWeek]);

  return <>
    <div className="terrain-scene" ref={hostRef} role="img" aria-label={`3D terrain of all appointments, focused on week ${focusWeek}. Weeks run across the floor, Mon through Fri and slots 1 through 20 run along its depth; column height is wait time in minutes up to 60 or more. Orange columns are sampled.`}>
      {hover && <div className="terrain-tooltip" role="tooltip" style={{ left: hover.x, top: hover.y }}>{hover.label}</div>}
    </div>
    <div className="terrain-legend" aria-label="3D terrain axes and height scale"><span>Weeks 1–100 · Focus: {focusWeek}</span><span>Days: Mon–Fri</span><span>Slots: 1–20</span><span>Height: 0 · 20 · 40 · 60+ min</span></div>
  </>;
}
