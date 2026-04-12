const { default: MSP } = await import('../../src/core/msp.js');

describe('MSP Parser', () => {
  it('should correctly parse a simple MSP packet', () => {
    // MSP_API_VERSION response (ID: 1, Size: 3: protocol version, api major, api minor)
    // Packet: $M> (3) + size(3) + type(1) + payload(1, 2, 0) + checksum
    // Checksum: 3 ^ 1 ^ 1 ^ 2 ^ 0 = 1
    const buffer = Buffer.from([36, 77, 62, 3, 1, 1, 2, 0, 1]);

    const packet = MSP.parse(buffer);

    expect(packet).toBeDefined();
    expect(packet.type).toBe(1);
    expect(packet.size).toBe(3);
    expect(packet.payload).toEqual(Buffer.from([1, 2, 0]));
    expect(packet.crcError).toBe(false);
  });

  it('should detect checksum errors', () => {
    const buffer = Buffer.from([36, 77, 62, 3, 1, 1, 2, 0, 99]); // Wrong checksum

    const packet = MSP.parse(buffer);

    expect(packet.crcError).toBe(true);
  });
});

describe('MSP Parser', () => {
  it('should correctly parse a simple MSP packet', () => {
    // MSP_API_VERSION response (ID: 1, Size: 3: protocol version, api major, api minor)
    // Packet: $M> (3) + size(3) + type(1) + payload(1, 2, 0) + checksum
    // Checksum: 3 ^ 1 ^ 1 ^ 2 ^ 0 = 1
    const buffer = Buffer.from([36, 77, 62, 3, 1, 1, 2, 0, 1]);

    const packet = MSP.parse(buffer);

    expect(packet).toBeDefined();
    expect(packet.type).toBe(1);
    expect(packet.size).toBe(3);
    expect(packet.payload).toEqual(Buffer.from([1, 2, 0]));
    expect(packet.crcError).toBe(false);
  });

  it('should detect checksum errors', () => {
    const buffer = Buffer.from([36, 77, 62, 3, 1, 1, 2, 0, 99]); // Wrong checksum

    const packet = MSP.parse(buffer);

    expect(packet.crcError).toBe(true);
  });
});
