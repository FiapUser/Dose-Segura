package com.dosegura.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Pedido de vínculo de cuidado.
 *
 * <p>Substitui o vínculo imediato: antes bastava informar o e-mail (ou a senha) da
 * outra conta. Agora quem solicita envia o pedido, e o <b>destinatário confirma na
 * área de notificações</b> se deseja vincular. Só aí o cuidador é gravado.</p>
 *
 * <p>Tipos (do ponto de vista de quem solicita):</p>
 * <ul>
 *   <li>{@code PRESTAR_CUIDADO}: eu quero cuidar de alguém — eu viro o cuidador;</li>
 *   <li>{@code RECEBER_CUIDADO}: eu quero alguém cuidando de mim — eu viro o paciente.</li>
 * </ul>
 */
@Entity
@Table(name = "solicitacoes_vinculo",
        indexes = {@Index(name = "idx_solicitacao_destinatario", columnList = "destinatario_id,status")})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolicitacaoVinculoModel {

    public static final String STATUS_PENDENTE = "PENDENTE";
    public static final String STATUS_ACEITA = "ACEITA";
    public static final String STATUS_RECUSADA = "RECUSADA";
    public static final String STATUS_CANCELADA = "CANCELADA";

    /** Quero cuidar de alguém: eu sou o cuidador. */
    public static final String PRESTAR_CUIDADO = "PRESTAR_CUIDADO";

    /** Quero que alguém cuide de mim: eu sou o paciente. */
    public static final String RECEBER_CUIDADO = "RECEBER_CUIDADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "solicitante_id", nullable = false)
    @JsonIgnoreProperties({"senha", "cuidador"})
    private PacienteModel solicitante;

    @ManyToOne
    @JoinColumn(name = "destinatario_id", nullable = false)
    @JsonIgnoreProperties({"senha", "cuidador"})
    private PacienteModel destinatario;

    @Column(length = 30, nullable = false)
    private String tipo = PRESTAR_CUIDADO;

    @Column(length = 30, nullable = false)
    private String status = STATUS_PENDENTE;

    @Column(length = 400)
    private String mensagem;

    @Column(nullable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    private LocalDateTime respondidoEm;

    @JsonIgnore
    public boolean isPendente() {
        return STATUS_PENDENTE.equals(status);
    }

    /** Descrição curta do pedido, exposta para a interface. */
    public String getTipoRotulo() {
        return RECEBER_CUIDADO.equals(tipo)
                ? "Quero que alguém cuide de mim"
                : "Quero cuidar de alguém";
    }
}
