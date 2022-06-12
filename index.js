const { IdentityWeb3 } = require('./lib/web3');
const { IdentityMeta } = require('./lib/meta');
const { KeyDid } = require('./lib/key-did');
const { Zenroom } = require('./lib/zenroom');
const { NoStandardSignatureDoc } = require('intelligible-nostdsign-doc');

/**
 * @description Represents an Intelligible Identity and includes tha objects that compose it.
 * This allows to create a new Intelligible Identity by issuing the identity tokens, to handle
 * the metadata document and to reconstruct an identity from text.
 */
class IntelligibleIdentity {
  /**
   * @description: Creates an empty instance of IntelligibleIdentity.
   */
  constructor() {
    this.web3 = {};
    this.meta = {};
    this.information = {};
    this.references = {};
    this.hashDigest = {};
    this.signature = {};
  }

  /**
   * @description Creates a new web3 object by initializing the provider and the main
   * address and then it reserves a tokenId that can be lather used to issue a token
   * @param {Object} web3Provider The web3 provider
   * @param {number|string} mainAddress The selected main address or its
   * position within the provider accounts list
   * @param {string} [addressWeb3] The Ethereum address to send the token to
   * @param {number} [networkId] The id of the network where the provider operates
   * @param {Object} [intelligibleIdArtifact] The json object containing the contract abi
   */
  async prepareNewIdentityWeb3(
    web3Provider,
    mainAddress,
    addressWeb3,
    networkId,
    intelligibleIdArtifact
  ) {
    this.web3 = new IdentityWeb3(
      web3Provider,
      networkId,
      intelligibleIdArtifact
    );
    await this.web3.setMainAddress(mainAddress);
    await this.web3.reserveTokenId();
    if (addressWeb3 === undefined) {
      // addressWeb3 = this.web3.newAddress();
      addressWeb3 = this.web3.mainAddress;
    }
    this.web3.address = addressWeb3;
  }

  /**
   * @description Finalizes a web3 object by issuing the token, after it has been prepared
   * @param {string} uri The token uri. (Possibly an hash pointer).
   */
  async finalizeNewIdentityWeb3(uri) {
    if (!this.web3.mainAddress || !this.web3.provider || !this.web3.address) {
      throw new Error('identity: You need to prepare a web3 object first');
    }
    await this.web3.newTokenFromReserved(uri);
  }

  /**
   * @description Sets the personal information of a newly created intelligible identity
   * @param {Object} information Identity's personal information object
   * @param {Object} references Identity's references object
   */
  setIdentityInformation(information, references) {
    this.information = JSON.parse(JSON.stringify(information));
    this.references = JSON.parse(JSON.stringify(references));
  }

  /**
   * @description Creates a new meta object fetching the information from the personal
   * information object
   * @param {Object} [information] Identity's personal information object
   * @param {Object} [references] Identity's references object
   */
  async newIdentityMeta(information, references) {
    if (!this.information || !this.references) {
      throw new Error(
        'identity: You need to set identity information and references first'
      );
    }
    this.setIdentityInformation(information, references);

    // Meta document
    this.meta = new IdentityMeta(this.information, this.references);
  }

  /**
   * @description Creates a new signature object that represents a signature on the
   * Identity's meta object (hash digest).
   * @param {boolean} [optionalNoPersonalSign] The option for signing with eth.personal.sign
   * (if true) or eth.sign (if false)
   * @param {string} hashDigest Identity's meta object hash
   */
  async signIdentity(optionalNoPersonalSign, hashDigest) {
    if (hashDigest !== undefined) {
      this.hashDigest = hashDigest;
    } else {
      throw new Error('identity: You need to set identity hash digest first');
    }
    let createdWeb3 = !!Object.keys(this.web3).length && !!this.web3.tokenId;

    //Signature
    if (createdWeb3) {
      const signat = await this.web3.signData(
        hashDigest,
        optionalNoPersonalSign
      );
      this.signature = new NoStandardSignatureDoc();
      this.signature.addSignature(
        '#iidIssuer',
        this.references.iidIssuer.entity,
        Date.now(),
        signat
      );
    }
  }

  /**
   * @description Creates and return the DID of the NFT holding the iid data
   * @param {string} nftDID Identity's NDF did
   */
  async getNFTdid() {
    return `did:nft:eip155:${await this.web3.web3.eth.getChainId()}_erc721:${
      this.web3.contract.options.address
    }_${this.web3.tokenId}`;
  }

