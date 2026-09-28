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

    /** Cuidador pedindo para cuidar de um paciente. */
    public static final String TIPO_CUIDADO = "CUIDADO";
    /** Paciente pedindo para ter um cuidador. */
    public static final String TIPO_RESPONSAVEL = "RESPONSAVEL";

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
    private String tipo = TIPO_CUIDADO;

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
}
