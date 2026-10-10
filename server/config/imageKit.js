import "./env.js";
import ImageKit from "imagekit";

let client = null;

// Created lazily so the app (and tests) can start without ImageKit keys.
const getImageKit = () => {
  if (!client) {
    client = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }
  return client;
};

// Uploads an in-memory image and returns an optimised (webp, 800px) URL.
export const uploadBlogImage = async (file) => {
  const imagekit = getImageKit();
  const response = await imagekit.upload({
    file: file.buffer,
    fileName: file.originalname,
    folder: "blogs",
  });
  return imagekit.url({
    src: response.url,
    transformation: [{ quality: "auto" }, { format: "webp" }, { width: "800" }],
  });
};

export default getImageKit;
