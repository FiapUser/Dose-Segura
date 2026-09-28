package com.dosegura.api.exception;

/** Usuário autenticado tentando acessar um recurso que não é dele. Vira HTTP 403. */
public class AcessoNegadoException extends RuntimeException {
    public AcessoNegadoException() {
        super("Você não tem permissão para acessar este recurso.");
    }
}
