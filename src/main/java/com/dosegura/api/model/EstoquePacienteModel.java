package com.dosegura.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "estoque_pacientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EstoquePacienteModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "paciente_id", nullable = false)
    private PacienteModel paciente;

    @Column(nullable = false)
    private String nomeMedicamento;

    @Column(nullable = false)
    private Integer quantidadeAtualComprimidos;

    @Column(nullable = false)
    private Integer consumoDiarioComprimidos;

    public Integer getDiasRestantes() {
        if (consumoDiarioComprimidos == null || consumoDiarioComprimidos <= 0) {
            return 0;
        }
        return quantidadeAtualComprimidos / consumoDiarioComprimidos;
    }
}
