package com.dosegura.api.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Respostas de erro padronizadas: { "codigo": "...", "mensagem": "..." }.
 * O front usa o status (401 = sessão inválida, 403 = sem permissão) e o campo codigo.
 */
@RestControllerAdvice
public class TratadorDeExcecoes {

    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<Map<String, String>> acessoNegado(AcessoNegadoException e) {
        return resposta(HttpStatus.FORBIDDEN, "ACESSO_NEGADO", e.getMessage());
    }

    @ExceptionHandler(NaoAutenticadoException.class)
    public ResponseEntity<Map<String, String>> naoAutenticado(NaoAutenticadoException e) {
        return resposta(HttpStatus.UNAUTHORIZED, "NAO_AUTENTICADO", e.getMessage());
    }

    @ExceptionHandler(DadosInvalidosException.class)
    public ResponseEntity<Map<String, String>> dadosInvalidos(DadosInvalidosException e) {
        return resposta(HttpStatus.BAD_REQUEST, "DADOS_INVALIDOS", e.getMessage());
    }

    // Violação de unicidade (e-mail, CPF, CNPJ) ou de vínculo. A mensagem é genérica de propósito,
    // para não revelar qual dado já está cadastrado.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> conflito(DataIntegrityViolationException e) {
        return resposta(HttpStatus.CONFLICT, "CONFLITO_DE_DADOS",
                "Não foi possível concluir a operação: os dados informados conflitam com registros existentes.");
    }

    private ResponseEntity<Map<String, String>> resposta(HttpStatus status, String codigo, String mensagem) {
        Map<String, String> corpo = new LinkedHashMap<>();
        corpo.put("codigo", codigo);
        corpo.put("mensagem", mensagem);
        return ResponseEntity.status(status).body(corpo);
    }
}
