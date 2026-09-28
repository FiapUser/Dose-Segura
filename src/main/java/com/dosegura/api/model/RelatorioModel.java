package com.dosegura.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "relatorios_saude")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "paciente_id", nullable = false)
    private PacienteModel paciente;

    @ManyToOne
    @JoinColumn(name = "cuidador_id", nullable = false)
    private PacienteModel familiarCuidador;

    private LocalDateTime dataGeracao;

    @Column(nullable = false)
    private String periodoDeterminado;

    @Column(columnDefinition = "TEXT")
    private String dadosSaudeAtualizados;

    @Column(columnDefinition = "TEXT")
    private String historicoComprasPeriodo;
}
