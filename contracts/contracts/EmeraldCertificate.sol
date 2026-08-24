// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract EmeraldCertificate is ERC721, AccessControl {

    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

    uint256 private _tokenIdCounter;

    // ==========================
    // 📦 ESTRUCTURA NFT
    // ==========================
    struct Esmeralda {
        uint256 idProducto;
        string tipoProducto;
        string color;
        string peso;
        string origen;
        uint256 valor;
        address vendedor;
        uint256 fechaRegistro;
    }

    mapping(uint256 => Esmeralda) public esmeraldas;
    mapping(uint256 => uint256) public productoAToken;

    // Estado de venta
    mapping(uint256 => bool) public enVenta;

    // ==========================
    // 📢 EVENTOS
    // ==========================
    event CertificadoEmitido(
        uint256 indexed tokenId,
        uint256 indexed idProducto,
        address vendedor
    );

    event EstadoVentaCambiado(
        uint256 indexed tokenId,
        bool enVenta
    );

    event NFTTransferido(
        uint256 indexed tokenId,
        address from,
        address to
    );

    // ==========================
    // ⚙️ CONSTRUCTOR
    // ==========================
    constructor(address backend) ERC721("Glaze Emerald Certificate", "GEC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BACKEND_ROLE, backend);
    }

    // ==========================
    // 🪙 MINT (REGISTRO PRODUCTO)
    // ==========================
    function mintCertificado(
        address vendedor,
        uint256 idProducto,
        string memory tipoProducto,
        string memory color,
        string memory peso,
        string memory origen,
        uint256 valor
    ) external onlyRole(BACKEND_ROLE) returns (uint256) {

        require(productoAToken[idProducto] == 0, "Ya existe este producto");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(vendedor, tokenId);

        esmeraldas[tokenId] = Esmeralda({
            idProducto: idProducto,
            tipoProducto: tipoProducto,
            color: color,
            peso: peso,
            origen: origen,
            valor: valor,
            vendedor: vendedor,
            fechaRegistro: block.timestamp
        });

        productoAToken[idProducto] = tokenId;

        enVenta[tokenId] = true;

        emit CertificadoEmitido(tokenId, idProducto, vendedor);

        return tokenId;
    }

    // ==========================
    // 💰 CAMBIAR ESTADO DE VENTA
    // ==========================
    function setEnVenta(uint256 tokenId, bool estado)
        external
        onlyRole(BACKEND_ROLE)
    {
        require(_exists(tokenId), "Token no existe");
        enVenta[tokenId] = estado;

        emit EstadoVentaCambiado(tokenId, estado);
    }

    // ==========================
    // 🔁 TRANSFERENCIA (COMPRA)
    // ==========================
    function transferirCertificado(
        address from,
        address to,
        uint256 tokenId
    ) external onlyRole(BACKEND_ROLE) {

        require(_exists(tokenId), "Token no existe");
        require(ownerOf(tokenId) == from, "No es el propietario actual");
        require(enVenta[tokenId] == true, "NFT no esta en venta");

        enVenta[tokenId] = false;

        safeTransferFrom(from, to, tokenId);

        emit NFTTransferido(tokenId, from, to);
    }

    // ==========================
    // 🔍 CONSULTAS
    // ==========================
    function obtenerEsmeralda(uint256 tokenId)
        external
        view
        returns (Esmeralda memory)
    {
        require(_exists(tokenId), "Token no existe");
        return esmeraldas[tokenId];
    }

    function obtenerTokenPorProducto(uint256 idProducto)
        external
        view
        returns (uint256)
    {
        return productoAToken[idProducto];
    }

    function estaEnVenta(uint256 tokenId)
        external
        view
        returns (bool)
    {
        return enVenta[tokenId];
    }

    // ==========================
    // ⚙️ OVERRIDE
    // ==========================
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}