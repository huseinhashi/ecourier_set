import QRCode from "qrcode";
import path from "path";
import fs from "fs";

async function testQrCode(shipmentId) {
  // Create a mock shipment object
  const shipment = {
    _id: shipmentId,
    qrCodeId: `QR-${shipmentId}`,
  };
  const qrDir = path.join(process.cwd(), "uploads", "qrcodes");
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
  const qrPath = path.join(qrDir, `${shipment._id}.png`);
  const qrContent = shipment.qrCodeId || `QR-${shipment._id}`;
  await QRCode.toFile(qrPath, qrContent);
  console.log(`QR code generated at: ${qrPath}`);
}

// Usage: node backend/scripts/testQrCode.js <shipmentId>
const shipmentId = process.argv[2];
if (!shipmentId) {
  console.error("Usage: node backend/scripts/testQrCode.js <shipmentId>");
  process.exit(1);
}
testQrCode(shipmentId);
