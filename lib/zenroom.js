const { zencode_exec } = require('zenroom');
const fs = require('fs');
const path = require('path');
const secp256k1 = require('secp256k1');

/**
 * @description Provides the means to create and manage a DID in Ethereum.
 */
class Zenroom {
  /**
   * @description Creates an instance of Zenroom.
   */
  constructor(path) {
    if (path === undefined) {
      path = './templates/zencode';
    }
    this.zencodePath = path;
  }

  /**
   * @description Generate keypair using Zenroom
   */
  async createKeypair() {
    const zencode = fs.readFileSync(
      path.resolve(__dirname, `${this.zencodePath}/create-keypair.zen`),
      {
        encoding: 'utf8',
        flag: 'r',
      }
    );

    const result = await zencode_exec(zencode, {
      conf: `color=0, debug=0`, //, rngseed=hex:${hex.slice(2)},
    });

    const pubKeyString = JSON.parse(result.result).DIDController.keypair
      .public_key;
    const privKeyString = JSON.parse(result.result).DIDController.keypair
      .private_key;

    const publicKey = secp256k1.publicKeyConvert(
      Uint8Array.from(atob(pubKeyString), (c) => c.charCodeAt(0))
    );
    const privateKey = Uint8Array.from(atob(privKeyString), (c) =>
      c.charCodeAt(0)
    );
    return { publicKey, privateKey };
  }
}

module.exports = { Zenroom };
