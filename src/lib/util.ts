export const toHexBuffer = (address: string) => {
  return Buffer.from(address.replace('0x', ''), 'hex');
}

export const fromHexBuffer = (buffer: Buffer) => {
  return buffer.toString('hex');
}