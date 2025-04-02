import { FsFile } from "filehub";


export const calculateHash = (data: Buffer, contentType: "image/jpeg" | "image/png") => {
  return FsFile.fromData(data, { "Content-Type": contentType }).hash;
}