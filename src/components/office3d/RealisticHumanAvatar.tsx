"use client";

import React, { Component, Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

export type HumanAvatarVariant =
  | "vroid_male"
  | "vroid_female"
  | "rpm_male"
  | "rb_male_a"
  | "rb_male_b"
  | "rpm_female"
  | "rpm_female_b"
  | "rb_female"
  | "michelle";

export type HumanAvatarPose =
  | "idle"
  | "walking"
  | "running"
  | "seated"
  | "typing"
  | "swimming"
  | "lying";

export interface RealisticHumanAvatarProps {
  variant: HumanAvatarVariant;
  pose: HumanAvatarPose;
  topColor?: string;
  pantsColor?: string;
  hairColor?: string;
  keepOriginalOutfit?: boolean;
  showHeadwear?: boolean;
  hasGlasses?: boolean;
  hasHijab?: boolean;
  hasNeckHeadphones?: boolean;
  tieColor?: string;
  fajrezzzBadgeColor?: string;
  targetHeight?: number;
  phaseOffset?: number;
  animSpeed?: number;
  isSimulationRunning?: boolean;
}

const MODEL_PATHS: Record<HumanAvatarVariant | "xbot", string> = {
  vroid_male: "/models/vroid_male.glb",
  vroid_female: "/models/vroid_female.glb",
  rpm_male: "/models/rpm_male.glb",
  rb_male_a: "/models/rb_male_a.glb",
  rb_male_b: "/models/rb_male_b.glb",
  rpm_female: "/models/rpm_female.glb",
  rpm_female_b: "/models/rpm_female_b.glb",
  rb_female: "/models/rb_female.glb",
  michelle: "/models/Michelle.glb",
  xbot: "/models/Xbot.glb",
};

const VROID_VARIANTS = new Set<HumanAvatarVariant>([
  "vroid_male",
  "vroid_female",
]);

const VROID_BONE_MAP: Record<string, string> = {
  J_Bip_C_Hips: "Hips",
  J_Bip_C_Spine: "Spine",
  J_Bip_C_Chest: "Spine1",
  J_Bip_C_UpperChest: "Spine2",
  J_Bip_C_Neck: "Neck",
  J_Bip_C_Head: "Head",
  J_Bip_L_Shoulder: "LeftShoulder",
  J_Bip_L_UpperArm: "LeftArm",
  J_Bip_L_LowerArm: "LeftForeArm",
  J_Bip_L_Hand: "LeftHand",
  J_Bip_L_Middle1: "LeftHandMiddle1",
  J_Bip_R_Shoulder: "RightShoulder",
  J_Bip_R_UpperArm: "RightArm",
  J_Bip_R_LowerArm: "RightForeArm",
  J_Bip_R_Hand: "RightHand",
  J_Bip_R_Middle1: "RightHandMiddle1",
  J_Bip_L_UpperLeg: "LeftUpLeg",
  J_Bip_L_LowerLeg: "LeftLeg",
  J_Bip_L_Foot: "LeftFoot",
  J_Bip_L_ToeBase: "LeftToeBase",
  J_Bip_R_UpperLeg: "RightUpLeg",
  J_Bip_R_LowerLeg: "RightLeg",
  J_Bip_R_Foot: "RightFoot",
  J_Bip_R_ToeBase: "RightToeBase",
};

const RB_VARIANTS = new Set<HumanAvatarVariant>([
  "rb_male_a",
  "rb_male_b",
  "rb_female",
]);

const RPM_VARIANTS = new Set<HumanAvatarVariant>([
  "rpm_male",
  "rpm_female",
  "rpm_female_b",
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
  if (VROID_BONE_MAP[name]) return VROID_BONE_MAP[name];
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
const _vBoneWorld = new THREE.Vector3();
const _axisX = new THREE.Vector3(1, 0, 0);
const _axisY = new THREE.Vector3(0, 1, 0);
const _axisZ = new THREE.Vector3(0, 0, 1);

function prepareTemplate(
  key: HumanAvatarVariant | "xbot",
  rawScene: THREE.Object3D
): PreparedTemplate {
  const existing = templateCache.get(key);
  if (existing) return existing;

  const scene = cloneSkinned(rawScene);
  // VRM 0.x models face -Z by spec -> rotate 180 deg so they face +Z just like Mixamo Xbot!
  if (key !== "xbot" && VROID_VARIANTS.has(key)) {
    scene.rotation.y = Math.PI;
  }
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
 * Rocketbox shader: alpha-cutout hair cards + hair color + crisp Fajrezzz top/pants recoloring
 * while keeping natural skin/face texture intact.
 */
function patchRocketboxMaterial(
  mat: THREE.MeshStandardMaterial,
  topColor: string,
  pantsColor: string,
  hairColor: string,
  keepOriginal: boolean
) {
  const uniforms = {
    uTop: { value: new THREE.Color(topColor) },
    uBottom: { value: new THREE.Color(pantsColor) },
    uHair: { value: new THREE.Color(hairColor) },
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
        "#include <common>\nvarying float vRbPart;\nuniform vec3 uTop;\nuniform vec3 uBottom;\nuniform vec3 uHair;\nuniform float uKeepOriginal;"
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
            float hLum = dot(c, vec3(0.299, 0.587, 0.114));
            diffuseColor.rgb = mix(c, uHair * (0.55 + hLum * 1.15), 0.78);
          } else if (uKeepOriginal < 0.5 && pt > 0.5 && pt < 2.5) {
            vec3 s = pow(max(c, vec3(1e-4)), vec3(1.0 / 2.2));
            float mx = max(s.r, max(s.g, s.b));
            float dd = mx - min(s.r, min(s.g, s.b));
            float hh = (s.g - s.b) / (dd + 1e-4);
            bool isSkin = (s.r >= s.g && s.g >= s.b && dd / (mx + 1e-4) > 0.22 && dd / (mx + 1e-4) < 0.72 && mx > 0.25 && hh > 0.14 && hh < 0.76);
            if (!isSkin) {
              float lum = dot(c, vec3(0.299, 0.587, 0.114));
              float shade = 0.36 + lum * 1.5;
              if (pt < 1.5) {
                diffuseColor.rgb = mix(c, uTop * shade, 0.9);
              } else {
                diffuseColor.rgb = mix(c, uBottom * shade, 0.85);
              }
            }
          }
        }`
      );
  };
  mat.customProgramCacheKey = () => "fajrezzz-rb-human-v2";
  mat.needsUpdate = true;
}

/**
 * VRoid Anime Cloth Top/Bottom Shader:
 * Cleanly recolors merged VRoid upper top (hoodie/shirt/blouse/varsity) & lower pants/skirt
 * while keeping crisp anime fabric shadows, folds, zippers, and sneakers intact!
 */
function patchVroidClothMaterial(
  mat: THREE.MeshStandardMaterial,
  topColor: string,
  pantsColor: string,
  splitY: number,
  keepOriginal: boolean
) {
  if (keepOriginal) return;
  const uniforms = {
    uTop: { value: new THREE.Color(topColor) },
    uBottom: { value: new THREE.Color(pantsColor) },
    uSplitY: { value: splitY },
  };
  mat.userData.vroidUniforms = uniforms;
  mat.roughness = 0.72;
  mat.metalness = 0.04;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vVroidY;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvVroidY = position.y;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vVroidY;\nuniform vec3 uTop;\nuniform vec3 uBottom;\nuniform float uSplitY;"
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          vec3 c = diffuseColor.rgb;
          float lum = dot(c, vec3(0.299, 0.587, 0.114));
          // Keep footwear near y < 0.14 subtly neutral/dark; recolor top & bottom cleanly
          if (vVroidY > 0.13) {
            float topMix = smoothstep(uSplitY - 0.025, uSplitY + 0.025, vVroidY);
            vec3 target = mix(uBottom, uTop, topMix);
            // Preserve crisp anime shading & crease contrast while faithfully rendering white/lavender/blue/black
            float shade = 0.42 + lum * 1.12;
            diffuseColor.rgb = mix(c, target * shade, 0.92);
          }
        }`
      );
  };
  mat.customProgramCacheKey = () => "fajrezzz-vroid-cloth-v1";
  mat.needsUpdate = true;
}

/**
 * Recolors Michelle's red dress into sleek Fajrezzz outfits (Black, Lavender, White, Navy)
 * without tinting her skin or dark hair.
 */
function patchMichelleMaterial(
  mat: THREE.MeshStandardMaterial,
  topColor: string,
  keepOriginal: boolean
) {
  if (keepOriginal) return;
  const uniforms = {
    uDress: { value: new THREE.Color(topColor) },
  };
  mat.userData.michUniforms = uniforms;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uDress;")
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          vec3 c = diffuseColor.rgb;
          // Target red-magenta dress pixels only (leave skin & hair untouched)
          if (c.r > 0.18 && c.r > c.g * 1.65 && c.r > c.b * 1.55) {
            float lum = dot(c, vec3(0.299, 0.587, 0.114));
            diffuseColor.rgb = uDress * (0.45 + lum * 1.45);
          }
        }`
      );
  };
  mat.customProgramCacheKey = () => "fajrezzz-michelle-v1";
  mat.needsUpdate = true;
}

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
  topColor = "#141722",
  pantsColor = "#11141e",
  hairColor = "#151314",
  keepOriginalOutfit = false,
  showHeadwear = false,
  hasGlasses = false,
  hasHijab = false,
  hasNeckHeadphones = false,
  tieColor,
  fajrezzzBadgeColor,
  targetHeight = 1.72,
  phaseOffset = 0,
  animSpeed = 1,
  isSimulationRunning = true,
}: RealisticHumanAvatarProps) {
  const gltf = useGLTF(MODEL_PATHS[variant]);
  const xbotGltf = useGLTF(MODEL_PATHS.xbot);

  const outerGroupRef = useRef<THREE.Group>(null);
  const rootGroupRef = useRef<THREE.Group>(null);
  const headAccRef = useRef<THREE.Group>(null);
  const chestAccRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<"idle" | "walk" | "run", THREE.AnimationAction> | null>(
    null
  );
  const activeClipKeyRef = useRef<"idle" | "walk" | "run">("idle");
  const seatBlendRef = useRef(pose === "seated" || pose === "typing" ? 1 : 0);

  const { clonedScene, bones, scaleFactor, groundOffsetY, clips, hasNativeGlasses } =
    useMemo(() => {
      const tpl = prepareTemplate(variant, gltf.scene);
      const retargeted = getRetargetedClips(
        variant,
        tpl,
        xbotGltf.scene,
        xbotGltf.animations
      );

      const instance = cloneSkinned(gltf.scene);
      const boneMap: Record<string, THREE.Bone> = {};
      const isVroid = VROID_VARIANTS.has(variant);
      const isRb = RB_VARIANTS.has(variant);
      const isRpm = RPM_VARIANTS.has(variant);
      let nativeGlassesFound = false;

      if (isVroid) {
        instance.rotation.y = Math.PI;
      }

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

          if (isVroid && hasHijab && /Hair/i.test(mesh.name)) {
            mesh.visible = false;
          }

          if (isRpm) {
            if (/Headwear/i.test(mesh.name)) {
              mesh.visible = showHeadwear;
            }
            if (/Glasses/i.test(mesh.name)) {
              nativeGlassesFound = true;
              mesh.visible = hasGlasses;
            }
            // Hide hair mesh cleanly when wearing sculpted silk hijab
            if (hasHijab && /Hair/i.test(mesh.name)) {
              mesh.visible = false;
            }
          }

          const rawPartAttr =
            mesh.geometry.attributes._part || mesh.geometry.attributes._PART;
          if (isRb && rawPartAttr && !mesh.geometry.attributes.part) {
            mesh.geometry.setAttribute("part", rawPartAttr);
          }

          const applyMat = (m: THREE.Material): THREE.Material => {
            const cloned = m.clone() as THREE.MeshStandardMaterial;
            if (isVroid) {
              const mName = cloned.name || "";
              if (/CLOTH/i.test(mName)) {
                const splitY = variant === "vroid_male" ? 0.96 : 0.91;
                patchVroidClothMaterial(
                  cloned,
                  topColor,
                  pantsColor,
                  splitY,
                  keepOriginalOutfit
                );
              } else if (/HAIR/i.test(mName)) {
                // Smoothly tint VRoid anime hair per team member while preserving highlight sheen
                cloned.color.set(hairColor).lerp(new THREE.Color("#ffffff"), 0.22);
                cloned.roughness = 0.56;
              } else if (/EyeIris/i.test(mName) && variant === "vroid_male") {
                // Replace AvatarSample_C crimson iris with natural dark obsidian/espresso anime eyes matching Our Team!
                cloned.color.set("#261a16");
              } else if (/SKIN|FACE/i.test(mName)) {
                cloned.roughness = 0.62;
              }
            } else if (isRb) {
              patchRocketboxMaterial(
                cloned,
                topColor,
                pantsColor,
                hairColor,
                keepOriginalOutfit
              );
            } else if (isRpm) {
              if (!keepOriginalOutfit && /Outfit_Top/i.test(mesh.name)) {
                cloned.color.set(topColor).lerp(new THREE.Color("#ffffff"), 0.08);
              } else if (!keepOriginalOutfit && /Outfit_Bottom/i.test(mesh.name)) {
                cloned.color.set(pantsColor).lerp(new THREE.Color("#ffffff"), 0.06);
              } else if (/Hair/i.test(mesh.name)) {
                cloned.color.set(hairColor).lerp(new THREE.Color("#ffffff"), 0.08);
              }
            } else if (variant === "michelle") {
              patchMichelleMaterial(cloned, topColor, keepOriginalOutfit);
            }
            cloned.roughness = Math.max(cloned.roughness ?? 0.68, 0.48);
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
        hasNativeGlasses: nativeGlassesFound,
      };
    }, [
      gltf.scene,
      xbotGltf.scene,
      xbotGltf.animations,
      variant,
      topColor,
      pantsColor,
      hairColor,
      keepOriginalOutfit,
      showHeadwear,
      hasGlasses,
      hasHijab,
      targetHeight,
    ]);

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

  const needHeadAcc = hasHijab || (hasGlasses && !hasNativeGlasses);
  const needChestAcc = Boolean(hasNeckHeadphones || tieColor || fajrezzzBadgeColor);

  useFrame((state, delta) => {
    const mixer = mixerRef.current;
    const actions = actionsRef.current;
    const root = rootGroupRef.current;
    const outer = outerGroupRef.current;
    if (!mixer || !actions || !root || !outer) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime + phaseOffset;

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

    const wantSeat = pose === "seated" || pose === "typing" ? 1 : 0;
    seatBlendRef.current += (wantSeat - seatBlendRef.current) * Math.min(1, dt * 8);
    const seatW = seatBlendRef.current;

    root.updateMatrixWorld(true);

    if (seatW > 0.01) {
      rotateBoneInCharSpace(bones.LeftUpLeg, root, _axisX, -1.42 * seatW);
      rotateBoneInCharSpace(bones.RightUpLeg, root, _axisX, -1.42 * seatW);
      rotateBoneInCharSpace(bones.LeftLeg, root, _axisX, 1.46 * seatW);
      rotateBoneInCharSpace(bones.RightLeg, root, _axisX, 1.46 * seatW);

      if (pose === "typing") {
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
        rotateBoneInCharSpace(bones.LeftArm, root, _axisX, -0.34 * seatW);
        rotateBoneInCharSpace(bones.RightArm, root, _axisX, -0.34 * seatW);
        rotateBoneInCharSpace(bones.LeftForeArm, root, _axisX, -0.42 * seatW);
        rotateBoneInCharSpace(bones.RightForeArm, root, _axisX, -0.42 * seatW);
        rotateBoneInCharSpace(bones.Head, root, _axisY, Math.sin(t * 0.55) * 0.18 * seatW);
      }
    } else if (pose === "lying") {
      // Rebahan santai di lounger/matras: badan lurus, tangan sedikit terbuka,
      // kaki rileks, dada naik-turun pelan, kepala menoleh sesekali.
      rotateBoneInCharSpace(bones.Spine1, root, _axisX, Math.sin(t * 0.9) * 0.022);
      rotateBoneInCharSpace(bones.LeftArm, root, _axisZ, 0.17);
      rotateBoneInCharSpace(bones.RightArm, root, _axisZ, -0.17);
      rotateBoneInCharSpace(bones.LeftForeArm, root, _axisX, -0.16);
      rotateBoneInCharSpace(bones.RightForeArm, root, _axisX, -0.16);
      rotateBoneInCharSpace(bones.LeftUpLeg, root, _axisX, -0.05);
      rotateBoneInCharSpace(bones.RightUpLeg, root, _axisX, -0.05);
      rotateBoneInCharSpace(bones.LeftLeg, root, _axisX, 0.12);
      rotateBoneInCharSpace(bones.RightLeg, root, _axisX, 0.12);
      rotateBoneInCharSpace(bones.Head, root, _axisX, 0.1);
      rotateBoneInCharSpace(bones.Head, root, _axisY, Math.sin(t * 0.45) * 0.12);
    } else if (pose === "swimming") {
      const stroke = Math.sin(t * 5.2);
      rotateBoneInCharSpace(bones.Spine, root, _axisX, 0.52);
      rotateBoneInCharSpace(bones.LeftArm, root, _axisX, -1.35 + stroke * 0.75);
      rotateBoneInCharSpace(bones.RightArm, root, _axisX, -1.35 - stroke * 0.75);
      rotateBoneInCharSpace(bones.LeftUpLeg, root, _axisX, stroke * 0.35);
      rotateBoneInCharSpace(bones.RightUpLeg, root, _axisX, -stroke * 0.35);
      rotateBoneInCharSpace(bones.Head, root, _axisX, -0.35);
    } else if (pose === "idle") {
      rotateBoneInCharSpace(bones.Head, root, _axisY, Math.sin(t * 0.6) * 0.16);
      rotateBoneInCharSpace(bones.Spine2, root, _axisZ, Math.sin(t * 1.1) * 0.02);
    }

    const seatDrop = seatW * -0.26;
    _vB.set(0, groundOffsetY + seatDrop, seatW * 0.08);
    root.position.lerp(_vB, Math.min(1, dt * 12));

    // Sync character-space 3D accessories cleanly to live animated Head / Spine2 bones
    if (needHeadAcc && headAccRef.current && bones.Head) {
      bones.Head.getWorldPosition(_vBoneWorld);
      outer.worldToLocal(_vBoneWorld);
      headAccRef.current.position.copy(_vBoneWorld);
    }
    if (needChestAcc && chestAccRef.current && (bones.Spine2 || bones.Spine1)) {
      const chestBone = bones.Spine2 || bones.Spine1;
      chestBone.getWorldPosition(_vBoneWorld);
      outer.worldToLocal(_vBoneWorld);
      chestAccRef.current.position.copy(_vBoneWorld);
    }
  });

  return (
    <group ref={outerGroupRef}>
      <group
        ref={rootGroupRef}
        position={[0, groundOffsetY, 0]}
        scale={[scaleFactor, scaleFactor, scaleFactor]}
      >
        <primitive object={clonedScene} />
      </group>

      {/* Bone-Tracked Head Accessories (Black Silk Hijab / Modern Glasses from Fajrezzz Team Photo) */}
      {needHeadAcc && (
        <group ref={headAccRef} position={[0, targetHeight * 0.88, 0]}>
          {hasHijab && (
            <group>
              {/* Sleek Black Silk Hijab Head Wrap */}
              <mesh position={[0, 0.095, -0.015]} scale={[1.05, 1.12, 1.08]} castShadow>
                <sphereGeometry args={[0.128, 18, 16]} />
                <meshStandardMaterial color="#11131a" roughness={0.62} />
              </mesh>
              {/* Face-Framing Hijab Rim */}
              <mesh position={[0, 0.085, 0.048]} scale={[0.96, 1.06, 0.85]}>
                <torusGeometry args={[0.098, 0.022, 10, 22]} />
                <meshStandardMaterial color="#161924" roughness={0.64} />
              </mesh>
              {/* Neck & Chest Drape Shawl */}
              <mesh position={[0, -0.06, 0.005]} scale={[1.15, 0.92, 0.95]} castShadow>
                <cylinderGeometry args={[0.105, 0.165, 0.2, 16]} />
                <meshStandardMaterial color="#12151f" roughness={0.65} />
              </mesh>
            </group>
          )}
          {hasGlasses && !hasNativeGlasses && (
            <group position={[0, 0.075, 0.105]}>
              <mesh position={[-0.036, 0, 0]}>
                <torusGeometry args={[0.021, 0.0038, 8, 18]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0.036, 0, 0]}>
                <torusGeometry args={[0.021, 0.0038, 8, 18]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.002, 0]}>
                <boxGeometry args={[0.024, 0.004, 0.004]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* Bone-Tracked Chest Accessories (Neck Headphones, Executive Tie, Glowing Purple F Badge) */}
      {needChestAcc && (
        <group ref={chestAccRef} position={[0, targetHeight * 0.72, 0]}>
          {hasNeckHeadphones && (
            <group position={[0, 0.175, 0.015]}>
              <mesh rotation={[Math.PI / 2 - 0.18, 0, 0]}>
                <torusGeometry args={[0.088, 0.015, 10, 20, Math.PI * 1.4]} />
                <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
              </mesh>
              {[-0.082, 0.082].map((hx, hi) => (
                <group key={hi} position={[hx, -0.015, 0.068]}>
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.032, 0.032, 0.024, 12]} />
                    <meshStandardMaterial color="#1e1b4b" roughness={0.35} metalness={0.55} />
                  </mesh>
                  <mesh rotation={[0, 0, Math.PI / 2]} position={[hx > 0 ? 0.013 : -0.013, 0, 0]}>
                    <torusGeometry args={[0.024, 0.004, 8, 16]} />
                    <meshStandardMaterial
                      color="#c4b5fd"
                      emissive="#8b5cf6"
                      emissiveIntensity={1.6}
                    />
                  </mesh>
                </group>
              ))}
            </group>
          )}
          {tieColor && (
            <group position={[0, 0.01, 0.118]}>
              <mesh position={[0, 0.095, 0]}>
                <boxGeometry args={[0.036, 0.034, 0.016]} />
                <meshStandardMaterial color={tieColor} roughness={0.45} />
              </mesh>
              <mesh position={[0, -0.035, 0]}>
                <boxGeometry args={[0.032, 0.22, 0.012]} />
                <meshStandardMaterial color={tieColor} roughness={0.45} />
              </mesh>
            </group>
          )}
          {fajrezzzBadgeColor && (
            <mesh position={[0.075, 0.06, 0.118]}>
              <boxGeometry args={[0.036, 0.036, 0.008]} />
              <meshStandardMaterial
                color="#e9d5ff"
                emissive={fajrezzzBadgeColor}
                emissiveIntensity={1.9}
              />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
}

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

if (typeof window !== "undefined") {
  useGLTF.preload(MODEL_PATHS.xbot);
  useGLTF.preload(MODEL_PATHS.vroid_male);
  useGLTF.preload(MODEL_PATHS.vroid_female);
}
