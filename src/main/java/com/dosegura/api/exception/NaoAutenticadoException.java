package com.dosegura.api.exception;

/** Sessão ausente, inválida ou de um usuário que não existe mais. Vira HTTP 401. */
public class NaoAutenticadoException extends RuntimeException {
    public NaoAutenticadoException() {
        super("Sessão inválida ou expirada.");
    }
}
