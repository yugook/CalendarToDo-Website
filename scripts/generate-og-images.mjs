import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const rootDirectory = resolve(import.meta.dirname, '..');
const outputDirectory = resolve(rootDirectory, 'public/og');
const appIconPath = resolve(rootDirectory, 'public/apple-touch-icon.png');
const canvas = { width: 1200, height: 630 };
const phone = { left: 720, top: 5, screenHeight: 560, rotation: -8 };

const svg = (content) => Buffer.from(content);

const roundedRectangle = (width, height, radius, fill) =>
  svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="${fill}" /></svg>`);

const background = svg(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
    <defs>
      <linearGradient id="background" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#ffffff" />
        <stop offset="1" stop-color="#f3faf5" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#background)" />
    <circle cx="110" cy="516" r="162" fill="#e8f6eb" />
    <circle cx="1134" cy="98" r="106" fill="#dff3e4" />
    <rect x="96" y="142" width="112" height="112" rx="26" fill="#ffffff" stroke="#dce9df" stroke-width="2" />
    <text x="96" y="340" fill="#1d1d1f" font-family="Helvetica, Arial, sans-serif" font-size="60" font-weight="700" letter-spacing="-2">Calendar ToDo</text>
  </svg>
`);

async function createPhoneScreen(screenshotPath) {
  const { data: resizedScreen, info } = await sharp(screenshotPath)
    .resize({ height: phone.screenHeight })
    .png()
    .toBuffer({ resolveWithObject: true });

  const screen = await sharp(resizedScreen)
    .composite([
      {
        input: roundedRectangle(info.width, info.height, 46, '#ffffff'),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

  const bezel = 11;
  const buttonSpace = 5;
  const bodyWidth = info.width + bezel * 2;
  const bodyHeight = info.height + bezel * 2;
  const phoneWidth = bodyWidth + buttonSpace * 2;
  const bodyLeft = buttonSpace;
  const shell = svg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${phoneWidth}" height="${bodyHeight}">
      <rect x="${bodyLeft}" width="${bodyWidth}" height="${bodyHeight}" rx="56" fill="#17181b" stroke="#46474c" stroke-width="2" />
      <rect x="1" y="106" width="7" height="32" rx="3.5" fill="#2a2b2f" />
      <rect x="1" y="156" width="7" height="48" rx="3.5" fill="#2a2b2f" />
      <rect x="1" y="216" width="7" height="48" rx="3.5" fill="#2a2b2f" />
      <rect x="${phoneWidth - 8}" y="170" width="7" height="78" rx="3.5" fill="#2a2b2f" />
    </svg>
  `);

  const assembledPhone = await sharp({
    create: {
      width: phoneWidth,
      height: bodyHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: shell },
      { input: screen, left: bodyLeft + bezel, top: bezel },
    ])
    .png()
    .toBuffer();

  return sharp(assembledPhone)
    .rotate(phone.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function createOgImage(locale) {
  const screenshotPath = resolve(
    rootDirectory,
    `src/assets/screenshots/v2.2.0/${locale}/calendar-progress.png`,
  );
  const phoneScreen = await createPhoneScreen(screenshotPath);
  const icon = await sharp(appIconPath).resize(100, 100).png().toBuffer();

  await sharp({
    create: {
      width: canvas.width,
      height: canvas.height,
      channels: 4,
      background: '#ffffff',
    },
  })
    .composite([
      { input: background },
      { input: icon, left: 102, top: 148 },
      {
        input: phoneScreen,
        left: phone.left,
        top: phone.top,
        blend: 'over',
      },
    ])
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(resolve(outputDirectory, `${locale}.png`));
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all(['ja', 'en'].map(createOgImage));
