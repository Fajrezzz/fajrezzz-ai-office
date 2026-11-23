"use client";

import React, { Component, Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

export type HumanAvatarVariant =
  | "rpm_male"
  | "rb_male_a"
  | "rb_male_b"
  | "rb_female"
  | "michelle";

export type HumanAvatarPose =
  | "idle"
  | "walking"
  | "running"
  | "seated"
  | "typing"
  | "swimming";

export interface RealisticHumanAvatarProps {
  variant: HumanAvatarVariant;
  pose: HumanAvatarPose;
  topColor?: string;
  pantsColor?: string;
  keepOriginalOutfit?: boolean;
  showHeadwear?: boolean;
  targetHeight?: number;
  phaseOffset?: number;
  animSpeed?: number;
  isSimulationRunning?: boolean;
}

const MODEL_PATHS: Record<HumanAvatarVariant | "xbot", string> = {
  rpm_male: "/models/rpm_male.glb",
  rb_male_a: "/models/rb_male_a.glb",
  rb_male_b: "/models/rb_male_b.glb",
  rb_female: "/models/rb_female.glb",
  michelle: "/models/Michelle.glb",
  xbot: "/models/Xbot.glb",
};

const RB_VARIANTS = new Set<HumanAvatarVariant>([
  "rb_male_a",
  "rb_male_b",
  "rb_female",
]);

const CHILD_BONE_MAP: Record<string, string> = {
  Hips: "Spine",
  Spine: "Spine1",
  Spine1: "Spine2",
  Spine2: "Neck",
  Neck: "Head",
  LeftShoulder: "LeftArm",
  LeftArm: "LeftForeArm",
  LeftForeArm: "LeftHand",
  LeftHand: "LeftHandMiddle1",
  RightShoulder: "RightArm",
  RightArm: "RightForeArm",
  RightForeArm: "RightHand",
  RightHand: "RightHandMiddle1",
  LeftUpLeg: "LeftLeg",
  LeftLeg: "LeftFoot",
  LeftFoot: "LeftToeBase",
  RightUpLeg: "RightLeg",
  RightLeg: "RightFoot",
  RightFoot: "RightToeBase",
};

function canonicalBoneName(name: string): string {
  return name.replace(/^mixamorig:?/, "");
}

interface PreparedTemplate {
  key: HumanAvatarVariant | "xbot";
  scene: THREE.Object3D;
  holder: THREE.Group;
  bones: Record<string, THREE.Bone>;
  bindWorld: Record<string, THREE.Matrix4>;
  restHipsWorld: THREE.Vector3;
  parentMatrix: THREE.Matrix4;
  height: number;
  minY: number;
  refWorld?: Record<string, THREE.Quaternion>;
}

const templateCache = new Map<string, PreparedTemplate>();
const retargetedClipCache = new Map<
  string,
  Record<"idle" | "walk" | "run", THREE.AnimationClip>
>();

// Scratch math objects (reused to keep GC pressure zero in useFrame)
const _qA = new THREE.Quaternion();
const _qB = new THREE.Quaternion();
const _qC = new THREE.Quaternion();
const _qRoot = new THREE.Quaternion();
const _qRootInv = new THREE.Quaternion();
const _qParChar = new THREE.Quaternion();
const _qParCharInv = new THREE.Quaternion();
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _axisX = new THREE.Vector3(1, 0, 0);
const _axisY = new THREE.Vector3(0, 1, 0);
const _axisZ = new THREE.Vector3(0, 0, 1);

function prepareTemplate(
  key: HumanAvatarVariant | "xbot",
  rawScene: THREE.Object3D
): PreparedTemplate {
  const existing = templateCache.get(key);
  if (existing) return existing;

  // Clone once for clean reference measurement without mutating useGLTF cache
  const scene = cloneSkinned(rawScene);
  const holder = new THREE.Group();
  holder.add(scene);
  holder.updateMatrixWorld(true);

  const bones: Record<string, THREE.Bone> = {};
  scene.traverse((obj) => {
    if ((obj as THREE.Bone).isBone) {
      const bone = obj as THREE.Bone;
      const cname = canonicalBoneName(bone.name);
      if (!bones[cname]) {
        bones[cname] = bone;
        bone.userData.bindQ = bone.quaternion.clone();
      }
    }
  });

  const hips = bones.Hips;
  const restHipsWorld = hips
    ? hips.getWorldPosition(new THREE.Vector3())
    : new THREE.Vector3(0, 0.95, 0);
  const parentMatrix = hips?.parent
    ? hips.parent.matrixWorld.clone()
    : new THREE.Matrix4();

  const bindWorld: Record<string, THREE.Matrix4> = {};
  for (const [name, bone] of Object.entries(bones)) {
    bindWorld[name] = bone.matrixWorld.clone();
  }

  // Compute accurate standing height from Box3 + bone fallback
  const box = new THREE.Box3().setFromObject(holder);
  let height = box.max.y - box.min.y;
  let minY = box.min.y;
  if (!Number.isFinite(height) || height < 0.5 || height > 3.2) {
    const headPos = bones.Head
      ? bones.Head.getWorldPosition(new THREE.Vector3())
      : new THREE.Vector3(0, 1.62, 0);
    height = Math.max(1.55, headPos.y + 0.16);
    minY = 0;
  }

  const tpl: PreparedTemplate = {
    key,
    scene,
    holder,
    bones,
    bindWorld,
    restHipsWorld,
    parentMatrix,
    height,
    minY,
  };
  templateCache.set(key, tpl);
  return tpl;
}

function getBoneTraversalOrder(tpl: PreparedTemplate): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  tpl.scene.traverse((obj) => {
    if ((obj as THREE.Bone).isBone) {
      const cname = canonicalBoneName(obj.name);
      if (!seen.has(cname) && tpl.bones[cname]) {
        seen.add(cname);
        order.push(cname);
      }
    }
  });
  return order;
}

