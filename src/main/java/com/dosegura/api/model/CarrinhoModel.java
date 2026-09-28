package com.dosegura.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carrinhos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CarrinhoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "paciente_id", nullable = false)
    private PacienteModel paciente;

    @OneToMany(mappedBy = "carrinho", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ItemCarrinhoModel> itens = new ArrayList<>();

    public Double getTotal() {
        return itens.stream().mapToDouble(ItemCarrinhoModel::getSubtotal).sum();
    }
}
