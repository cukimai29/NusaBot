const axios = require("axios");

let _sharp = null;
async function getSharp() {
  if (!_sharp) {
    const sharpModule = require("sharp");
    _sharp = sharpModule.default || sharpModule;
  }
  return _sharp;
}

const LATEX_BG = "#1a1a2e";
const LATEX_FG = "#ffffff";
const LATEX_PADDING = 20;
const LATEX_DPI = 200;

const renderLatexToPng = async (latex, options = {}) => {
  const { bgColor = LATEX_BG, dpi = LATEX_DPI } = options;

  const url = `https://latex.codecogs.com/png.image?\\dpi{${dpi}}\\bg{${bgColor.replace("#", "")}} ${encodeURIComponent(latex)}`;

  const res = await axios.get(url, { responseType: "arraybuffer" });

  const buffer = Buffer.from(res.data);
  const sharp = await getSharp();
  const metadata = await sharp(buffer).metadata();

  return {
    buffer,
    width: metadata.width || 500,
    height: metadata.height || 150,
  };
};

const createMediaUploadFn = async (sock) => {
  const { prepareWAMessageMedia } = require("ourin");
  return async (imageBuffer, mediaType) => {
    const media = await prepareWAMessageMedia(
      { image: imageBuffer },
      { upload: sock.waUploadToServer },
    );
    const imgMsg = media?.imageMessage;
    const url = imgMsg?.url || "";
    const directPath = imgMsg?.directPath || "";
    return { url, directPath };
  };
};

module.exports = {
  renderLatexToPng,
  createMediaUploadFn,
  LATEX_BG,
  LATEX_FG,
  LATEX_PADDING,
  LATEX_DPI,
};