// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract GlazeMarket is AccessControl {

    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

    struct Transaccion {
        uint256 idProducto;
        address vendedor;
        address comprador;
        uint256 valor;
        uint256 fecha;
        string referenciaPago;
    }

    Transaccion[] public transacciones;
    mapping(uint256 => uint256[]) public transaccionesPorProducto;

    event TransaccionRegistrada(
        uint256 indexed idProducto,
        address vendedor,
        address comprador,
        uint256 valor,
        string referenciaPago
    );

    constructor(address backend) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender); // tú (admin)
        _grantRole(BACKEND_ROLE, backend); // tu servidor
    }

    function registrarTransaccion(
        uint256 idProducto,
        address vendedor,
        address comprador,
        uint256 valor,
        string memory referenciaPago
    ) external onlyRole(BACKEND_ROLE) {

        transacciones.push(Transaccion({
            idProducto: idProducto,
            vendedor: vendedor,
            comprador: comprador,
            valor: valor,
            fecha: block.timestamp,
            referenciaPago: referenciaPago
        }));

        uint256 index = transacciones.length - 1;
        transaccionesPorProducto[idProducto].push(index);

        emit TransaccionRegistrada(
            idProducto,
            vendedor,
            comprador,
            valor,
            referenciaPago
        );
    }

    function obtenerTransaccionesPorProducto(uint256 idProducto) 
        external view returns (Transaccion[] memory) {

        uint256[] memory indices = transaccionesPorProducto[idProducto];
        Transaccion[] memory resultado = new Transaccion[](indices.length);

        for (uint256 i = 0; i < indices.length; i++) {
            resultado[i] = transacciones[indices[i]];
        }

        return resultado;
    }

    function totalTransacciones() external view returns (uint256) {
        return transacciones.length;
    }
}