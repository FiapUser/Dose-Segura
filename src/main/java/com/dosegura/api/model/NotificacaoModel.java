package com.dosegura.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Alerta da área de notificações.
 *
 * <p>É gravada no banco: o histórico de alertas fica disponível para consulta.
 * Quando o alerta é uma resposta possível (pedido de vínculo), {@code acaoTipo}
 * e {@code acaoId} permitem abrir os botões aceitar/recusar na tela.</p>
 */
@Entity
@Table(name = "notificacoes_sistema")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificacaoModel {

    /** Marca o alerta com os botões de aceitar/recusar vínculo de cuidado. */
    public static final String ACAO_VINCULO = "VINCULO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "paciente_id", nullable = false)
    @JsonIgnoreProperties({"senha", "cuidador"})
    private PacienteModel paciente;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensagem;

    @Column(nullable = false)
    private LocalDateTime dataDisparo = LocalDateTime.now();

    private Boolean lida = false;

    /** "VINCULO" ou null. */
    @Column(length = 30)
    private String acaoTipo;

    /** Id do pedido de vínculo (quando acaoTipo = VINCULO). */
    private Long acaoId;
}
