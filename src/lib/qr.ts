export function generateTableQRUrl(token: string): string {
  // Returns QR code generation URL API or a path to the self-ordering screen
  const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${host}/s/${token}`;
}

export async function generateQRCodePDF(token: string): Promise<string> {
  // Mock generated QR PDF file path cached under public/qr/
  const fileName = `qr-${token}.pdf`;
  const relativePath = `/qr/${fileName}`;
  // In real system, this would write a PDF to `public/qr/qr-token.pdf`
  return relativePath;
}
