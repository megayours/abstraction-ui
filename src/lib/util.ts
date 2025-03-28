export const toHexBuffer = (address: string) => {
  return Buffer.from(address.replace('0x', ''), 'hex');
}

export const fromHexBuffer = (buffer: Buffer) => {
  return buffer.toString('hex');
}

export const formatAddress = (address: string) => {
  if (isHexString(address)) {
    return `0x${address}`;
  }

  return address;
}

const isHexString = (address: string) => {
  return /^[0-9a-fA-F]+$/.test(address);
}