function computeReferencePose(
  tpl: PreparedTemplate,
  ref: PreparedTemplate
): Record<string, THREE.Quaternion> {
  if (tpl.refWorld) return tpl.refWorld;

  const saved = new Map<THREE.Bone, THREE.Quaternion>();
  tpl.scene.traverse((obj) => {
    if ((obj as THREE.Bone).isBone) {
      saved.set(obj as THREE.Bone, obj.quaternion.clone());
    }
  });

  tpl.holder.updateMatrixWorld(true);
  const order = getBoneTraversalOrder(tpl);

  if (tpl !== ref) {
    for (const c of order) {
      const childName = CHILD_BONE_MAP[c];
      if (!childName || c === "Hips") continue;
      const b = tpl.bones[c];
      const bc = tpl.bones[childName];
      const rb = ref.bindWorld[c];
      const rbc = ref.bindWorld[childName];
      if (!b || !bc || !rb || !rbc || !b.parent) continue;

      const dRef = new THREE.Vector3()
        .setFromMatrixPosition(rbc)
        .sub(new THREE.Vector3().setFromMatrixPosition(rb))
        .normalize();
      const pb = b.getWorldPosition(new THREE.Vector3());
      const pc = bc.getWorldPosition(new THREE.Vector3());
      const dCur = pc.sub(pb).normalize();
      if (dRef.lengthSq() < 0.0001 || dCur.lengthSq() < 0.0001) continue;

      const rq = new THREE.Quaternion().setFromUnitVectors(dCur, dRef);
      b.parent.getWorldQuaternion(_qA);
      _qB.copy(_qA).invert().multiply(rq).multiply(_qA);
      b.quaternion.premultiply(_qB);
      b.updateMatrixWorld(true);
    }
  }

  const world: Record<string, THREE.Quaternion> = {};
  for (const c of order) {
    world[c] = tpl.bones[c].getWorldQuaternion(new THREE.Quaternion());
  }

  for (const [bone, q] of saved) {
    bone.quaternion.copy(q);
  }
  tpl.holder.updateMatrixWorld(true);
  tpl.refWorld = world;
  return world;
}

