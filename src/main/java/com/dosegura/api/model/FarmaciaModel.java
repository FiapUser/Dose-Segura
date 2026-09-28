package com.dosegura.api.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "farmacias")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FarmaciaModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomeUnidade;

    @Column(unique = true, nullable = false)
    private String cnpj;

    private String endereco;
    private String telefone;
    private Double taxaEntrega;
    private Integer tempoEntregaMinutos;

    /** Foto da unidade da farmácia (Cloudinary). */
    @Column(length = 500)
    private String urlImagem;

    @Column(length = 200)
    private String urlImagemPublicId;

    /**
     * Conta (CNPJ) dona da farmácia: quem pode enviar a foto da unidade.
     * Quando vazio, vale a regra do fornecedor responsável.
     */
    @ManyToOne
    @JoinColumn(name = "responsavel_id")
    @JsonIgnoreProperties({"senha", "cuidador", "responsavel"})
    private PacienteModel responsavel;

    @ManyToOne
    @JoinColumn(name = "fornecedor_id", nullable = false)
    private FornecedorModel fornecedor;
}
