import { Request, Response } from "express";

import { Firestore } from "@google-cloud/firestore";

import { Storage } from "@google-cloud/storage";
import { nanoid } from "nanoid";

const BUCKET_URL = "<placeholder>";

type ManifestData = {
  createdAt: number;
  hash: string;
  status: "active" | "finished";
  imagesNum: number;
};

export const verifyRegistration = async (req: Request, res: Response) => {
  const { projectId, participantId, deviceMeta } = req.body;
  console.log("verifyRegistration", projectId, participantId);

  if (!projectId || !participantId)
    return res
      .status(400)
      .json({ message: "Missing projectId or participantId" });

  const db = new Firestore();

  // mark participant as verified
  const docRef = db.doc(`projects/${projectId}/participants/${participantId}`);
  await docRef.update({ verified: true, deviceMeta });

  return res.status(200).json({ message: "ok" });
};

// To be called before sending of screenshots / app data
export const submitManifest = async (req: Request, res: Response) => {
  const { projectId, participantId, hash, imagesNum } = req.body;
  console.log("submitManifest", projectId, participantId, hash, imagesNum);

  // Validate data
  if (!projectId || !participantId || !hash)
    return res
      .status(400)
      .json({ message: "Missing projectId or participantId" });

  const manifestId = nanoid();
  const db = new Firestore();

  // Create new manifest
  const docRef = db.doc(
    `projects/${projectId}/participants/${participantId}/manifests/${manifestId}`
  );
  await docRef.set({
    createdAt: Date.now(),
    hash,
    status: "active",
    imagesNum,
  } as ManifestData);

  const storage = new Storage();
  const [url] = await storage
    .bucket(BUCKET_URL)
    .file(`${projectId}/${participantId}/${manifestId}.zip`)
    .getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 60 * 60 * 1000, // 60 minutes
      contentType: "application/zip",
    });

  return res.status(200).json({ url, manifestId });
};

// To be called after sending of screenshots / app data
export const checkManifest = async (req: Request, res: Response) => {
  const { projectId, participantId, manifestId } = req.body;
  console.log("checkManifest", projectId, participantId, manifestId);

  // Validate data
  if (!projectId || !participantId)
    return res
      .status(400)
      .json({ message: "Missing projectId or participantId" });

  const db = new Firestore();

  // Get new manifest
  const docRef = db.doc(
    `projects/${projectId}/participants/${participantId}/manifests/${manifestId}`
  );
  const doc = await docRef.get();

  if (!doc.exists)
    return res
      .status(400)
      .json({ message: `Invalid manifestId ${manifestId}` });

  const manifestData = doc.data() as ManifestData;

  if (manifestData.status === "active") {
    // If still considered active, check hash of zip
    const storage = new Storage();

    const [exists] = await storage
      .bucket(BUCKET_URL)
      .file(`${projectId}/${participantId}/${manifestId}.zip`)
      .exists();

    if (!exists)
      return res.status(200).json({
        status: manifestData.status,
        message: "no file",
      });

    const [metadata] = await storage
      .bucket(BUCKET_URL)
      .file(`${projectId}/${participantId}/${manifestId}.zip`)
      .getMetadata();

    if (metadata.md5Hash === manifestData.hash) {
      await docRef.update({ status: "finished" });
      return res.status(200).json({
        status: "finished",
        message: "matched",
      });
    } else {
      await docRef.update({ status: "mismatch" });
      return res.status(200).json({
        status: "mismatch",
        message: "mismatch detected",
        foundMD5: metadata.md5Hash,
        expectedMD5: manifestData.hash,
      });
    }
  }

  return res.status(200).json({
    status: manifestData.status,
    message: "",
  });
};