function retargetClipToTemplate(
  clip: THREE.AnimationClip,
  srcTpl: PreparedTemplate,
  dstTpl: PreparedTemplate,
  alias: string
): THREE.AnimationClip {
  const sRef = computeReferencePose(srcTpl, srcTpl);
  const tRef = computeReferencePose(dstTpl, srcTpl);

  const order = getBoneTraversalOrder(dstTpl).filter((c) => Boolean(srcTpl.bones[c]));
  const fps = 24;
  const sampleCount = Math.max(2, Math.ceil(clip.duration * fps) + 1);
  const times = new Float32Array(sampleCount);

  const qValues: Record<string, Float32Array> = {};
  for (const c of order) {
    qValues[c] = new Float32Array(sampleCount * 4);
  }
  const hipValues = new Float32Array(sampleCount * 3);

  const tParentStatic: Record<string, THREE.Quaternion> = {};
  for (const c of order) {
    const par = dstTpl.bones[c].parent;
    const pc = par && (par as THREE.Bone).isBone ? canonicalBoneName(par.name) : null;
    if (par && (!pc || !order.includes(pc))) {
      tParentStatic[c] = par.getWorldQuaternion(new THREE.Quaternion());
    }
  }

  const mixer = new THREE.AnimationMixer(srcTpl.scene);
  const action = mixer.clipAction(clip);
  action.play();

  const ratio =
    srcTpl.restHipsWorld.y > 0.05
      ? dstTpl.restHipsWorld.y / srcTpl.restHipsWorld.y
      : 1;
  const invTargetParent = dstTpl.parentMatrix.clone().invert();

  const sw: Record<string, THREE.Quaternion> = {};
  const tw: Record<string, THREE.Quaternion> = {};
  const tmpInv = new THREE.Quaternion();
  const outQ = new THREE.Quaternion();

  for (let i = 0; i < sampleCount; i += 1) {
    const t = Math.min(clip.duration, i / fps);
    times[i] = t;
    mixer.setTime(t);
    srcTpl.holder.updateMatrixWorld(true);

    for (const c of order) {
      sw[c] = sw[c] || new THREE.Quaternion();
      tw[c] = tw[c] || new THREE.Quaternion();
      srcTpl.bones[c].getWorldQuaternion(sw[c]);

      tmpInv.copy(sRef[c]).invert();
      tw[c].copy(sw[c]).multiply(tmpInv).multiply(tRef[c]);

      const par = dstTpl.bones[c].parent;
      const pq =
        tParentStatic[c] ||
        (par ? tw[canonicalBoneName(par.name)] : undefined) ||
        new THREE.Quaternion();
      outQ.copy(pq).invert().multiply(tw[c]);
      outQ.toArray(qValues[c], i * 4);
    }

    if (srcTpl.bones.Hips && dstTpl.bones.Hips) {
      srcTpl.bones.Hips.getWorldPosition(_vA)
        .sub(srcTpl.restHipsWorld)
        .multiplyScalar(ratio);
      _vA.z *= 0.25;
      _vA.x *= 0.5;
      _vA.add(dstTpl.restHipsWorld).applyMatrix4(invTargetParent);
      _vA.toArray(hipValues, i * 3);
    }
  }

  mixer.stopAllAction();
  mixer.uncacheRoot(srcTpl.scene);

  // Restore source skeleton cleanly
  srcTpl.scene.traverse((obj) => {
    if ((obj as THREE.Bone).isBone && obj.userData.bindQ) {
      obj.quaternion.copy(obj.userData.bindQ);
    }
  });
  srcTpl.holder.updateMatrixWorld(true);

  const tracks: THREE.KeyframeTrack[] = order.map(
    (c) =>
      new THREE.QuaternionKeyframeTrack(
        `${dstTpl.bones[c].name}.quaternion`,
        times,
        qValues[c]
      )
  );
  if (dstTpl.bones.Hips) {
    tracks.push(
      new THREE.VectorKeyframeTrack(
        `${dstTpl.bones.Hips.name}.position`,
        times,
        hipValues
      )
    );
  }
  return new THREE.AnimationClip(alias, clip.duration, tracks);
}

