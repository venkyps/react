import { createWorker } from 'tesseract.js';

// Keywords that indicate a receipt/invoice
const RECEIPT_KEYWORDS = [
  'total', 'amount', 'subtotal', 'net amount', 'grand total',
  'receipt', 'invoice', 'bill no', 'cashier', 'tax', 'gst',
  'thank you', 'change', 'qty', 'unit price',
];

/**
 * Runs OCR on an image URL and attempts to detect if it's a receipt
 * and extract the total/net amount.
 */
/**
 * Preprocesses image using HTML Canvas (grayscale + contrast boost) for better OCR accuracy
 */
async function preprocessImageForOcr(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imageUrl);

      // Scale up small thermal receipt images for higher DPI OCR resolution
      const scale = Math.max(1, 1500 / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // 1. Grayscale
      const grays = new Uint8Array(data.length / 4);
      for (let i = 0; i < data.length; i += 4) {
        grays[i / 4] = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      }

      // 2. Otsu / Threshold binarization for clean black & white text
      let sum = 0;
      for (let i = 0; i < grays.length; i++) sum += grays[i];
      const threshold = Math.min(200, Math.max(100, Math.round(sum / grays.length) - 15));

      for (let i = 0; i < data.length; i += 4) {
        const val = grays[i / 4] < threshold ? 0 : 255;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

export async function extractReceiptData(imageUrl: string): Promise<{
  isReceipt: boolean;
  extractedAmount: string | null;
  rawText: string;
}> {
  try {
    // Pass 1: Try processed threshold image
    let processedUrl = await preprocessImageForOcr(imageUrl);
    let worker = await createWorker('eng');
    let { data: { text } } = await worker.recognize(processedUrl);
    await worker.terminate();

    // Pass 2: Fallback to original image if threshold produced very low text output
    if (!text || text.trim().length < 15) {
      worker = await createWorker('eng');
      const pass2 = await worker.recognize(imageUrl);
      await worker.terminate();
      if (pass2.data.text && pass2.data.text.trim().length > (text ? text.trim().length : 0)) {
        text = pass2.data.text;
      }
    }

    const rawText = text || '';
    const lower = rawText.toLowerCase();

    // Score receipt likelihood
    const matched = RECEIPT_KEYWORDS.filter(kw => lower.includes(kw));
    const isReceipt = matched.length >= 1 || lower.includes('total') || lower.includes('net') || lower.includes('amount');

    // Thermal receipt regex patterns (e.g. Net Amount: 47.40, Total Amount: 47.38)
    const patterns = [
      /net\s*amount[:\s]*[\$sS8\s]*([\d\.]+\.\d{2})/i,
      /total\s*amount[:\s]*[\$sS8\s]*([\d\.]+\.\d{2})/i,
      /grand\s*total[:\s]*[\$sS8\s]*([\d\.]+\.\d{2})/i,
      /amount\s*due[:\s]*[\$sS8\s]*([\d\.]+\.\d{2})/i,
      /net\s*[\$sS8\s]*([\d\.]+\.\d{2})/i,
      /total[:\s]*[\$sS8\s]*([\d\.]+\.\d{2})/i,
      /[\$sS]\s*([\d\.]+\.\d{2})/i,
    ];

    let extractedAmount: string | null = null;
    for (const pattern of patterns) {
      const match = rawText.match(pattern);
      if (match && match[1]) {
        let clean = match[1].replace(/,/g, '');
        if (clean.split('.').length === 2 && !isNaN(parseFloat(clean))) {
          extractedAmount = clean;
          break;
        }
      }
    }

    // Fallback: search lines bottom-up for any line ending with a valid decimal price
    if (!extractedAmount) {
      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean).reverse();
      for (const line of lines) {
        const lineMatch = line.match(/([\d]+\.\d{2})\s*$/);
        if (lineMatch && lineMatch[1]) {
          extractedAmount = lineMatch[1];
          break;
        }
      }
    }

    return { isReceipt, extractedAmount, rawText };
  } catch (err) {
    console.warn('Receipt OCR failed:', err);
    return { isReceipt: false, extractedAmount: null, rawText: '' };
  }
}

