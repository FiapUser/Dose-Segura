package com.dosegura.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "itens_carrinho")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemCarrinhoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "carrinho_id", nullable = false)
    @JsonIgnore
    private CarrinhoModel carrinho;

    @ManyToOne
    @JoinColumn(name = "medicamento_id", nullable = false)
    private MedicamentoModel medicamento;

    @Column(nullable = false)
    private Integer quantidade;

    public Double getSubtotal() {
        if (medicamento == null || quantidade == null) {
            return 0.0;
        }
        return medicamento.getPreco() * quantidade;
    }
}
