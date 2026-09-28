package com.dosegura.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificacoes_sistema")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificacaoModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "paciente_id", nullable = false)
    private PacienteModel paciente;
    @Column(nullable = false)
    private String titulo;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensagem;
    @Column(nullable = false)
    private LocalDateTime dataDisparo;
    private Boolean lida = false;
}
