//base58 https://github.com/transmute-industries/verifiable-data/blob/e11343edad2be21118cce2b1206df12b715f7cea/packages/secp256k1-key-pair/src/encoding/base58.ts
const { base } = require('./base-x');
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const base58 = base(ALPHABET);

//base64url https://github.com/transmute-industries/verifiable-data/blob/e11343edad2be21118cce2b1206df12b715f7cea/packages/secp256k1-key-pair/src/encoding/base64url.ts
const base64 = {
  encode: (unencoded) => {
    return Buffer.from(unencoded || '').toString('base64');
  },
  decode: (encoded) => {
    return Buffer.from(encoded || '', 'base64').toString('utf8');
  },
};

const base64url = {
  encode: (unencoded) => {
    var encoded = base64.encode(unencoded);
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  },
  decode: (encoded) => {
    encoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (encoded.length % 4) encoded += '=';
    return base64.decode(encoded);
  },
};

/**
 * 0xe7 indicates a Secp256k1 public key
 *
 */
const SECP256K1_MULTICODEC_IDENTIFIER = 0xe7;
/**
 * 0x01 indicates the end of the leading bytes according to variable integer spec
 * @see https://github.com/multiformats/multicodec
 * @ignore
 */
const VARIABLE_INTEGER_TRAILING_BYTE = 0x01;
/**
 * z represents the multibase encoding scheme of base58 encoding
 * @see https://github.com/multiformats/multibase/blob/master/multibase.csv#L18
 * @ignore
 */
const MULTIBASE_ENCODED_BASE58_IDENTIFIER = 'z';

const getMultibaseFingerprintFromPublicKeyBytes = (
  publicKey,
  encoding = 'base58btc'
) => {
  const buffer = new Uint8Array(2 + publicKey.length);
  buffer[0] = SECP256K1_MULTICODEC_IDENTIFIER;
  buffer[1] = VARIABLE_INTEGER_TRAILING_BYTE;
  buffer.set(publicKey, 2);
  if (encoding === 'base58btc') {
    return `z${base58.encode(buffer)}`;
  }
  if (encoding === 'base64url') {
    return `u${base64url.encode(buffer)}`;
  }
  throw new Error('Unsupported encoding: ' + encoding);
};

module.exports = { getMultibaseFingerprintFromPublicKeyBytes };