function getRetargetedClips(
  variant: HumanAvatarVariant,
  dstTpl: PreparedTemplate,
  xbotScene: THREE.Object3D,
  xbotAnims: THREE.AnimationClip[]
): Record<"idle" | "walk" | "run", THREE.AnimationClip> {
  const cached = retargetedClipCache.get(variant);
  if (cached) return cached;

  const srcTpl = prepareTemplate("xbot", xbotScene);
  const findClip = (name: string) =>
    xbotAnims.find((a) => a.name.toLowerCase() === name.toLowerCase()) ||
    xbotAnims[0];

  const clips = {
    idle: retargetClipToTemplate(findClip("idle"), srcTpl, dstTpl, `${variant}_idle`),
    walk: retargetClipToTemplate(findClip("walk"), srcTpl, dstTpl, `${variant}_walk`),
    run: retargetClipToTemplate(findClip("run"), srcTpl, dstTpl, `${variant}_run`),
  };
  retargetedClipCache.set(variant, clips);
  return clips;
}

/**
 * Applies Rocketbox hair-card alpha cutout (from right half of atlas)
 * plus crisp per-character shirt/jacket & pants recoloring without affecting skin or face.
 */
function patchRocketboxMaterial(
  mat: THREE.MeshStandardMaterial,
  topColor: string,
  pantsColor: string,
  keepOriginal: boolean
) {
  const uniforms = {
    uTop: { value: new THREE.Color(topColor) },
    uBottom: { value: new THREE.Color(pantsColor) },
    uKeepOriginal: { value: keepOriginal ? 1.0 : 0.0 },
  };
  mat.userData.rbUniforms = uniforms;
  mat.roughness = 0.78;
  mat.metalness = 0.04;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float part;\nvarying float vRbPart;"
      )
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRbPart = part;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vRbPart;\nuniform vec3 uTop;\nuniform vec3 uBottom;\nuniform float uKeepOriginal;"
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          vec3 c = diffuseColor.rgb;
          float pt = floor(vRbPart + 0.5);
          if (pt > 3.5) {
            #ifdef USE_MAP
            if (texture2D(map, vMapUv + vec2(0.5, 0.0)).r < 0.45) discard;
            #endif
          } else if (uKeepOriginal < 0.5 && pt > 0.5 && pt < 2.5) {
            vec3 s = pow(max(c, vec3(1e-4)), vec3(1.0 / 2.2));
            float mx = max(s.r, max(s.g, s.b));
            float dd = mx - min(s.r, min(s.g, s.b));
            float hh = (s.g - s.b) / (dd + 1e-4);
            bool isSkin = (s.r >= s.g && s.g >= s.b && dd / (mx + 1e-4) > 0.22 && dd / (mx + 1e-4) < 0.72 && mx > 0.25 && hh > 0.14 && hh < 0.76);
            if (!isSkin) {
              float lum = dot(c, vec3(0.299, 0.587, 0.114));
              float shade = 0.34 + lum * 1.55;
              if (pt < 1.5) {
                diffuseColor.rgb = mix(c, uTop * shade, 0.84);
              } else {
                diffuseColor.rgb = mix(c, uBottom * shade, 0.78);
              }
            }
          }
        }`
      );
  };
  mat.customProgramCacheKey = () => "fajrezzz-rb-human-v1";
  mat.needsUpdate = true;
}

/**
 * Applies a rotation in CHARACTER SPACE (X = left, Y = up, Z = forward)
 * cleanly to any bone regardless of Rocketbox vs Mixamo local bone roll.
 */
function rotateBoneInCharSpace(
  bone: THREE.Bone | undefined,
  rootObj: THREE.Object3D,
  axis: THREE.Vector3,
  angleRad: number
) {
  if (!bone || !bone.parent || Math.abs(angleRad) < 0.0005) return;
  rootObj.getWorldQuaternion(_qRoot);
  _qRootInv.copy(_qRoot).invert();
  bone.parent.getWorldQuaternion(_qA);
  _qParChar.copy(_qRootInv).multiply(_qA);
  _qParCharInv.copy(_qParChar).invert();

  _qB.setFromAxisAngle(axis, angleRad);
  _qC.copy(_qParCharInv).multiply(_qB).multiply(_qParChar);
  bone.quaternion.premultiply(_qC);
  bone.updateMatrixWorld(true);
}

function LoadedHumanAvatar({
  variant,
  pose,
  topColor = "#1e293b",
  pantsColor = "#111827",
  keepOriginalOutfit = false,
  showHeadwear = false,
  targetHeight = 1.72,
  phaseOffset = 0,
  animSpeed = 1,
  isSimulationRunning = true,
}: RealisticHumanAvatarProps) {
  const gltf = useGLTF(MODEL_PATHS[variant]);
  const xbotGltf = useGLTF(MODEL_PATHS.xbot);

  const rootGroupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<"idle" | "walk" | "run", THREE.AnimationAction> | null>(
    null
  );
  const activeClipKeyRef = useRef<"idle" | "walk" | "run">("idle");
  const seatBlendRef = useRef(pose === "seated" || pose === "typing" ? 1 : 0);

  const { clonedScene, bones, scaleFactor, groundOffsetY, clips } = useMemo(() => {
    const tpl = prepareTemplate(variant, gltf.scene);
    const retargeted = getRetargetedClips(
      variant,
      tpl,
      xbotGltf.scene,
      xbotGltf.animations
    );

    const instance = cloneSkinned(gltf.scene);
    const boneMap: Record<string, THREE.Bone> = {};
    const isRb = RB_VARIANTS.has(variant);

    instance.traverse((obj) => {
      if ((obj as THREE.Bone).isBone) {
        const b = obj as THREE.Bone;
        const cname = canonicalBoneName(b.name);
        if (!boneMap[cname]) boneMap[cname] = b;
      }

      if ((obj as THREE.SkinnedMesh).isSkinnedMesh || (obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.frustumCulled = false;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Hide random headwear on Ready Player Me indoor staff unless explicitly enabled
        if (variant === "rpm_male" && /Headwear/i.test(mesh.name)) {
          mesh.visible = showHeadwear;
        }

        // Rocketbox models store garment part ids in `_part` / `_PART`
        const rawPartAttr =
          mesh.geometry.attributes._part || mesh.geometry.attributes._PART;
        if (isRb && rawPartAttr && !mesh.geometry.attributes.part) {
          mesh.geometry.setAttribute("part", rawPartAttr);
        }

        // Clone material per instance so each staff wears their own colors cleanly
        const applyMat = (m: THREE.Material): THREE.Material => {
          const cloned = m.clone() as THREE.MeshStandardMaterial;
          if (isRb) {
            patchRocketboxMaterial(cloned, topColor, pantsColor, keepOriginalOutfit);
          } else if (variant === "rpm_male" && !keepOriginalOutfit) {
            if (/Outfit_Top/i.test(mesh.name)) {
              cloned.color.set(topColor).lerp(new THREE.Color("#ffffff"), 0.12);
            } else if (/Outfit_Bottom/i.test(mesh.name)) {
              cloned.color.set(pantsColor).lerp(new THREE.Color("#ffffff"), 0.1);
            }
          }
          cloned.roughness = Math.max(cloned.roughness ?? 0.72, 0.52);
          return cloned;
        };

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(applyMat);
        } else if (mesh.material) {
          mesh.material = applyMat(mesh.material);
        }
      }
    });

    const scale = targetHeight / Math.max(0.8, tpl.height);
    const offsetY = -tpl.minY * scale;

    return {
      clonedScene: instance,
      bones: boneMap,
      scaleFactor: scale,
      groundOffsetY: offsetY,
      clips: retargeted,
    };
  }, [
    gltf.scene,
    xbotGltf.scene,
    xbotGltf.animations,
    variant,
    topColor,
    pantsColor,
    keepOriginalOutfit,
    showHeadwear,
    targetHeight,
  ]);

  // Setup AnimationMixer & Actions once per instance
  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clonedScene);
    const idleAction = mixer.clipAction(clips.idle);
    const walkAction = mixer.clipAction(clips.walk);
    const runAction = mixer.clipAction(clips.run);

    idleAction.play();
    mixer.setTime(phaseOffset % Math.max(0.5, clips.idle.duration));

    mixerRef.current = mixer;
    actionsRef.current = { idle: idleAction, walk: walkAction, run: runAction };
    activeClipKeyRef.current = "idle";

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(clonedScene);
      mixerRef.current = null;
      actionsRef.current = null;
    };
  }, [clonedScene, clips, phaseOffset]);

  // Dispose cloned materials cleanly on unmount
  useEffect(() => {
    return () => {
      clonedScene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.material) return;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });
    };
  }, [clonedScene]);

  useFrame((state, delta) => {
    const mixer = mixerRef.current;
    const actions = actionsRef.current;
    const root = rootGroupRef.current;
    if (!mixer || !actions || !root) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime + phaseOffset;

    // 1. Choose base mocap clip
    const desiredClip: "idle" | "walk" | "run" =
      pose === "running"
        ? "run"
        : pose === "walking"
        ? "walk"
        : "idle";

    if (desiredClip !== activeClipKeyRef.current) {
      const prev = actions[activeClipKeyRef.current];
      const next = actions[desiredClip];
      next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
      prev.crossFadeTo(next, 0.22, false);
      activeClipKeyRef.current = desiredClip;
    }

    const playbackRate = !isSimulationRunning
      ? 0
      : pose === "running"
      ? 1.15 * animSpeed
      : pose === "walking"
      ? 1.05 * animSpeed
      : 0.72;

    mixer.update(dt * playbackRate);

    // 2. Smoothly blend procedural pose layers on top of mocap (seated / typing / swimming)
    const wantSeat = pose === "seated" || pose === "typing" ? 1 : 0;
    seatBlendRef.current += (wantSeat - seatBlendRef.current) * Math.min(1, dt * 8);
    const seatW = seatBlendRef.current;

    root.updateMatrixWorld(true);

    if (seatW > 0.01) {
      // Bend legs cleanly into a natural seated office posture
      rotateBoneInCharSpace(bones.LeftUpLeg, root, _axisX, -1.42 * seatW);
      rotateBoneInCharSpace(bones.RightUpLeg, root, _axisX, -1.42 * seatW);
      rotateBoneInCharSpace(bones.LeftLeg, root, _axisX, 1.46 * seatW);
      rotateBoneInCharSpace(bones.RightLeg, root, _axisX, 1.46 * seatW);

      if (pose === "typing") {
        // Bring upper arms & forearms forward onto the keyboard with subtle typing rhythm
        const typeL = Math.sin(t * 7.5) * 0.045;
        const typeR = Math.cos(t * 7.9 + 0.6) * 0.045;
        rotateBoneInCharSpace(bones.Spine1, root, _axisX, 0.09 * seatW);
        rotateBoneInCharSpace(bones.LeftArm, root, _axisX, (-0.58 + typeL) * seatW);
        rotateBoneInCharSpace(bones.RightArm, root, _axisX, (-0.58 + typeR) * seatW);
        rotateBoneInCharSpace(bones.LeftForeArm, root, _axisX, (-0.72 + typeR) * seatW);
        rotateBoneInCharSpace(bones.RightForeArm, root, _axisX, (-0.72 - typeL) * seatW);
        rotateBoneInCharSpace(bones.Head, root, _axisY, Math.sin(t * 0.75) * 0.14 * seatW);
        rotateBoneInCharSpace(bones.Head, root, _axisX, 0.07 * seatW);
      } else {
        // Relaxed lounge / executive meeting seat posture
        rotateBoneInCharSpace(bones.LeftArm, root, _axisX, -0.34 * seatW);
        rotateBoneInCharSpace(bones.RightArm, root, _axisX, -0.34 * seatW);
        rotateBoneInCharSpace(bones.LeftForeArm, root, _axisX, -0.42 * seatW);
        rotateBoneInCharSpace(bones.RightForeArm, root, _axisX, -0.42 * seatW);
        rotateBoneInCharSpace(bones.Head, root, _axisY, Math.sin(t * 0.55) * 0.18 * seatW);
      }
    } else if (pose === "swimming") {
      const stroke = Math.sin(t * 5.2);
      rotateBoneInCharSpace(bones.Spine, root, _axisX, 0.52);
      rotateBoneInCharSpace(bones.LeftArm, root, _axisX, -1.35 + stroke * 0.75);
      rotateBoneInCharSpace(bones.RightArm, root, _axisX, -1.35 - stroke * 0.75);
      rotateBoneInCharSpace(bones.LeftUpLeg, root, _axisX, stroke * 0.35);
      rotateBoneInCharSpace(bones.RightUpLeg, root, _axisX, -stroke * 0.35);
      rotateBoneInCharSpace(bones.Head, root, _axisX, -0.35);
    } else if (pose === "idle") {
      // Natural subtle living look-around while standing idle
      rotateBoneInCharSpace(bones.Head, root, _axisY, Math.sin(t * 0.6) * 0.16);
      rotateBoneInCharSpace(bones.Spine2, root, _axisZ, Math.sin(t * 1.1) * 0.02);
    }

    // Subtle seated hip-height fine adjustment inside avatar container
    const seatDrop = seatW * -0.26;
    _vB.set(0, groundOffsetY + seatDrop, seatW * 0.08);
    root.position.lerp(_vB, Math.min(1, dt * 12));
  });

  return (
    <group
      ref={rootGroupRef}
      position={[0, groundOffsetY, 0]}
      scale={[scaleFactor, scaleFactor, scaleFactor]}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

/** Lightweight neutral placeholder shown briefly while the HD .glb streams in */
function HumanLoadingFallback({ color = "#334155" }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.9, 6, 10]} />
        <meshStandardMaterial color={color} roughness={0.75} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 1.56, 0]} castShadow>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#d9b293" roughness={0.75} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

class AvatarErrorBoundary extends Component<
  { fallbackColor?: string; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallbackColor?: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <HumanLoadingFallback color={this.props.fallbackColor} />;
    }
    return this.props.children;
  }
}

export function RealisticHumanAvatar(props: RealisticHumanAvatarProps) {
  return (
    <AvatarErrorBoundary fallbackColor={props.topColor}>
      <Suspense fallback={<HumanLoadingFallback color={props.topColor} />}>
        <LoadedHumanAvatar {...props} />
      </Suspense>
    </AvatarErrorBoundary>
  );
}

// Preload all 5 realistic human models + Mixamo animation rig once in background
if (typeof window !== "undefined") {
  useGLTF.preload(MODEL_PATHS.xbot);
  useGLTF.preload(MODEL_PATHS.rpm_male);
  useGLTF.preload(MODEL_PATHS.rb_male_a);
  useGLTF.preload(MODEL_PATHS.rb_male_b);
  useGLTF.preload(MODEL_PATHS.rb_female);
  useGLTF.preload(MODEL_PATHS.michelle);
}
