package com.dosegura.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "agenda_inteligente")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgendaModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "paciente_id", nullable = false)
    private PacienteModel paciente;
    @Column(nullable = false)
    private String tipo;
    @Column(nullable = false)
    private String titulo;
    private String dosagem;
    @Column(nullable = false)
    private LocalDateTime horarioInicio;
    private Integer frequenciaHoras;
    @Column(columnDefinition = "TEXT")
    private String observacoes;
    private Boolean concluido = false;
}