  /**
   * @description Creates a web3 instance from an Ethereum address by searching for the last Identity
   * token issued to this. It returns the token URI used to derive/obtain the meta document.
   * @param {Object} web3Provider The web3 provider
   * @param {number|string} mainAddress The selected main address or its
   * position within the provider accounts list
   * @param {string} [addressWeb3] The address the token was issued to. If undefined the main address
   * will be used instead
   * @param {number} [networkId] The id of the network where the provider operates
   * @param {Object} [intelligibleIdArtifact] The json object containing the contract abi
   * @return {string} The token URI
   */
  async fromWeb3Address(
    web3Provider,
    mainAddress,
    addressWeb3,
    networkId,
    intelligibleIdArtifact
  ) {
    this.web3 = new IdentityWeb3(
      web3Provider,
      networkId,
      intelligibleIdArtifact
    );
    await this.web3.setMainAddress(mainAddress);
    if (addressWeb3 === undefined) {
      // addressWeb3 = this.web3.newAddress();
      addressWeb3 = this.web3.mainAddress;
    }
    return await this.web3.getTokenByAddress(addressWeb3); //tokenURI
  }

  /**
   * @description Creates a web3 instance from a token id. It returns the token URI used to derive/obtain
   * the meta document.
   * @param {Object} web3Provider The web3 provider
   * @param {number|string} mainAddress The selected main address or its
   * position within the provider accounts list
   * @param {string} tokenId The token id
   * @param {number} [networkId] The id of the network where the provider operates
   * @param {Object} [intelligibleIdArtifact] The json object containing the contract abi
   * @return {string} The token URI
   */
  async fromWeb3TokenId(
    web3Provider,
    mainAddress,
    tokenId,
    networkId,
    intelligibleIdArtifact
  ) {
    this.web3 = new IdentityWeb3(
      web3Provider,
      networkId,
      intelligibleIdArtifact
    );
    await this.web3.setMainAddress(mainAddress);
    return await this.web3.getTokenById(tokenId); //tokenURI
  }

  /**
   * @description Creates a web3 instance from a NFT DID. It returns the token URI used to derive/obtain
   * the meta document.
   * @param {Object} web3Provider The web3 provider
   * @param {number|string} mainAddress The selected main address or its
   * position within the provider accounts list
   * @param {string} nftDID The token NFT DID
   * @param {number} [networkId] The id of the network where the provider operates
   * @param {Object} [intelligibleIdArtifact] The json object containing the contract abi
   * @return {string} The token URI
   */
  async fromNFTdid(
    web3Provider,
    mainAddress,
    nftDID,
    networkId,
    intelligibleIdArtifact
  ) {
    const contractAddress = nftDID.split(':')[4].split('_')[0];
    const tokenId = nftDID.split(':')[4].split('_')[1];
    this.web3 = new IdentityWeb3(
      web3Provider,
      networkId,
      intelligibleIdArtifact,
      contractAddress
    );
    await this.web3.setMainAddress(mainAddress);
    return await this.web3.getTokenById(tokenId); //tokenURI
  }

  /**
   * @description Creates an meta instance from a string that represents the Meta document
   * @param {string} aknDocumentString The string that represents the XML document
   */
  async fromStringMeta(
    aknDocumentString,
    web3Provider,
    web3address,
    networkId,
    intelligibleIdArtifact
  ) {
    this.meta = IdentityMeta.fromString(aknDocumentString);
    const { information, references } =
      this.meta.parseInformationAndReferences();
    this.setIdentityInformation(information, references);

    if (web3Provider !== undefined) {
      if (web3address === undefined) {
        throw new Error('identity: You need to set the web3 address');
      }
      this.web3 = new IdentityWeb3(
        web3Provider,
        networkId,
        intelligibleIdArtifact
      );
      this.web3.address = web3address;
    }
  }

  /**
   * @description Creates a signature instance from a string that represents the signature document
   * @param {string} signatureDocumentString The string that represents the signature XML document
   */
  async fromStringSignature(signatureDocumentString) {
    this.signature = NoStandardSignatureDoc.fromString(signatureDocumentString);
  }
}

module.exports = {
  IdentityWeb3,
  IdentityMeta,
  KeyDid,
  Zenroom,
  IntelligibleIdentity,
};
