package com.dosegura.api.exception;

/** Dados enviados pelo cliente que violam uma regra de validação. Vira HTTP 400. */
public class DadosInvalidosException extends RuntimeException {
    public DadosInvalidosException(String mensagem) {
        super(mensagem);
    }
}
