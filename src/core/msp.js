/* eslint-disable no-bitwise, no-plusplus */
export default class MSP {
  static CMD = {
    API_VERSION: 1,
    FC_VARIANT: 2,
    FC_VERSION: 3,
    BOARD_INFO: 4,
    BUILD_INFO: 5,
    FEATURE: 36,
    BOARD_ALIGNMENT_CONFIG: 38,
    CLI: 216,
  };

  /**
     * Parses a buffer into an MSP packet.
     * @param {Buffer} buffer
     * @returns {Object} Packet object.
     */
  static parse(buffer) {
    // Basic MSP v1 parser
    // $ M < / > [size] [type] [payload] [crc]
    if (buffer.length < 6) return null;

    const size = buffer[3];
    const type = buffer[4];
    const payload = buffer.slice(5, 5 + size);
    const expectedCrc = buffer[5 + size];

    let crc = size ^ type;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload[i];
    }

    return {
      size,
      type,
      payload,
      crcError: crc !== expectedCrc,
    };
  }

  /**
     * Encodes a command into an MSP packet.
     * @param {number} type Command ID.
     * @param {Buffer} payload Payload buffer.
     * @returns {Buffer} Encoded MSP packet.
     */
  static encode(type, payload = Buffer.alloc(0)) {
    const size = payload.length;
    const buffer = Buffer.alloc(size + 6);

    buffer[0] = 36; // $
    buffer[1] = 77; // M
    buffer[2] = 60; // <
    buffer[3] = size;
    buffer[4] = type;

    payload.copy(buffer, 5);

    let crc = size ^ type;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload[i];
    }
    buffer[size + 5] = crc;

    return buffer;
  }
}
