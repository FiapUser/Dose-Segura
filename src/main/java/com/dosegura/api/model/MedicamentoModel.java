package com.dosegura.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "medicamentos_marketplace")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicamentoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    private String dosagem;
    private String fabricante;

    @Column(nullable = false)
    private Double preco;

    @Column(nullable = false)
    private Double precoOriginal;

    private Integer descontoPorcentagem = 0;

    @Column(nullable = false)
    private Boolean descontoSelecionado = false;

    @Column(nullable = false)
    private Integer estoqueDisponivel;

    @Column(nullable = false)
    private Integer estoqueFabricante;

    @Column(length = 500)
    private String urlImagem;

    @Column(length = 200)
    private String urlImagemPublicId;

    @Column(length = 400)
    private String descricao;

    @Column(length = 120)
    private String principioAtivo;

    @Column(length = 60)
    private String categoria;

    @ManyToOne
    @JoinColumn(name = "fornecedor_id", nullable = false)
    private FornecedorModel fornecedor;
}
