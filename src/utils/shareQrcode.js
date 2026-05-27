import QRCode from 'qrcode'

export async function createShareQrcodeDataUrl(value) {
  if (!value) {
    return ''
  }

  const svg = await QRCode.toString(value, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
    color: {
      dark: '#2a140d',
      light: '#ffffff',
    },
  })

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
