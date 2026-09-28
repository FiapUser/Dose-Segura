package com.dosegura.api.model;

import java.time.LocalDateTime;

/**
 * Alerta exibido na área de notificações.
 *
 * <p>Não é entidade: os alertas ficam em memória e desaparecem quando a aplicação
 * reinicia (o histórico não é salvo em banco).</p>
 */
public class AlertaUsuario {

    private String id;
    private Long destinatarioId;
    private String titulo;
    private String mensagem;
    private LocalDateTime dataDisparo;
    private boolean lida;

    /** Ação opcional: base para o botão "Aceitar"/"Recusar" na área de notificações. */
    private String acaoTipo;
    private Long acaoId;

    public AlertaUsuario() {
    }

    public AlertaUsuario(String id, Long destinatarioId, String titulo, String mensagem,
                         LocalDateTime dataDisparo, String acaoTipo, Long acaoId) {
        this.id = id;
        this.destinatarioId = destinatarioId;
        this.titulo = titulo;
        this.mensagem = mensagem;
        this.dataDisparo = dataDisparo;
        this.acaoTipo = acaoTipo;
        this.acaoId = acaoId;
        this.lida = false;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getDestinatarioId() {
        return destinatarioId;
    }

    public void setDestinatarioId(Long destinatarioId) {
        this.destinatarioId = destinatarioId;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public LocalDateTime getDataDisparo() {
        return dataDisparo;
    }

    public void setDataDisparo(LocalDateTime dataDisparo) {
        this.dataDisparo = dataDisparo;
    }

    public boolean isLida() {
        return lida;
    }

    public void setLida(boolean lida) {
        this.lida = lida;
    }

    public String getAcaoTipo() {
        return acaoTipo;
    }

    public void setAcaoTipo(String acaoTipo) {
        this.acaoTipo = acaoTipo;
    }

    public Long getAcaoId() {
        return acaoId;
    }

    public void setAcaoId(Long acaoId) {
        this.acaoId = acaoId;
    }
}
