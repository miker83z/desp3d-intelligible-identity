const crypto = require('crypto');
const {
  Secp256k1KeyPair,
  generate,
  resolve,
} = require('@transmute/did-key-secp256k1');
const secp256k1 = require('secp256k1');
const {
  getMultibaseFingerprintFromPublicKeyBytes,
} = require('./utils/getMultibaseFingerprintFromPublicKeyBytes');

/**
 * @description Provides the means to create and manage a DID Key.
 */
class KeyDid {
  /**
   * @description Creates an instance of KeyDid.
   * @param {Object} [keypairObject] The keypair wrapped in an object
   */
  constructor(keypairObject) {
    if (keypairObject !== undefined) {
      //if (keypairObject.publicKey === undefined)
      //  throw new Error('keyDid: public key not set');
      if (keypairObject.privateKey === undefined)
        throw new Error('keyDid: private key not set');

      if (keypairObject.publicKey === undefined)
        keypairObject.publicKey = secp256k1.publicKeyCreate(
          keypairObject.privateKey
        );
      else
        keypairObject.publicKey = secp256k1.publicKeyConvert(
          keypairObject.publicKey
        );

      this.publicKey = keypairObject.publicKey;
      this.privateKey = keypairObject.privateKey;
    }
  }

  /**
   * @description Create DID Document
   */
  async createDIDDocument() {
    if (this.publicKey === undefined) {
      const { didDocument, keys } = await generate(
        {
          secureRandom: () => {
            return crypto.randomBytes(32);
          },
        },
        { accept: 'application/did+json' }
      );
      return { didDocument, keys };
    } else {
      const fingerprint = getMultibaseFingerprintFromPublicKeyBytes(
        this.publicKey
      );
      const controller = `did:key:${fingerprint}`;
      const id = `${controller}#${fingerprint}`;

      const k = new Secp256k1KeyPair({
        id: id,
        type: 'JsonWebKey2020',
        controller: controller,
        publicKey: this.publicKey,
        privateKey: this.privateKey,
      });

      const keys = await k.export({
        type: 'JsonWebKey2020',
        privateKey: true,
      });

      const { didDocument } = await resolve(k.controller, {
        accept: 'application/did+json',
      });

      return { didDocument, keys: [keys] };
    }
  }
}

module.exports = { KeyDid };
