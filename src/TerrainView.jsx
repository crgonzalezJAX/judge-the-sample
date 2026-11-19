import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const blueLow = new THREE.Color("#deebf7");
const blueHigh = new THREE.Color("#08306b");
const orange = new THREE.Color("#f28e2b");
const target = new THREE.Vector3(49.5, 0, 49.5);
const flatCamera = new THREE.Vector3(49.5, 165, 49.501);
const tiltedCamera = new THREE.Vector3(122, 125, 155);

export default function TerrainView({ rows, sampledIds, condition, active, onExitComplete, onUnavailable }) {
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
    const camera = new THREE.PerspectiveCamera(47, 1, 0.1, 500);
    camera.position.copy(flatCamera);
    camera.lookAt(target);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minDistance = 65;
    controls.maxDistance = 310;
    controls.maxPolarAngle = Math.PI * 0.48;
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
    rows.forEach((row, index) => {
      const height = Math.min(60, Math.max(0, Number(row.wait_time)));
      const dayIndex = weekdays.indexOf(row.weekday);
      const position = condition === "Baseline" ? row.slot : row.sorted_position;
      heights[index] = height;
      positions[index * 2] = row.week - 1;
      positions[index * 2 + 1] = dayIndex * 20 + position - 1;
      const blue = blueLow.clone().lerp(blueHigh, height / 60);
      columns.setColorAt(index, sampledIds.has(row.visit_id) ? orange : blue);
    });
    columns.instanceColor.needsUpdate = true;
    const setColumns = (progress) => {
      for (let index = 0; index < rows.length; index += 1) {
        const height = Math.max(0.04, heights[index] * progress);
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
    const cameraStart = flatCamera.clone();
    const cameraEnd = tiltedCamera.clone();
    let cameraElapsed = 0;
    const animate = (time) => {
      try {
      const delta = Math.min(50, lastTime === undefined ? 16 : time - lastTime);
      lastTime = time;
      const next = reducedMotion.matches ? Number(wanted) : Math.max(0, Math.min(1, progress + (wanted ? 1 : -1) * delta / 650));
      if (next !== progress) {
        progress = next;
        setColumns(progress);
      }
      if (cameraElapsed < 650) {
        cameraElapsed = reducedMotion.matches ? 650 : Math.min(650, cameraElapsed + delta);
        const fraction = cameraElapsed / 650;
        camera.position.lerpVectors(cameraStart, cameraEnd, fraction * fraction * (3 - 2 * fraction));
        camera.lookAt(target);
      }
      controls.enabled = wanted && progress === 1 && cameraElapsed === 650;
      if (controls.enabled) controls.update();
      renderer.render(scene, camera);
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
          cameraEnd.copy(value ? tiltedCamera : flatCamera);
          cameraElapsed = 0;
        }
        wanted = value;
        if (!value) { controls.enabled = false; setHover(null); }
      },
      setSample(sample) {
        sampledRef.current = sample;
        rows.forEach((row, index) => {
          const blue = blueLow.clone().lerp(blueHigh, heights[index] / 60);
          columns.setColorAt(index, sample.has(row.visit_id) ? orange : blue);
        });
        columns.instanceColor.needsUpdate = true;
      },
    };

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
    };
  }, [rows, condition]);

  useEffect(() => { sceneRef.current?.setActive(active); }, [active]);
  useEffect(() => { sceneRef.current?.setSample(sampledIds); }, [sampledIds]);

  return <div className="terrain-scene" ref={hostRef} role="img" aria-label="3D terrain of all appointments: weeks across, weekdays and positions along the ground, column height and blue colour show wait time; orange columns are sampled">
    {hover && <div className="terrain-tooltip" role="tooltip" style={{ left: hover.x, top: hover.y }}>{hover.label}</div>}
  </div>;
}
